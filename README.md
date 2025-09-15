# Mini CRM Platform

A production-ready Mini CRM Platform with AI-powered features for customer management, audience segmentation, and campaign automation.

## 🚀 Features

- **Customer & Order Management**: Secure APIs for data ingestion
- **Audience Segmentation**: Dynamic rule logic with drag-and-drop interface
- **Campaign Management**: Create and deliver targeted campaigns
- **AI Integration**: OpenAI-powered message suggestions and insights
- **Google OAuth**: Secure authentication with NextAuth.js
- **Real-time Processing**: Kafka/Redis for async data processing
- **Performance Tracking**: Campaign analytics and delivery logs

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Express.js    │    │   PostgreSQL    │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Vercel)      │    │   (Render)      │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Kafka/Redis   │              │
         │              │   Message Queue │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NextAuth.js   │    │   OpenAI API    │    │   Prisma ORM    │
│   Authentication│    │   AI Features   │    │   Data Layer    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: OpenAI GPT-4/3.5 API
- **Message Broker**: Kafka/Redis Streams
- **Deployment**: Vercel (frontend) + Render (backend) + Supabase (database)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crm-app
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

4. **Database Setup**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="your-openai-api-key"
KAFKA_BROKERS="localhost:9092"
REDIS_URL="redis://localhost:6379"
```

### Frontend (.env.local)
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

## 📚 API Documentation

Once the backend is running, visit `http://localhost:5000/api-docs` for Swagger documentation.

## 🎯 Key Features

### 1. Customer Management
- ✅ Add/edit customer information with validation
- ✅ Track customer spending and activity metrics
- ✅ Advanced search and filter capabilities
- ✅ Customer status tracking (Active, Inactive, etc.)
- ✅ Order history and communication logs

### 2. Audience Segmentation
- ✅ Dynamic rule builder with AND/OR logic
- ✅ Real-time audience preview with customer count
- ✅ Natural language rule parsing with AI
- ✅ Support for multiple field types (spending, visits, dates, etc.)
- ✅ Visual rule management interface

### 3. Campaign Management
- ✅ Create targeted campaigns with segment selection
- ✅ AI-powered message suggestions with multiple tones
- ✅ Delivery simulation with 90% success rate
- ✅ Real-time performance tracking and analytics
- ✅ Campaign status management (Draft, Sent, Failed)

### 4. AI Integration
- ✅ **Message Suggestions**: Generate multiple campaign variants using OpenAI GPT-4
- ✅ **Rule Parsing**: Convert natural language descriptions to structured JSON rules
- ✅ **Campaign Insights**: AI-generated performance summaries and recommendations
- ✅ **Smart Recommendations**: Context-aware suggestions based on campaign objectives
- ✅ **Testing Tools**: Dedicated test scripts and endpoints for AI feature validation

See [OPENAI_FEATURES.md](./backend/OPENAI_FEATURES.md) for detailed information on the OpenAI integration.

### 5. Authentication & Security
- ✅ Google OAuth 2.0 integration with NextAuth.js
- ✅ JWT-based API authentication
- ✅ Secure session management
- ✅ User-specific data access controls

### 6. Real-time Processing
- ✅ Kafka message broker for async data processing
- ✅ Redis caching for improved performance
- ✅ Background job processing for campaign delivery
- ✅ Event-driven architecture for scalability

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Render)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy with auto-deploy enabled

### Database (Supabase)
1. Create a new Supabase project
2. Update DATABASE_URL in backend environment
3. Run migrations: `npx prisma db push`

## 📊 Database Schema

- **Users**: Authentication and user management
- **Customers**: Customer profiles and data
- **Orders**: Transaction history
- **Segments**: Audience segmentation rules
- **Campaigns**: Campaign definitions and metadata
- **CommunicationLogs**: Delivery tracking and analytics

## 🤖 AI Tools Used

- **OpenAI GPT-4**: Message generation and natural language processing
- **Rule Parsing**: Convert text descriptions to structured rules
- **Campaign Optimization**: AI-powered suggestions for better engagement

## ⚠️ Known Limitations

- Delivery simulation is mock (90% success rate)
- Real-time updates require polling (WebSocket implementation pending)
- File uploads limited to 10MB
- Campaign scheduling not implemented (immediate delivery only)

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support, email support@crm-app.com or create an issue in the repository.
