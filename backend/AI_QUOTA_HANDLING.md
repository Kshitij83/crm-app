# AI API Integration & Error Handling

The CRM application uses Google's Gemini API to provide AI-powered features, specifically utilizing the 'gemini-2.0-flash' model. However, there are several potential issues that can occur with the Gemini API:

## Potential API Issues

1. **Quota Exceeded**: The free tier of Gemini API has limited quota. Once this is exceeded, API calls return a 429 error with "RESOURCE_EXHAUSTED" message.
2. **Rate Limiting**: Too many requests in a short period can trigger rate limiting.
3. **Network Issues**: API calls may time out or fail due to network connectivity problems.
4. **API Key Issues**: Invalid or expired API keys will cause authentication failures.
5. **Model Availability**: The specific model may occasionally be unavailable.

## Error Handling System

To ensure the application handles Gemini API issues gracefully, we've implemented an error handling system:

1. When a Gemini API call fails with a quota error, the system returns a clear error response to the client.
2. The system avoids unnecessary API calls when it knows the quota is exceeded.
3. A notification appears in the UI to inform users about the AI API status.
4. There are clear instructions for resolving quota issues.

## Error Response Format

When an AI service error occurs, the API returns a structured error response:

```json
{
  "error": "AI service quota exceeded",
  "details": "The AI service is currently unavailable due to quota limitations. Please try again later or contact support."
}
```

## Resolving Quota Issues

If you're experiencing quota issues with the Gemini API:

1. **Check Quota Limits**: Review your Google AI Studio quota limits.
2. **Upgrade Your Plan**: Consider upgrading to a paid plan for higher limits.
3. **Optimize API Usage**: Batch requests where possible and optimize prompt length.
4. **Review Usage Patterns**: Look for inefficient or unnecessary API calls.

### Testing AI Integration

You can test the AI integration status using the test endpoint:

```
GET /api/campaigns/test-ai-features
```

This will run a series of AI feature tests and report the status of each one.

## Implementation Details

The error handling system is implemented in `geminiService.ts` with the following components:

1. **Quota Error Detection**: We detect Gemini quota errors by examining error codes and messages.
2. **Clear Error Messages**: Each error is converted to a user-friendly message.
3. **Status Tracking**: The frontend tracks API status using localStorage.
4. **UI Notifications**: Users are alerted when AI features are unavailable.