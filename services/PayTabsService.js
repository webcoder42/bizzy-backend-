  // server/services/PayTabsService.js
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env from project root (one level up from services)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

class PayTabsService {
  constructor() {
    this.profileId = process.env.PAYTAB_PROFILE_ID
      ? process.env.PAYTAB_PROFILE_ID.trim()
      : undefined;
    this.serverKey = process.env.PAYTAB_SERVER_KEY
      ? process.env.PAYTAB_SERVER_KEY.trim()
      : undefined;
    this.clientKey = process.env.PAYTAB_CLIENT_KEY
      ? process.env.PAYTAB_CLIENT_KEY.trim()
      : undefined;
    this.baseUrl = process.env.PAYTAB_BASE_URL
      ? process.env.PAYTAB_BASE_URL.trim().replace(/\/+$/, '')
      : 'https://secure.paytabs.com';

    console.log('PayTabsService initialized with:', {
      profileId: this.profileId,
      serverKey: this.serverKey ? '***' + this.serverKey.slice(-4) : 'undefined',
      clientKey: this.clientKey ? '***' + this.clientKey.slice(-4) : 'undefined',
      baseUrl: this.baseUrl
    });
  }

  generateSignature(merchantEmail = '', secretKey = '', referenceNumber = '', amount = '', currency = '') {
    const parts = [
      String(merchantEmail || '').trim(),
      String(secretKey || '').trim(),
      String(referenceNumber || '').trim(),
      String(amount || '').trim(),
      String(currency || '').trim()
    ];
    const signatureString = parts.join('');
    console.log('Signature string:', signatureString);
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');
    console.log('Generated signature:', signature);
    return signature;
  }

