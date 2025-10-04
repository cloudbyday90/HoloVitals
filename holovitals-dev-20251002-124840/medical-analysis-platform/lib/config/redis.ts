/**
 * Redis Configuration for HoloVitals Sync System
 * Handles connection to Redis for queue management
 */

import { Redis } from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
};

// Create Redis client for general use
export const redisClient = new Redis(redisConfig);

// Create Redis client for Bull/BullMQ
export const createRedisConnection = () => {
  return new Redis(redisConfig);
};

// Connection event handlers
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redisClient.on('ready', () => {
  console.log('✅ Redis is ready to accept commands');
});

redisClient.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redisClient.quit();
  process.exit(0);
});

export default redisClient;