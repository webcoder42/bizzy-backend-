// Test script for Payout API endpoints
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1/payout';

// Test token (you'll need to replace this with a valid token)
const TEST_TOKEN = 'your-test-token-here';

const testEndpoints = async () => {
  console.log('🧪 Testing Payout API Endpoints...\n');

  try {
    // Test 1: Get user data
    console.log('1. Testing GET /user-data');
    try {
      const response = await axios.get(`${API_BASE_URL}/user-data`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Get connected accounts
    console.log('\n2. Testing GET /connected-accounts');
    try {
      const response = await axios.get(`${API_BASE_URL}/connected-accounts`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 3: Get tax details
    console.log('\n3. Testing GET /tax-details');
    try {
      const response = await axios.get(`${API_BASE_URL}/tax-details`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 4: Submit tax details
    console.log('\n4. Testing POST /tax-details');
    try {
      const taxData = {
        fullName: 'John Doe',
        taxIdentificationNumber: '123456789',
        country: 'United States',
        taxDocumentUrl: ''
      };
      const response = await axios.post(`${API_BASE_URL}/tax-details`, taxData, {
        headers: { 
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 5: Connect account
    console.log('\n5. Testing POST /connect-account');
    try {
      const accountData = {
        withdrawalMethod: 'manual',
        accountHolderName: 'John Doe',
        accountNumber: '123456789',
        routingNumber: '123456789',
        swiftCode: 'ABCDEF12',
        country: 'United States',
        currency: 'USD',
        bankAddress: '123 Main St, City, State 12345'
      };
      const response = await axios.post(`${API_BASE_URL}/connect-account`, accountData, {
        headers: { 
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run tests
testEndpoints(); 