import { Kafka, Producer, Consumer, KafkaJSError, RetryOptions } from 'kafkajs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let producer: Producer;
let consumer: Consumer;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Define topics
export const TOPICS = {
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  CAMPAIGNS: 'campaigns',
  COMMUNICATION: 'communication',
};

// Retry configuration
const retryConfig: RetryOptions = {
  initialRetryTime: 1000,
  retries: 0, // Set to 0 to avoid multiple retry attempts
  maxRetryTime: 1000,
  factor: 1.5,
};

const kafka = new Kafka({
  clientId: 'crm-app',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: retryConfig,
});

export const initializeKafka = async () => {
  // Check if MOCK_SERVICES environment variable is set
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Development mode: Using mock Kafka implementation');
    console.log('   No Kafka server needed for development');
    return;
  }
  
  try {
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      retry: retryConfig,
    });
    
    consumer = kafka.consumer({ 
      groupId: 'crm-consumer-group',
      retry: retryConfig,
    });

    await producer.connect();
    await consumer.connect();

    // Subscribe to topics
    await consumer.subscribe({ 
      topics: Object.values(TOPICS),
      fromBeginning: false 
    });

    isConnected = true;
    reconnectAttempts = 0;
    console.log('✅ Kafka initialized successfully');
  } catch (error) {
    console.error('❌ Kafka initialization failed:', error);
    console.log('🔄 Switching to mock Kafka implementation');
    handleKafkaError(error as KafkaJSError);
    // Don't throw error to allow app to start without Kafka
  }
};

export const publishMessage = async (topic: string, message: any) => {
  try {
    if (!producer || !isConnected) {
      console.warn('⚠️ Kafka not available, using mock implementation');
      console.log(`📝 Would publish to ${topic}:`, message);
      
      // For certain message types, handle them directly to maintain functionality
      if (topic === TOPICS.ORDERS && message.type === 'order_created') {
        try {
          await prisma.customer.update({
            where: { id: message.data.customerId },
            data: {
              totalSpend: { increment: message.data.orderAmount || 0 },
              lastActiveDate: new Date(),
            },
          });
          console.log(`✅ Mock: Updated customer spending for ${message.data.customerId}`);
        } catch (err) {
          console.error('❌ Mock: Error updating customer data', err);
        }
      }
      
      return true; // Return success for the mock implementation
    }

    await producer.send({
      topic,
      messages: [
        {
          key: message.id || Date.now().toString(),
          value: JSON.stringify({
            ...message,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    console.log(`📤 Message published to topic: ${topic}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to publish message to ${topic}:`, error);
    handleKafkaError(error as KafkaJSError);
    return false;
  }
};

export const startConsumer = async () => {
  try {
    if (!consumer || !isConnected) {
      console.warn('Kafka consumer not initialized or not connected');
      await reconnectIfNeeded();
      if (!isConnected) return;
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value?.toString() || '{}');
          console.log(`📥 Received message from ${topic} [partition: ${partition}]`);

          // Process different topics
          switch (topic) {
            case TOPICS.CUSTOMERS:
              await processCustomerMessage(data);
              break;
            case TOPICS.ORDERS:
              await processOrderMessage(data);
              break;
            case TOPICS.CAMPAIGNS:
              await processCampaignMessage(data);
              break;
            case TOPICS.COMMUNICATION:
              await processCommunicationMessage(data);
              break;
            default:
              console.warn(`Unknown topic: ${topic}`);
          }
        } catch (error) {
          console.error(`❌ Error processing message from ${topic}:`, error);
        }
      },
    });

    console.log('✅ Kafka consumer started');

    // Event listeners for consumer
    consumer.on('consumer.crash', async (event) => {
      console.error('Consumer crashed:', event);
      await reconnectIfNeeded();
    });
  } catch (error) {
    console.error('❌ Failed to start Kafka consumer:', error);
    handleKafkaError(error as KafkaJSError);
  }
};

// Message processors
const processCustomerMessage = async (data: any) => {
  try {
    const { action, customer } = data;
    
    switch (action) {
      case 'CREATED':
      case 'UPDATED':
        // Update analytics, trigger notifications, etc.
        console.log(`Customer ${action.toLowerCase()}: ${customer.id}`);
        break;
      
      case 'SEGMENTED':
        // Handle customer being added to a segment
        console.log(`Customer ${customer.id} added to segment ${data.segmentId}`);
        break;
        
      default:
        console.warn(`Unknown customer action: ${action}`);
    }
  } catch (error) {
    console.error('Error processing customer message:', error);
  }
};

const processOrderMessage = async (data: any) => {
  try {
    const { action, order } = data;
    
    switch (action) {
      case 'CREATED':
        // Update customer spending, trigger potential campaigns
        await prisma.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpend: { increment: order.orderAmount },
            lastActiveDate: new Date(),
          },
        });
        console.log(`Updated customer ${order.customerId} spending with new order ${order.id}`);
        break;
        
      case 'UPDATED':
      case 'CANCELLED':
        // Handle updates or cancellations
        console.log(`Order ${action.toLowerCase()}: ${order.id}`);
        break;
        
      default:
        console.warn(`Unknown order action: ${action}`);
    }
  } catch (error) {
    console.error('Error processing order message:', error);
  }
};

