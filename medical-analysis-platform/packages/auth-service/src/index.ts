import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';
import { loggingMiddleware } from './middleware/logging';
import { rateLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Redis Client
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    service: 'auth-service',
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  // Disconnect Prisma
  await prisma.$disconnect();
  console.log('✅ Database connection closed');
  
  // Disconnect Redis
  redis.disconnect();
  console.log('✅ Redis connection closed');
  
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

export default app;