/**
 * Test script for OpenAI feature integration
 * 
 * This script tests the AI features implemented in the CRM app:
 * 1. Natural language rule parsing for segments
 * 2. Message suggestions for campaigns
 * 3. Campaign insights generation
 * 
 * Usage:
 * - Make sure the server is running
 * - Run with: node test-ai-features.js
 * - You need to have a valid JWT token (login first)
 */

const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_BASE_URL = 'http://localhost:3001/api';
let authToken = '';

// Natural language rule descriptions to test
const ruleDescriptions = [
  "Customers who spent more than $1000 in the last 3 months",
  "New customers who signed up in the last 30 days",
  "Customers who haven't made a purchase in 6 months",
  "High-value customers who bought product category 'electronics'",
  "Customers from California who made at least 2 purchases"
];

// Campaign objectives to test message suggestions
const campaignObjectives = [
  {
    objective: "Launch our new premium subscription service",
    targetAudience: "High-value customers",
    tone: "professional"
  },
  {
    objective: "Re-engage dormant customers with a special offer",
    targetAudience: "Customers who haven't purchased in 3 months",
    tone: "friendly"
  },
  {
    objective: "Announce our seasonal sale",
    targetAudience: "All customers",
    tone: "exciting"
  }
];

// Mock campaign data for insights
const campaignData = {
  name: "Summer Sale Campaign",
  totalSent: 1500,
  successRate: 85,
  segmentName: "Active Customers",
  messageText: "Get 25% off on all summer products! Limited time offer."
};

// Ask for auth token
function promptForToken() {
  return new Promise((resolve) => {
    rl.question('Enter your JWT auth token: ', (token) => {
      resolve(token);
    });
  });
}

// Test natural language rule parsing
async function testRuleParsing() {
  console.log('\n=== Testing Natural Language Rule Parsing ===');
  
  for (const description of ruleDescriptions) {
    try {
      const response = await fetch(`${API_BASE_URL}/segments/test-rule-parsing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ description })
      });
      
      const data = await response.json();
      
      console.log(`\nInput: "${description}"`);
      console.log('Parsed Rules:');
      console.log(JSON.stringify(data.output, null, 2));
      console.log('-'.repeat(50));
    } catch (error) {
      console.error(`Error testing rule parsing for: ${description}`, error);
    }
  }
}

// Test all AI features at once
async function testAllAIFeatures() {
  console.log('\n=== Testing All AI Features ===');
  
  try {
    const response = await fetch(`${API_BASE_URL}/campaigns/test-ai-features`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    console.log('\n1. Natural Language Rules:');
    console.log(`Input: "${data.tests.naturalLanguageRules.input}"`);
    console.log('Output:');
    console.log(JSON.stringify(data.tests.naturalLanguageRules.output, null, 2));
    
    console.log('\n2. Message Suggestions:');
    console.log('Input:');
    console.log(JSON.stringify(data.tests.messageSuggestions.input, null, 2));
    console.log('Output:');
    console.log(JSON.stringify(data.tests.messageSuggestions.output, null, 2));
    
    console.log('\n3. Campaign Insights:');
    console.log('Input:');
    console.log(JSON.stringify(data.tests.campaignInsights.input, null, 2));
    console.log('Output:');
    console.log(JSON.stringify(data.tests.campaignInsights.output, null, 2));
  } catch (error) {
    console.error('Error testing all AI features:', error);
  }
}

// Test message suggestions specifically
async function testMessageSuggestions() {
  console.log('\n=== Testing Message Suggestions ===');
  
  for (const campaign of campaignObjectives) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/suggest-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(campaign)
      });
      
      const data = await response.json();
      
      console.log(`\nInput:`);
      console.log(JSON.stringify(campaign, null, 2));
      console.log('Suggestions:');
      console.log(JSON.stringify(data.suggestions, null, 2));
      console.log('-'.repeat(50));
    } catch (error) {
      console.error(`Error testing message suggestions:`, error);
    }
  }
}

// Main function
async function main() {
  console.log('CRM App - OpenAI Features Test Script');
  console.log('=====================================');
  console.log('This script will test the AI features implemented in the CRM app.');
  console.log('Make sure the server is running before proceeding.');
  
  // Get auth token
  authToken = await promptForToken();
  
  // Run tests
  await testAllAIFeatures();
  await testRuleParsing();
  await testMessageSuggestions();
  
  console.log('\nAll tests completed!');
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error running tests:', error);
  rl.close();
});