/**
 * Sync Queue Configuration
 * Manages job queues for EHR data synchronization
 */

import { Queue, Worker, Job } from 'bullmq';
import { createRedisConnection } from '@/lib/config/redis';
import { SyncOrchestrationService } from '@/lib/services/sync/SyncOrchestrationService';

// Queue names
export const QUEUE_NAMES = {
  SYNC_JOBS: 'sync-jobs',
  WEBHOOK_PROCESSING: 'webhook-processing',
  CONFLICT_RESOLUTION: 'conflict-resolution',
  DATA_TRANSFORMATION: 'data-transformation',
} as const;

// Job priorities
export const JOB_PRIORITIES = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
  BACKGROUND: 5,
} as const;

// Create queue instances
export const syncJobQueue = new Queue(QUEUE_NAMES.SYNC_JOBS, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
      age: 7 * 24 * 3600, // Keep for 7 days
    },
  },
});

export const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK_PROCESSING, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const conflictQueue = new Queue(QUEUE_NAMES.CONFLICT_RESOLUTION, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 1, // Conflicts should be resolved manually if auto-resolution fails
  },
});

export const transformationQueue = new Queue(QUEUE_NAMES.DATA_TRANSFORMATION, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Worker for sync jobs
const syncOrchestrationService = new SyncOrchestrationService();

export const syncJobWorker = new Worker(
  QUEUE_NAMES.SYNC_JOBS,
  async (job: Job) => {
    console.log(`Processing sync job ${job.id}:`, job.data);
    
    try {
      // Process the sync job
      const result = await syncOrchestrationService.processSyncJob(job.data);
      return result;
    } catch (error) {
      console.error(`Error processing sync job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 5, // Process up to 5 jobs concurrently
  }
);

// Worker event handlers
syncJobWorker.on('completed', (job) => {
  console.log(`✅ Sync job ${job.id} completed successfully`);
});

syncJobWorker.on('failed', (job, err) => {
  console.error(`❌ Sync job ${job?.id} failed:`, err);
});

syncJobWorker.on('error', (err) => {
  console.error('❌ Sync worker error:', err);
});

// Worker for webhook processing
export const webhookWorker = new Worker(
  QUEUE_NAMES.WEBHOOK_PROCESSING,
  async (job: Job) => {
    console.log(`Processing webhook ${job.id}:`, job.data);
    
    try {
      // Process the webhook
      const result = await syncOrchestrationService.processWebhook(job.data);
      return result;
    } catch (error) {
      console.error(`Error processing webhook ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 10, // Process up to 10 webhooks concurrently
  }
);

webhookWorker.on('completed', (job) => {
  console.log(`✅ Webhook ${job.id} processed successfully`);
});

webhookWorker.on('failed', (job, err) => {
  console.error(`❌ Webhook ${job?.id} failed:`, err);
});

// Worker for conflict resolution
export const conflictWorker = new Worker(
  QUEUE_NAMES.CONFLICT_RESOLUTION,
  async (job: Job) => {
    console.log(`Processing conflict ${job.id}:`, job.data);
    
    try {
      // Attempt auto-resolution
      const result = await syncOrchestrationService.resolveConflict(job.data);
      return result;
    } catch (error) {
      console.error(`Error resolving conflict ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 3,
  }
);

conflictWorker.on('completed', (job) => {
  console.log(`✅ Conflict ${job.id} resolved successfully`);
});

conflictWorker.on('failed', (job, err) => {
  console.error(`❌ Conflict ${job?.id} resolution failed:`, err);
});

// Worker for data transformation
export const transformationWorker = new Worker(
  QUEUE_NAMES.DATA_TRANSFORMATION,
  async (job: Job) => {
    console.log(`Processing transformation ${job.id}:`, job.data);
    
    try {
      // Transform the data
      const result = await syncOrchestrationService.transformData(job.data);
      return result;
    } catch (error) {
      console.error(`Error transforming data ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 10,
  }
);

transformationWorker.on('completed', (job) => {
  console.log(`✅ Transformation ${job.id} completed successfully`);
});

transformationWorker.on('failed', (job, err) => {
  console.error(`❌ Transformation ${job?.id} failed:`, err);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down workers...');
  
  await Promise.all([
    syncJobWorker.close(),
    webhookWorker.close(),
    conflictWorker.close(),
    transformationWorker.close(),
  ]);
  
  await Promise.all([
    syncJobQueue.close(),
    webhookQueue.close(),
    conflictQueue.close(),
    transformationQueue.close(),
  ]);
  
  console.log('All workers and queues closed');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Export queue utilities
export const addSyncJob = async (data: any, options?: any) => {
  return await syncJobQueue.add('sync', data, options);
};

export const addWebhookJob = async (data: any, options?: any) => {
  return await webhookQueue.add('webhook', data, options);
};

export const addConflictJob = async (data: any, options?: any) => {
  return await conflictQueue.add('conflict', data, options);
};

export const addTransformationJob = async (data: any, options?: any) => {
  return await transformationQueue.add('transformation', data, options);
};

// Get queue statistics
export const getQueueStats = async () => {
  const [syncStats, webhookStats, conflictStats, transformationStats] = await Promise.all([
    syncJobQueue.getJobCounts(),
    webhookQueue.getJobCounts(),
    conflictQueue.getJobCounts(),
    transformationQueue.getJobCounts(),
  ]);

  return {
    syncJobs: syncStats,
    webhooks: webhookStats,
    conflicts: conflictStats,
    transformations: transformationStats,
  };
};