# CRM Application Testing Guide

This guide provides instructions for testing the backend APIs using Postman and connecting the frontend to the backend.

## Prerequisites

1. Ensure the backend server is running: `cd backend && npm run dev`
2. Ensure the frontend dev server is running: `cd frontend && npm run dev`
3. Postman installed (or use the web version)

## Backend API Testing with Postman

### Setting Up Postman

1. Create a new collection named "CRM App"
2. Set up an environment variable:
   - `baseUrl`: http://localhost:5000
   - `token`: (to be filled after authentication)

### Authentication Endpoints

#### Register User
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/register`
- **Body**:
```json
{
  "email": "test@example.com",
  "password": "Password123!",
  "name": "Test User"
}
```

#### Login
- **Method**: POST
- **URL**: `{{baseUrl}}/auth/login`
- **Body**:
```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```
- After successful login, copy the token from the response and set it to the `token` environment variable

### Customer Endpoints

For all these endpoints, add the Authorization header:
- Key: `Authorization`
- Value: `Bearer {{token}}`

#### Get All Customers
- **Method**: GET
- **URL**: `{{baseUrl}}/customers`

#### Get Customer by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/customers/1`

#### Create Customer
- **Method**: POST
- **URL**: `{{baseUrl}}/customers`
- **Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-1234",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "tags": ["retail", "premium"]
}
```

#### Update Customer
- **Method**: PUT
- **URL**: `{{baseUrl}}/customers/1`
- **Body**:
```json
{
  "name": "Jane Smith-Updated",
  "email": "jane-updated@example.com"
}
```

#### Delete Customer
- **Method**: DELETE
- **URL**: `{{baseUrl}}/customers/1`

### Segment Endpoints

#### Get All Segments
- **Method**: GET
- **URL**: `{{baseUrl}}/segments`

#### Get Segment by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/segments/1`

#### Create Segment
- **Method**: POST
- **URL**: `{{baseUrl}}/segments`
- **Body**:
```json
{
  "name": "Premium Customers",
  "description": "Customers who spend more than $1000",
  "rules": [
    {
      "field": "totalSpent",
      "operator": "greaterThan",
      "value": "1000"
    }
  ]
}
```

#### Update Segment
- **Method**: PUT
- **URL**: `{{baseUrl}}/segments/1`
- **Body**:
```json
{
  "name": "VIP Customers",
  "description": "Updated description"
}
```

#### Delete Segment
- **Method**: DELETE
- **URL**: `{{baseUrl}}/segments/1`

#### Parse Rules (OpenAI Integration)
- **Method**: POST
- **URL**: `{{baseUrl}}/segments/parse-rules`
- **Body**:
```json
{
  "description": "Find customers who have made at least 3 purchases in the last 30 days and spent more than $500"
}
```

### Campaign Endpoints

#### Get All Campaigns
- **Method**: GET
- **URL**: `{{baseUrl}}/campaigns`

#### Get Campaign by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/campaigns/1`

#### Create Campaign
- **Method**: POST
- **URL**: `{{baseUrl}}/campaigns`
- **Body**:
```json
{
  "name": "Summer Sale",
  "description": "20% off for summer products",
  "segmentId": 1,
  "content": "Hi {{customerName}}, enjoy 20% off on all summer products!",
  "channel": "email",
  "scheduledAt": "2023-06-15T10:00:00Z"
}
```

#### Update Campaign
- **Method**: PUT
- **URL**: `{{baseUrl}}/campaigns/1`
- **Body**:
```json
{
  "name": "Updated Summer Sale",
  "description": "25% off for summer products"
}
```

#### Delete Campaign
- **Method**: DELETE
- **URL**: `{{baseUrl}}/campaigns/1`

#### Generate Message Suggestion (OpenAI Integration)
- **Method**: POST
- **URL**: `{{baseUrl}}/campaigns/suggest-message`
- **Body**:
```json
{
  "objective": "Promote our new electronics sale",
  "targetAudience": "Premium Customers",
  "tone": "professional"
}
```

### Order Endpoints

#### Get All Orders
- **Method**: GET
- **URL**: `{{baseUrl}}/orders`

