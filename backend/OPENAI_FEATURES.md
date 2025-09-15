# OpenAI Features Integration Guide

This document provides details on the OpenAI integration in the CRM application and how to test these features.

## Features Overview

The CRM application integrates OpenAI in three key areas:

1. **Natural Language Segment Rules**: Convert natural language descriptions into segment rules
2. **Message Suggestions**: Generate campaign message suggestions based on objectives and audience
3. **Campaign Insights**: Analyze campaign performance and provide AI-powered insights

## Setup Instructions

### 1. Configure OpenAI API Key

The system supports both actual OpenAI API integration and a mock implementation for development:

1. Open `backend/.env` file
2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
3. If no API key is provided, the system will use the mock implementation

### 2. Testing the OpenAI Features

Two test scripts are provided to help you verify the OpenAI integration:

#### Test All OpenAI Features

This script tests all three OpenAI features with sample inputs:

```bash
# Navigate to backend directory
cd backend

# Install dependencies if not already done
npm install

# Run the test script
node test-ai-features.js
```

You will be prompted to enter a JWT token. To get one:
1. Sign up or sign in through the application
2. Copy the JWT token from the response or localStorage

#### Test Full API Flow

This script tests the entire API flow including authentication, data import, segment creation, and campaign creation:

```bash
# Navigate to backend directory
cd backend

# Run the test script
node test-api-flow.js
```

You can choose to create a new user or use an existing one when prompted.

## API Endpoints for OpenAI Features

The following endpoints are available for testing the OpenAI features:

### 1. Test All AI Features

```
GET /api/campaigns/test-ai-features
```

This endpoint tests all three OpenAI features with sample data and returns the results.

### 2. Test Natural Language Rule Parsing

```
POST /api/segments/test-rule-parsing
```

Request Body:
```json
{
  "description": "Customers who spent more than $1000 in the last 3 months"
}
```

### 3. Test Message Suggestions

```
POST /api/campaigns/suggest-message
```

Request Body:
```json
{
  "objective": "Launch our new premium subscription service",
  "targetAudience": "High-value customers",
  "tone": "professional"
}
```

## Sample Test Inputs

### Natural Language Rule Descriptions

Here are some example descriptions you can use to test the rule parsing:

- "Customers who spent more than $1000 in the last 3 months"
- "New customers who signed up in the last 30 days"
- "Customers who haven't made a purchase in 6 months"
- "High-value customers who bought product category 'electronics'"
- "Customers from California who made at least 2 purchases"

### Campaign Objectives

Here are some example campaign objectives for message suggestions:

- Objective: "Launch our new premium subscription service"
  Target Audience: "High-value customers"
  Tone: "professional"

- Objective: "Re-engage dormant customers with a special offer"
  Target Audience: "Customers who haven't purchased in 3 months"
  Tone: "friendly"

- Objective: "Announce our seasonal sale"
  Target Audience: "All customers"
  Tone: "exciting"

## Implementation Details

The OpenAI integration is implemented in the `OpenAIService` class, which provides both actual API integration and a mock implementation for development purposes.

Key methods:
- `parseNaturalLanguageRules({ description })`: Converts natural language to segment rules
- `generateMessageSuggestions({ objective, targetAudience, tone })`: Generates message suggestions
- `generateCampaignInsights(campaignData)`: Analyzes campaign performance and provides insights

If you need to modify or extend these features, see the implementation in `backend/src/services/openaiService.ts`.