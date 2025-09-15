# AI Features Integration Guide

This document provides details on the Google Gemini AI integration in the CRM application and how to test these features.

## AI Features Overview

The CRM application integrates Google Gemini AI in three key areas:

1. **Natural Language Segment Creation**: Convert plain English descriptions into structured segment rules
2. **Message Suggestions**: Generate compelling marketing message variations based on campaign objectives
3. **Campaign Insights**: Get AI-powered analysis of campaign performance

## Configuration and Setup

### 1. Configure Gemini API Key

The system is configured to use Google's Gemini AI models:

1. Create a `.env` file in the `/backend` directory (copy from `.env.example`)
2. Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-2.0-flash
   ```

### 2. Testing the AI Features

Two test scripts are provided to help you verify the AI integration:

#### Test All AI Features

This script tests all three AI features with sample inputs:

```bash
npm run test:ai
```

#### Test API Flow

This script tests the API endpoints that use AI features:

```bash
npm run test:api
```

## API Endpoints for AI Features

The following endpoints are available for testing the AI features:

### 1. Test AI Features

```
GET /api/campaigns/test-ai-features
```

This endpoint tests all three AI features with sample data and returns the results.

### 2. Generate Message Suggestions

```
POST /api/campaigns/suggest-message
```

Request body:
```json
{
  "objective": "Launch our new premium subscription service",
  "targetAudience": "High-value customers",
  "tone": "professional",
  "maxLength": 200
}
```

### 3. Parse Natural Language Rules

```
POST /api/segments/parse-rules
```

Request body:
```json
{
  "description": "Customers who spent more than $1000 in the last 30 days and have visited our website at least 5 times"
}
```

### 4. Generate Campaign Insights

```
GET /api/campaigns/:id/insights
```

## Implementation Details

The AI integration is implemented in the `GeminiService` class, which provides a comprehensive API for all AI-powered features in the application.

### Customizing AI Behavior

The system uses carefully crafted prompts to get the best results from the Gemini AI models. These prompts can be adjusted to change how the AI responds.

If you need to modify or extend these features, see the implementation in `backend/src/services/geminiService.ts`.