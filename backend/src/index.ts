import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import orderRoutes from './routes/orders';
import segmentRoutes from './routes/segments';
import campaignRoutes from './routes/campaigns';
import importsRoutes from './routes/imports';
import { initializeKafka, startConsumer, shutdownKafka } from './services/kafkaService';
import { initializeRedis, closeRedisConnection } from './services/redisService';

dotenv.config();

// Set default NODE_ENV if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('NODE_ENV not set, defaulting to development mode');
}

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const ALTERNATIVE_PORTS = [5001, 5002, 5003, 5004, 5005];

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini CRM Platform API',
      version: '1.0.0',
      description: 'A production-ready Mini CRM Platform with AI-powered features',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/imports', importsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

let server: any;

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Kafka and Redis
    try {
      await initializeKafka();
      await startConsumer();
      console.log('✅ Kafka connected successfully');
    } catch (error: any) {
      console.warn('⚠️ Kafka services not available, continuing without Kafka');
      console.error('Kafka error:', error.message);
    }
    
    try {
      await initializeRedis();
      console.log('✅ Redis connected successfully');
    } catch (error: any) {
      console.warn('⚠️ Redis services not available, continuing without Redis');
      console.error('Redis error:', error.message);
    }
    
    // Try to start the server on the main port
    try {
      server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      });
    } catch (error: any) {
      // If the port is already in use, try alternative ports
      if (error.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${PORT} is already in use, trying alternative ports...`);
        
        for (const altPort of ALTERNATIVE_PORTS) {
          try {
            server = app.listen(altPort, () => {
              console.log(`🚀 Server running on alternative port ${altPort}`);
              console.log(`📚 API Documentation: http://localhost:${altPort}/api-docs`);
              console.log(`🏥 Health Check: http://localhost:${altPort}/health`);
            });
            // If we reach here, the server started successfully
            break;
          } catch (altError: any) {
            if (altError.code === 'EADDRINUSE') {
              console.warn(`⚠️ Alternative port ${altPort} is also in use, trying next...`);
            } else {
              throw altError; // Re-throw if it's not a port-in-use error
            }
          }
        }
      } else {
        throw error; // Re-throw if it's not a port-in-use error
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Received shutdown signal, closing connections...');
  
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }
  
  try {
    try {
      await shutdownKafka();
      console.log('Kafka connections closed');
    } catch (error) {
      console.warn('Error closing Kafka connection:', error);
    }
    
    try {
      await closeRedisConnection();
      console.log('Redis connection closed');
    } catch (error) {
      console.warn('Error closing Redis connection:', error);
    }
    
    console.log('All connections closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

startServer();

export default app;
