#!/usr/bin/env node

// Test script to verify the address API endpoints are working correctly
// This tests both customer and supplier address endpoints

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// You'll need to update these with actual IDs from your database
const TEST_CONFIG = {
  workspaceId: 'sfo', // or actual workspace ID
  companyId: 'standfair', // or actual company ID
  customerId: '1be9536f-6305-471c-b86e-9c4e8e443567', // actual customer ID from the error
  supplierId: 'YOUR_SUPPLIER_ID', // replace with actual supplier ID
  authToken: process.env.AUTH_TOKEN || '' // Add your auth token
};

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
  // Add any other required headers
};

async function testEndpoint(method, url, body = null) {
  console.log(`\n📍 Testing ${method} ${url}`);
  
  try {
    const options = {
      method,
      headers,
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:', response.status);
      console.log('Error details:', JSON.stringify(data, null, 2));
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Starting Address API Tests\n');
  console.log('Configuration:', TEST_CONFIG);
  
  // Test Customer Address Endpoints
  console.log('\n=== CUSTOMER ADDRESS TESTS ===');
  
  // 1. List customer addresses
  const listUrl = `${BASE_URL}/api/workspaces/${TEST_CONFIG.workspaceId}/companies/${TEST_CONFIG.companyId}/customers/${TEST_CONFIG.customerId}/addresses`;
  await testEndpoint('GET', listUrl);
  
  // 2. Create a new customer address
  const newAddress = {
    addressType: 'billing',
    title: 'Test Address',
    address: '123 Test Street',
    district: 'Test District',
    city: 'Istanbul',
    postalCode: '34000',
    country: 'Türkiye',
    phone: '+90 555 123 4567',
    email: 'test@example.com',
    contactName: 'Test Contact',
    contactTitle: 'Manager',
    isDefault: false,
    isActive: true
  };
  
  const createResult = await testEndpoint('POST', listUrl, newAddress);
  
  if (createResult.success && createResult.data.address) {
    const addressId = createResult.data.address.id;
    console.log(`\n📝 Created address with ID: ${addressId}`);
    
    // 3. Get single address
    const getUrl = `${listUrl}/${addressId}`;
    await testEndpoint('GET', getUrl);
    
    // 4. Update the address
    const updateData = {
      title: 'Updated Test Address',
      city: 'Ankara'
    };
    await testEndpoint('PUT', getUrl, updateData);
    
    // 5. Delete the address
    await testEndpoint('DELETE', getUrl);
  }
  
  // Test Supplier Address Endpoints (if supplier ID is provided)
  if (TEST_CONFIG.supplierId && TEST_CONFIG.supplierId !== 'YOUR_SUPPLIER_ID') {
    console.log('\n=== SUPPLIER ADDRESS TESTS ===');
    
    const supplierListUrl = `${BASE_URL}/api/workspaces/${TEST_CONFIG.workspaceId}/companies/${TEST_CONFIG.companyId}/suppliers/${TEST_CONFIG.supplierId}/addresses`;
    
    // 1. List supplier addresses
    await testEndpoint('GET', supplierListUrl);
    
    // 2. Create a new supplier address
    const supplierCreateResult = await testEndpoint('POST', supplierListUrl, newAddress);
    
    if (supplierCreateResult.success && supplierCreateResult.data.address) {
      const addressId = supplierCreateResult.data.address.id;
      console.log(`\n📝 Created supplier address with ID: ${addressId}`);
      
      // 3. Get single address
      const getUrl = `${supplierListUrl}/${addressId}`;
      await testEndpoint('GET', getUrl);
      
      // 4. Update the address
      const updateData = {
        title: 'Updated Supplier Address',
        city: 'Izmir'
      };
      await testEndpoint('PUT', getUrl, updateData);
      
      // 5. Delete the address
      await testEndpoint('DELETE', getUrl);
    }
  } else {
    console.log('\n⚠️  Skipping supplier tests - no supplier ID provided');
  }
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
runTests().catch(console.error);