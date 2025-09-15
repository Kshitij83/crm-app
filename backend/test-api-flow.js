/**
 * Test script for the CRM API endpoints
 * 
 * This script tests the main API endpoints:
 * 1. Authentication (signup and signin)
 * 2. Customer import
 * 3. Segment creation
 * 4. Campaign creation
 * 
 * Usage:
 * - Make sure the server is running
 * - Run with: node test-api-flow.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let testUserId = '';
let testEmail = '';
let testPassword = '';
let testSegmentId = '';

// Utility function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Test user signup
async function testSignup() {
  console.log('\n=== Testing User Signup ===');
  
  // Generate a random email to avoid conflicts
  testEmail = `test_user_${Math.floor(Math.random() * 10000)}@example.com`;
  testPassword = 'TestPassword123!';
  
  const userData = {
    email: testEmail,
    password: testPassword,
    name: 'Test User'
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Signup successful!');
      console.log(`User created with email: ${testEmail}`);
      authToken = data.token;
      testUserId = data.user.id;
      return true;
    } else {
      console.error('Signup failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('Error during signup:', error);
    return false;
  }
}

// Test user signin
async function testSignin() {
  console.log('\n=== Testing User Signin ===');
  
  const credentials = {
    email: testEmail,
    password: testPassword
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Signin successful!');
      authToken = data.token;
      testUserId = data.user.id;
      return true;
    } else {
      console.error('Signin failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('Error during signin:', error);
    return false;
  }
}

// Test customer import via CSV
async function testCustomerImport() {
  console.log('\n=== Testing Customer CSV Import ===');
  
  try {
    // Create form data with the CSV file
    const form = new FormData();
    const filePath = './sample_customers.csv';
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }
    
    form.append('file', fs.createReadStream(filePath));
    
    const response = await fetch(`${API_BASE_URL}/imports/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: form
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Customer import successful!');
      console.log(`Imported ${data.importedCount} customers`);
      return true;
    } else {
      console.error('Customer import failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('Error during customer import:', error);
    return false;
  }
}

// Test order import via CSV
async function testOrderImport() {
  console.log('\n=== Testing Order CSV Import ===');
  
  try {
    // Create form data with the CSV file
    const form = new FormData();
    const filePath = './sample_orders.csv';
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }
    
    form.append('file', fs.createReadStream(filePath));
    
    const response = await fetch(`${API_BASE_URL}/imports/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: form
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Order import successful!');
      console.log(`Imported ${data.importedCount} orders`);
      return true;
    } else {
      console.error('Order import failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('Error during order import:', error);
    return false;
  }
}

// Test segment creation
async function testSegmentCreation() {
  console.log('\n=== Testing Segment Creation ===');
  
  const segmentData = {
    name: 'Test Segment',
    description: 'High-value customers who spent more than $500',
    rules: [
      {
        field: 'totalSpent',
        operator: 'gt',
        value: '500'
      }
    ]
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/segments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(segmentData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Segment creation successful!');
      console.log(`Segment ID: ${data.segment.id}`);
      testSegmentId = data.segment.id;
      return true;
    } else {
      console.error('Segment creation failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('Error during segment creation:', error);
    return false;
  }
}

// Test segment audience preview
async function testSegmentPreview() {
  console.log('\n=== Testing Segment Audience Preview ===');
  
  if (!testSegmentId) {
    console.error('No segment ID available for preview');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/segments/${testSegmentId}/preview`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Segment preview successful!');
      console.log(`Found ${data.customers.length} customers in segment`);
      return true;
    } else {
      console.error('Segment preview failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('Error during segment preview:', error);
    return false;
  }
}

// Test campaign creation
async function testCampaignCreation() {
  console.log('\n=== Testing Campaign Creation ===');
  
  if (!testSegmentId) {
    console.error('No segment ID available for campaign creation');
    return false;
  }
  
  const campaignData = {
    name: 'Test Campaign',
    segmentId: testSegmentId,
    messageTemplate: 'Hello {{customer.firstName}}, we have a special offer for you!',
    scheduledDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(campaignData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Campaign creation successful!');
      console.log(`Campaign ID: ${data.campaign.id}`);
      return true;
    } else {
      console.error('Campaign creation failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('Error during campaign creation:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('CRM App - API Flow Test Script');
  console.log('==============================');
  console.log('This script will test the main API flow of the CRM app.');
  console.log('Make sure the server is running before proceeding.');
  
  const useExistingUser = await prompt('Do you want to use an existing user? (y/n): ');
  
  if (useExistingUser.toLowerCase() === 'y') {
    testEmail = await prompt('Enter email: ');
    testPassword = await prompt('Enter password: ');
    await testSignin();
  } else {
    await testSignup();
  }
  
  if (!authToken) {
    console.error('Authentication failed. Cannot proceed with tests.');
    rl.close();
    return;
  }
  
  // Run remaining tests
  await testCustomerImport();
  await testOrderImport();
  await testSegmentCreation();
  await testSegmentPreview();
  await testCampaignCreation();
  
  console.log('\nAll tests completed!');
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error running tests:', error);
  rl.close();
});