import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;
let isConnected = false;

export const initializeRedis = async () => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Development mode: Using in-memory cache instead of Redis');
    console.log('   No Redis server needed for development');
    return;
  }
  
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 1) { // Reduced from 10 to 1
            console.error('Redis max retries reached, giving up');
            return new Error('Redis max retries reached');
          }
          return Math.min(retries * 100, 3000); // Increasing delay with each retry
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('⏳ Redis reconnecting...');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    console.log('🔄 Switching to in-memory cache');
    isConnected = false;
    // Don't throw error to allow app to start without Redis
  }
};

export const closeRedisConnection = async () => {
  try {
    if (redisClient && isConnected) {
      await redisClient.quit();
      console.log('Redis connection closed gracefully');
    }
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
};

export const getRedisClient = (): RedisClientType | null => {
  return (redisClient && isConnected) ? redisClient : null;
};

// Mock implementation for Redis cache
const mockCache = new Map<string, { value: string, expiry: number }>();

// Cache utilities
export const setCache = async (key: string, value: any, ttl: number = 3600) => {
  try {
    if (!redisClient || !isConnected) {
      console.log(`⚠️ Redis not available, using in-memory cache for key: ${key}`);
      
      // Don't cache null values in mock implementation
      if (value === null) {
        mockCache.delete(key);
        return true;
      }
      
      const expiryTime = Date.now() + (ttl * 1000);
      mockCache.set(key, { 
        value: JSON.stringify(value), 
        expiry: expiryTime 
      });
      return true;
    }
    
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
};

export const getCache = async (key: string): Promise<any> => {
  try {
    if (!redisClient || !isConnected) {
      console.log(`⚠️ Redis not available, checking in-memory cache for key: ${key}`);
      
      const cached = mockCache.get(key);
      
      // Check if cache entry exists and hasn't expired
      if (cached && cached.expiry > Date.now()) {
        return JSON.parse(cached.value);
      }
      
      // Remove expired entries
      if (cached && cached.expiry <= Date.now()) {
        mockCache.delete(key);
      }
      
      return null;
    }
    
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<boolean> => {
  try {
    if (!redisClient || !isConnected) {
      console.log(`⚠️ Redis not available, deleting from in-memory cache: ${key}`);
      mockCache.delete(key);
      return true;
    }
    
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
};

export const invalidatePattern = async (pattern: string): Promise<number> => {
  try {
    if (!redisClient || !isConnected) {
      console.log(`⚠️ Redis not available, invalidating pattern from in-memory cache: ${pattern}`);
      
      // Convert pattern to regex (simple conversion, not full Redis pattern support)
      const regexPattern = new RegExp(pattern.replace('*', '.*'));
      let count = 0;
      
      // Delete matching keys
      for (const key of mockCache.keys()) {
        if (regexPattern.test(key)) {
          mockCache.delete(key);
          count++;
        }
      }
      
      console.log(`Invalidated ${count} keys from in-memory cache`);
      return count;
    }
    
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      return keys.length;
    }
    return 0;
  } catch (error) {
    console.error('Redis pattern invalidation error:', error);
    return 0;
  }
};

export const getCacheKeys = async (pattern: string = '*'): Promise<string[]> => {
  try {
    if (!redisClient || !isConnected) {
      console.log(`⚠️ Redis not available, getting keys from in-memory cache with pattern: ${pattern}`);
      
      // Convert pattern to regex (simple conversion, not full Redis pattern support)
      const regexPattern = new RegExp(pattern.replace('*', '.*'));
      
      // Get matching keys
      const keys: string[] = [];
      for (const key of mockCache.keys()) {
        if (regexPattern.test(key)) {
          keys.push(key);
        }
      }
      
      return keys;
    }
    
    return await redisClient.keys(pattern);
  } catch (error) {
    console.error('Redis get keys error:', error);
    return [];
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    if (!redisClient || !isConnected) {
      console.log('⚠️ Redis not available, using in-memory cache instead');
      return true; // Mock implementation is always "healthy"
    }
    
    // Perform PING command to check if Redis is responsive
    const response = await redisClient.ping();
    return response === 'PONG';
  } catch (error) {
    console.error('Redis health check error:', error);
    return false;
  }
};