const processCampaignMessage = async (data: any) => {
  try {
    const { action, campaign } = data;
    
    switch (action) {
      case 'SCHEDULED':
        // Queue up a campaign for sending
        console.log(`Campaign scheduled: ${campaign.id}`);
        
        // Publish communication messages for each customer in the segment
        await prepareCampaignCommunications(campaign);
        break;
        
      case 'CANCELLED':
        // Cancel a scheduled campaign
        console.log(`Campaign cancelled: ${campaign.id}`);
        break;
        
      default:
        console.warn(`Unknown campaign action: ${action}`);
    }
  } catch (error) {
    console.error('Error processing campaign message:', error);
  }
};

const processCommunicationMessage = async (data: any) => {
  try {
    const { campaignId, customerId, messageText } = data;
    
    // In a real app, this would send an email, SMS, etc.
    console.log(`Sending message to customer ${customerId} for campaign ${campaignId}`);
    
    // Log the communication
    await prisma.communicationLog.create({
      data: {
        campaignId,
        customerId,
        status: 'SENT',
      },
    });
    
    console.log(`Communication logged for customer ${customerId}`);
  } catch (error) {
    console.error('Error processing communication message:', error);
    
    // Log failed communication
    try {
      await prisma.communicationLog.create({
        data: {
          campaignId: data.campaignId,
          customerId: data.customerId,
          status: 'FAILED',
        },
      });
    } catch (logError) {
      console.error('Could not log communication failure:', logError);
    }
  }
};

// Helper function to prepare communications for a campaign
const prepareCampaignCommunications = async (campaign: any) => {
  try {
    // Get customers in the segment
    const segment = await prisma.segment.findUnique({
      where: { id: campaign.segmentId },
      include: { creator: true },
    });
    
    if (!segment) {
      console.error(`Segment ${campaign.segmentId} not found`);
      return;
    }
    
    // Here we would apply the segment rules to get the list of customers
    // For simplicity, let's get 10 random customers
    const customers = await prisma.customer.findMany({
      take: 10,
    });
    
    // Create communication messages for each customer
    for (const customer of customers) {
      await publishMessage(TOPICS.COMMUNICATION, {
        campaignId: campaign.id,
        customerId: customer.id,
        messageText: campaign.messageText,
      });
    }
    
    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'sent' },
    });
    
    console.log(`Campaign ${campaign.id} queued for ${customers.length} customers`);
  } catch (error) {
    console.error('Error preparing campaign communications:', error);
    
    // Update campaign status to failed
    try {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'failed' },
      });
    } catch (updateError) {
      console.error('Could not update campaign status:', updateError);
    }
  }
};

// Error handling
const handleKafkaError = async (error: KafkaJSError) => {
  console.error(`Kafka error: ${error.message}`, error);
  isConnected = false;
  
  if (error.name === 'KafkaJSConnectionError' || 
      error.name === 'KafkaJSNetworkError' ||
      error.name === 'KafkaJSBrokerNotFound') {
    await reconnectIfNeeded();
  }
};

// Reconnection logic
const reconnectIfNeeded = async () => {
  if (isConnected || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
  
  reconnectAttempts++;
  console.log(`Attempting to reconnect to Kafka (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
  
  try {
    // Close existing connections
    try {
      if (producer) await producer.disconnect();
      if (consumer) await consumer.disconnect();
    } catch (error) {
      console.error('Error disconnecting from Kafka:', error);
    }
    
    // Reinitialize
    await initializeKafka();
    
    if (isConnected) {
      await startConsumer();
      console.log('Successfully reconnected to Kafka');
    }
  } catch (error) {
    console.error('Failed to reconnect to Kafka:', error);
    
    // Schedule another attempt if we haven't reached the limit
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        reconnectIfNeeded();
      }, 5000 * reconnectAttempts); // Increase delay with each attempt
    } else {
      console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
    }
  }
};

// Graceful shutdown
export const shutdownKafka = async () => {
  try {
    if (producer) await producer.disconnect();
    if (consumer) await consumer.disconnect();
    console.log('Kafka connections closed');
  } catch (error) {
    console.error('Error shutting down Kafka:', error);
  }
};

export { producer, consumer };