#### Get Order by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/orders/1`

#### Create Order
- **Method**: POST
- **URL**: `{{baseUrl}}/orders`
- **Body**:
```json
{
  "customerId": 1,
  "products": [
    {
      "name": "Product A",
      "price": 99.99,
      "quantity": 2
    }
  ],
  "status": "pending",
  "totalAmount": 199.98
}
```

#### Update Order
- **Method**: PUT
- **URL**: `{{baseUrl}}/orders/1`
- **Body**:
```json
{
  "status": "completed"
}
```

#### Delete Order
- **Method**: DELETE
- **URL**: `{{baseUrl}}/orders/1`

## Testing OpenAI Integration

The CRM application integrates with OpenAI for two main features:

1. **Message Suggestion** - Generates campaign message content based on context
2. **Rule Parsing** - Converts natural language descriptions into structured segment rules

### Testing Message Suggestion

1. Use the "Generate Message Suggestion" endpoint described above
2. Adjust the parameters to get different types of messages:
   - For promotional campaigns: set `campaignType` to "promotion"
   - For informational campaigns: set `campaignType` to "information"
   - For re-engagement campaigns: set `campaignType` to "re-engagement"

3. Sample request body variations:
```json
{
  "objective": "Promote our new electronics sale",
  "targetAudience": "Premium Customers",
  "tone": "professional"
}
```

```json
{
  "objective": "Re-engage inactive subscribers",
  "targetAudience": "Inactive Customers",
  "tone": "urgent",
  "maxLength": 200
}
```

### Testing Rule Parsing

1. Use the "Parse Rules" endpoint described above
2. Provide different natural language descriptions to see how they get converted to rules

3. Sample request body variations:
```json
{
  "description": "Find customers who have made at least 3 purchases in the last 30 days and spent more than $500"
}
```

```json
{
  "description": "Target customers who haven't made a purchase in the last 90 days and are from New York"
}
```

## Connecting Frontend to Backend

The frontend is already configured to connect to the backend at `http://localhost:5000` by default.

### Environment Variables

1. Create a `.env.local` file in the `frontend` directory based on the template:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

2. Update the secret key with a strong random string (you can generate one with `openssl rand -base64 32`)

### Authentication Flow

1. The frontend uses NextAuth.js for authentication
2. The authentication is configured to use our custom backend API for credentials
3. When users log in through the frontend, NextAuth will call our backend `/auth/login` endpoint
4. The token returned by the backend is stored in the session by NextAuth

### Testing Frontend-Backend Integration

1. Start both servers:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`

2. Open the frontend at `http://localhost:3000`

3. Sign in with the credentials you created during Postman testing:
   - Email: test@example.com
   - Password: Password123!

4. After successful login, you should be redirected to the dashboard

5. Verify that data is loading properly:
   - Check that customers are listed in the Customers page
   - Verify segments are displayed in the Segments page
   - Ensure campaigns are showing on the Campaigns page

6. Test creating new resources:
   - Create a new segment and verify it appears in the list
   - Create a new campaign targeting your segment
   - Add a new customer and check if they appear in the list

7. Test the AI features:
   - When creating a new segment, try using the natural language rule parser
   - When creating a campaign, try the message suggestion feature

## Troubleshooting

### Backend Connection Issues

1. Verify the backend server is running: `http://localhost:5000`
2. Check the Network tab in browser Dev Tools to see if API requests are failing
3. Verify the `NEXT_PUBLIC_API_URL` is set correctly in `.env.local`
4. Check CORS settings in the backend if you see cross-origin errors

### Authentication Issues

1. Check that the token is being properly passed in the Authorization header
2. Verify token expiration (default is 24 hours)
3. Ensure the `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are properly set

### Data Loading Issues

1. Check the browser console for errors
2. Verify Prisma database connection in the backend
3. Check that the mock services (Redis, Kafka) are functioning properly

## Next Steps

After successful testing:

1. Deploy the backend to a production environment
2. Deploy the frontend to Vercel or a similar platform
3. Set up proper environment variables for production
4. Configure proper Redis and Kafka services for production use