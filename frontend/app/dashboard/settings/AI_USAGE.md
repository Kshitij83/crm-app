# AI Features & Quota Management

This CRM application uses Google's Gemini AI API with the 'gemini-2.0-flash' model to provide AI-powered features like message generation, segment rule creation, and campaign insights. These features enhance your ability to target customers effectively and create compelling marketing messages.

## Gemini Model Information

The application uses Google's Gemini Flash model, which offers:

- Fast response times (optimized for production use)
- Excellent natural language understanding
- Strong structured data generation capabilities
- Affordable API pricing for production workloads
- High reliability for business applications

## Features Using AI

1. **Message Generation**: Create compelling marketing messages based on campaign objectives
2. **Natural Language Rule Creation**: Convert plain English descriptions into customer segment rules
3. **Campaign Insights**: Get AI-powered analysis of your campaign performance

## Understanding AI Quota Limits

The Gemini AI API has usage limits that may impact these features:

1. **Rate Limits**: There are limits on how many requests you can make per minute
2. **Daily/Monthly Quotas**: Free accounts have capped usage per day/month
3. **Token Limitations**: Each request has a maximum token (word) limit
4. **Concurrent Request Limits**: Only a certain number of simultaneous requests are allowed

## How the App Handles API Limitations

When the AI API quota is exceeded or other API errors occur:

1. **Clear Notifications**: You'll see a banner notification at the top of the app
2. **Graceful Degradation**: AI features will be temporarily disabled
3. **Manual Alternatives**: You can still use manual alternatives for each feature
4. **Automatic Recovery**: The app will automatically test and restore AI features when quotas reset

## Resolving Quota Issues

If you're seeing the "AI API Quota Exceeded" notification:

1. **Wait for Reset**: Quotas typically reset daily/monthly depending on your plan
2. **Add Payment Method**: Go to Google AI Studio and add a payment method
3. **Upgrade Plan**: Consider upgrading to a paid plan with higher quotas
4. **Check API Key**: Ensure your Gemini API key is correctly configured in the application

## Checking AI Feature Status

You can check the status of the AI integration at any time:

1. Go to Settings > AI Features
2. Click "Test AI Connection"
3. View detailed status for each AI feature

## Optimizing AI Usage

To optimize your Gemini API usage:

1. **Be Specific**: When requesting message generation, provide clear objectives
2. **Limit Frequency**: Avoid repeatedly generating multiple message variants
3. **Use Pre-built Templates**: Start with templates to reduce API usage
4. **Batch Operations**: Process customer segments in batches when possible

For more information, consult the [Gemini AI documentation](https://ai.google.dev/docs/gemini_api).