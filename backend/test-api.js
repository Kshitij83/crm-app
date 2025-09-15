/**
 * Simple test script to verify API endpoints and services
 * Run with Node.js: node test-api.js
 */

const baseUrl = 'http://localhost:5000';

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`Making ${method} request to ${baseUrl}${endpoint}...`);
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.error('\n❌ Server connection failed. Is your server running?');
      console.error('   Make sure to start the server with "npm run dev" before running tests.\n');
    }
    
    return { status: 500, error: error.message };
  }
}

// Run tests sequentially
async function runTests() {
  console.log('🧪 Starting API tests...');
  console.log('----------------------------------------');

  // Test 1: Health check
  console.log('Test 1: Health check');
  const healthResult = await makeRequest('/health');
  console.log(`Status: ${healthResult.status}`);
  console.log('Response:', healthResult.data);
  console.log('----------------------------------------');

  // Test 2: OpenAI message suggestions
  console.log('Test 2: OpenAI message suggestions');
  const suggestionResult = await makeRequest('/api/campaigns/suggest-messages', 'POST', {
    objective: 'Promote our summer sale with 20% off all products',
    targetAudience: 'Existing customers who haven\'t purchased in 3 months',
    tone: 'friendly',
    maxLength: 160
  });
  console.log(`Status: ${suggestionResult.status}`);
  
  if (suggestionResult && suggestionResult.data && suggestionResult.data.suggestions) {
    console.log('Generated messages:');
    suggestionResult.data.suggestions.forEach((msg, i) => {
      console.log(`Message ${i + 1}: ${msg}`);
    });
  } else {
    console.log('Response:', suggestionResult ? suggestionResult.data : 'No response data');
  }
  console.log('----------------------------------------');

  // Test 3: OpenAI rule parsing
  console.log('Test 3: OpenAI rule parsing');
  const ruleResult = await makeRequest('/api/segments/parse-rules', 'POST', {
    description: 'Customers who spent more than $1000 and have visited at least 5 times in the last 90 days'
  });
  console.log(`Status: ${ruleResult.status}`);
  if (ruleResult && ruleResult.data && ruleResult.data.rules) {
    console.log('Parsed rules:', JSON.stringify(ruleResult.data.rules, null, 2));
  } else {
    console.log('Response:', ruleResult ? ruleResult.data : 'No response data');
  }
  console.log('----------------------------------------');

  console.log('🎉 Tests completed!');
}

// Run tests
runTests();