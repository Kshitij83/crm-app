# CRM-App Backend Setup and Testing

This document provides instructions for setting up and testing the CRM-App backend.

## Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis
- Kafka

## Environment Setup

1. Make sure your PostgreSQL instance is running
2. Make sure your Redis instance is running 
3. Make sure your Kafka instance is running

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

## Running the Backend

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm run start
```

## Testing the Backend

We've provided two test scripts to verify that everything is working correctly:

### Test Database Connection and Data

```bash
# Run the database test script
npx ts-node test-db.ts
```

This will:
- Test the database connection
- Check if there are users, customers, segments, campaigns, and orders in the database
- Display sample data from each table

### Test API Endpoints

```bash
# Start the server first
npm run dev

# In a new terminal, run the API test script
node test-api.js
```

This will:
- Test the health check endpoint
- Test the OpenAI message suggestion endpoint
- Test the OpenAI rule parsing endpoint

## API Documentation

The API documentation is available at:

```
http://localhost:5000/api-docs
```

This Swagger UI provides an interactive interface to explore and test all API endpoints.

## Services

- **Authentication**: JWT-based with Google OAuth integration
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for improved performance
- **Message Queue**: Kafka for asynchronous processing
- **AI Integration**: OpenAI for message generation and customer segmentation

## Directory Structure

- `/prisma`: Database schema and migrations
- `/src/middleware`: Authentication, error handling, rate limiting
- `/src/routes`: API endpoints for auth, customers, campaigns, segments, orders
- `/src/services`: Kafka, Redis, OpenAI integrations

## Troubleshooting

1. **Database Connection Issues**:
   - Check your DATABASE_URL in the `.env` file
   - Ensure PostgreSQL is running and accessible

2. **API Errors**:
   - Check the server logs for details
   - Ensure all required services (Redis, Kafka) are running

3. **OpenAI Integration Issues**:
   - Verify your OPENAI_API_KEY in the `.env` file
   - Check for any rate limiting or quota issues with OpenAI