  async createPaymentPage(paymentData = {}) {
    try {
      const profileId = this.profileId || (process.env.PAYTAB_PROFILE_ID || '').trim();
      const serverKey = this.serverKey || (process.env.PAYTAB_SERVER_KEY || '').trim();

      if (!profileId) throw new Error('PAYTAB_PROFILE_ID is not set in environment.');
      if (!serverKey) throw new Error('PAYTAB_SERVER_KEY is not set in environment.');

      const {
        amount,
        currency = 'PKR', // Default to PKR since profile supports only PKR
        referenceNumber,
        customerEmail,
        customerName,
        customerPhone,
        customerAddress,
        customerCity,
        customerCountry = 'PK',  // Pakistan
        customerZip,
        returnUrl,
        callbackUrl
      } = paymentData;

      if (!amount || !referenceNumber || !customerEmail) {
        throw new Error('Missing required paymentData fields: amount, referenceNumber, customerEmail are required.');
      }

      // Validate amount
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Invalid amount provided. Amount must be a positive number.');
      }

      // Check minimum amount (PayTabs might have minimum requirements)
      if (numericAmount < 1) {
        throw new Error('Amount must be at least 1 PKR.');
      }

      // Generate signature for request - PayTabs requires merchant email in signature
      const merchantEmail = process.env.PAYTAB_MERCHANT_EMAIL || customerEmail;
      const formattedAmount = parseFloat(amount).toFixed(2);
      const signature = this.generateSignature(merchantEmail, serverKey, referenceNumber, formattedAmount, currency);
      console.log('Signature generation params:', {
        merchantEmail,
        serverKey: serverKey ? '***' + serverKey.slice(-4) : 'undefined',
        referenceNumber,
        amount: formattedAmount,
        currency
      });

      const payload = {
        profile_id: parseInt(profileId, 10),
        tran_type: 'sale',
        tran_class: 'ecom',
        cart_id: referenceNumber,
        cart_description: 'Add Funds to Account',
        cart_currency: currency || 'PKR',
        cart_amount: parseFloat(amount).toFixed(2),
        cart_tax: 0,
        cart_tax_percentage: 0,
        cart_discount: 0,
        cart_discount_percentage: 0,
        cart_total: parseFloat(amount).toFixed(2),
        tran_total: parseFloat(amount).toFixed(2),
        customer_details: {
          name: customerName || '',
          email: customerEmail,
          phone: typeof customerPhone === 'object' ? customerPhone.number : (customerPhone || ''),
          street1: customerAddress || '',
          city: customerCity || '',
          state: '',
          country: customerCountry || 'PK',
          zip: customerZip || ''
        },
        shipping_details: {
          name: customerName || '',
          email: customerEmail,
          phone: typeof customerPhone === 'object' ? customerPhone.number : (customerPhone || ''),
          street1: customerAddress || '',
          city: customerCity || '',
          state: '',
          country: customerCountry || 'PK',
          zip: customerZip || ''
        },
        return: returnUrl || (process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/` : 'http://localhost:3000/'),
        callback: callbackUrl || (process.env.SERVER_URL ? `${process.env.SERVER_URL}/api/v1/planpurchase/paytabs-callback` : 'http://localhost:5000/api/v1/planpurchase/paytabs-callback'),
        hide_shipping: true,
        is_framed: false,
        is_hosted: true,
        show_billing_info: false,
        show_shipping_info: false,
        signature
      };

      console.log('Creating PayTabs payment page with payload:', JSON.stringify(payload, null, 2));

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': serverKey // **No Bearer prefix**
      };

      console.log('Making request to PayTabs API:', `${this.baseUrl}/payment/request`);
      console.log('Request headers:', headers);
      
      const response = await axios.post(`${this.baseUrl}/payment/request`, payload, {
        headers,
        timeout: 15000
      });

      console.log('PayTabs API response:', response.data);
      
      // Validate the response
      if (response.data.tran_total === '0' || response.data.tran_total === 0) {
        console.error('PayTabs returned zero transaction total. This might indicate a configuration issue.');
        console.error('Response details:', {
          cart_amount: response.data.cart_amount,
          tran_total: response.data.tran_total,
          profile_id: response.data.profileId,
          tran_ref: response.data.tran_ref
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('PayTabs createPaymentPage error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      const apiErr = error?.response?.data || error?.message || error;
      throw new Error(typeof apiErr === 'string' ? apiErr : (apiErr?.message || 'Failed to create PayTabs payment page'));
    }
  }

  async verifyPayment(transactionReference) {
    try {
      const profileId = this.profileId || (process.env.PAYTAB_PROFILE_ID || '').trim();
      const serverKey = this.serverKey || (process.env.PAYTAB_SERVER_KEY || '').trim();

      if (!profileId) throw new Error('PAYTAB_PROFILE_ID is not set in environment.');
      if (!serverKey) throw new Error('PAYTAB_SERVER_KEY is not set in environment.');
      if (!transactionReference) throw new Error('transactionReference is required for verifyPayment.');

      const payload = {
        profile_id: parseInt(profileId, 10),
        tran_ref: transactionReference
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': serverKey
      };

      const response = await axios.post(`${this.baseUrl}/payment/query`, payload, {
        headers,
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      const apiErr = error?.response?.data || error?.message || error;
      console.error('PayTabs verifyPayment error:', apiErr);
      throw new Error(typeof apiErr === 'string' ? apiErr : (apiErr?.message || 'Failed to verify PayTabs payment'));
    }
  }

  async processCallback(callbackData = {}) {
    try {
      const {
        tran_ref,
        resp_status,
        resp_code,
        resp_message,
        cart_id,
        cart_amount,
        cart_currency,
        customer_details,
        payment_result,
        signature: incomingSignature
      } = callbackData;

      const serverKey = this.serverKey || (process.env.PAYTAB_SERVER_KEY || '').trim();
      if (!serverKey) throw new Error('PAYTAB_SERVER_KEY not configured for signature verification.');

      const expectedSignature = this.generateSignature(
        (customer_details && customer_details.email) || '',
        serverKey,
        tran_ref,
        cart_amount,
        cart_currency
      );

      if (incomingSignature && expectedSignature !== incomingSignature) {
        console.error('Invalid PayTabs callback signature. expected:', expectedSignature, 'incoming:', incomingSignature);
        throw new Error('Invalid signature');
      }

      return {
        transactionReference: tran_ref,
        status: resp_status,
        code: resp_code,
        message: resp_message,
        cartId: cart_id,
        amount: cart_amount,
        currency: cart_currency,
        customerDetails: customer_details,
        paymentResult: payment_result,
        isValid: resp_status === 'A' && resp_code === '4000'
      };
    } catch (error) {
      console.error('PayTabs processCallback error:', error?.message || error);
      throw error;
    }
  }
}

export default new PayTabsService();
