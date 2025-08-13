import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('=== PayTabs Configuration Test ===');
console.log('PAYTAB_PROFILE_ID:', process.env.PAYTAB_PROFILE_ID);
console.log('PAYTAB_SERVER_KEY:', process.env.PAYTAB_SERVER_KEY ? '***' + process.env.PAYTAB_SERVER_KEY.slice(-4) : 'undefined');
console.log('PAYTAB_CLIENT_KEY:', process.env.PAYTAB_CLIENT_KEY ? '***' + process.env.PAYTAB_CLIENT_KEY.slice(-4) : 'undefined');
console.log('PAYTAB_BASE_URL:', process.env.PAYTAB_BASE_URL);
console.log('PAYTAB_MERCHANT_EMAIL:', process.env.PAYTAB_MERCHANT_EMAIL);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('SERVER_URL:', process.env.SERVER_URL);

// Test signature generation
import crypto from 'crypto';

const testSignature = (merchantEmail, serverKey, referenceNumber, amount, currency) => {
  const parts = [
    String(merchantEmail || '').trim(),
    String(serverKey || '').trim(),
    String(referenceNumber || '').trim(),
    String(amount || '').trim(),
    String(currency || '').trim()
  ];
  const signatureString = parts.join('');
  const signature = crypto.createHash('sha256').update(signatureString).digest('hex');
  return { signatureString, signature };
};

console.log('\n=== Signature Test ===');
const testData = {
  merchantEmail: process.env.PAYTAB_MERCHANT_EMAIL || 'test@example.com',
  serverKey: process.env.PAYTAB_SERVER_KEY || 'test_key',
  referenceNumber: 'FUND_123_1234567890',
  amount: '100',
  currency: 'PKR'
};

const signatureResult = testSignature(
  testData.merchantEmail,
  testData.serverKey,
  testData.referenceNumber,
  testData.amount,
  testData.currency
);

console.log('Test signature string:', signatureResult.signatureString);
console.log('Test signature:', signatureResult.signature);
console.log('===================================');
