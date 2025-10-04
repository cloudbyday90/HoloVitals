/**
 * Sync Orchestration Service
 * 
 * Central service for managing bidirectional EHR data synchronization.
 * Handles job scheduling, queue management, and sync coordination across all EHR providers.
 */

import { PrismaClient } from '@prisma/client';
import Bull, { Queue, Job } from 'bull';

const prisma = new PrismaClient();

// Sync Job Types
export enum SyncJobType {
  FULL_SYNC = 'FULL_SYNC',
  INCREMENTAL_SYNC = 'INCREMENTAL_SYNC',
  PATIENT_SYNC = 'PATIENT_SYNC',
  RESOURCE_SYNC = 'RESOURCE_SYNC',
  WEBHOOK_SYNC = 'WEBHOOK_SYNC',
}

// Sync Job Status
export enum SyncJobStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETRYING = 'RETRYING',
}

// Sync Job Priority
export enum SyncJobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
  BACKGROUND = 5,
}

// Sync Direction
export enum SyncDirection {
  INBOUND = 'INBOUND',   // EHR -> HoloVitals
  OUTBOUND = 'OUTBOUND', // HoloVitals -> EHR
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

// Sync Job Configuration
export interface SyncJobConfig {
  jobId: string;
  type: SyncJobType;
  direction: SyncDirection;
  priority: SyncJobPriority;
  ehrProvider: string;
  ehrConnectionId: string;
  userId: string;
  customerId?: string;
  resourceType?: string;
  resourceIds?: string[];
  filters?: Record<string, any>;
  options?: {
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    validateData?: boolean;
    resolveConflicts?: boolean;
    notifyOnComplete?: boolean;
  };
  metadata?: Record<string, any>;
}

// Sync Job Result
export interface SyncJobResult {
  jobId: string;
  status: SyncJobStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  recordsSkipped: number;
  errors: SyncError[];
  conflicts: SyncConflict[];
  summary: {
    patientsProcessed?: number;
    resourcesCreated?: number;
    resourcesUpdated?: number;
    resourcesDeleted?: number;
    bytesTransferred?: number;
  };
  metadata?: Record<string, any>;
}

// Sync Error
export interface SyncError {
  errorId: string;
  timestamp: Date;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING';
  code: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

// Sync Conflict
export interface SyncConflict {
  conflictId: string;
  timestamp: Date;
  resourceType: string;
  resourceId: string;
  field: string;
  localValue: any;
  remoteValue: any;
  resolution?: 'LOCAL' | 'REMOTE' | 'MERGE' | 'MANUAL';
  resolvedValue?: any;
  resolvedBy?: string;
  resolvedAt?: Date;
}

// Sync Statistics
export interface SyncStatistics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeJobs: number;
  queuedJobs: number;
  averageDuration: number;
  successRate: number;
  totalRecordsProcessed: number;
  totalBytesTransferred: number;
  lastSyncTime?: Date;
  nextScheduledSync?: Date;
}

/**
 * Sync Orchestration Service
 */
export class SyncOrchestrationService {
  private syncQueue: Queue;
  private webhookQueue: Queue;
  private retryQueue: Queue;
  
  constructor() {
    // Initialize Bull queues with Redis
    this.syncQueue = new Bull('sync-jobs', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    this.webhookQueue = new Bull('webhook-jobs', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.retryQueue = new Bull('retry-jobs', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    });

    this.setupQueueProcessors();
    this.setupQueueEventHandlers();
  }

  /**
   * Create a new sync job
   */
  async createSyncJob(config: SyncJobConfig): Promise<string> {
    try {
      // Validate configuration
      this.validateSyncConfig(config);

      // Create job in database
      const syncJob = await prisma.syncJob.create({
        data: {
          id: config.jobId,
          type: config.type,
          direction: config.direction,
          priority: config.priority,
          status: SyncJobStatus.PENDING,
          ehrProvider: config.ehrProvider,
          ehrConnectionId: config.ehrConnectionId,
          userId: config.userId,
          customerId: config.customerId,
          resourceType: config.resourceType,
          resourceIds: config.resourceIds,
          filters: config.filters,
          options: config.options,
          metadata: config.metadata,
          createdAt: new Date(),
        },
      });

      // Add job to queue
      await this.syncQueue.add(
        config.type,
        config,
        {
          jobId: config.jobId,
          priority: config.priority,
          attempts: config.options?.maxRetries || 3,
          backoff: {
            type: 'exponential',
            delay: config.options?.retryDelay || 2000,
          },
          timeout: config.options?.timeout || 300000, // 5 minutes default
        }
      );

      // Update status to queued
      await prisma.syncJob.update({
        where: { id: config.jobId },
        data: { status: SyncJobStatus.QUEUED },
      });

      return config.jobId;
    } catch (error) {
      console.error('Error creating sync job:', error);
      throw new Error(`Failed to create sync job: ${error.message}`);
    }
  }

  /**
   * Schedule recurring sync job
   */
  async scheduleRecurringSync(
    config: SyncJobConfig,
    cronExpression: string
  ): Promise<string> {
    try {
      const repeatableJob = await this.syncQueue.add(
        config.type,
        config,
        {
          repeat: {
            cron: cronExpression,
          },
          jobId: `recurring-${config.jobId}`,
        }
      );

      return repeatableJob.id as string;
    } catch (error) {
      console.error('Error scheduling recurring sync:', error);
      throw new Error(`Failed to schedule recurring sync: ${error.message}`);
    }
  }

  /**
   * Cancel a sync job
   */
  async cancelSyncJob(jobId: string): Promise<void> {
    try {
      const job = await this.syncQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }

      await prisma.syncJob.update({
        where: { id: jobId },
        data: { 
          status: SyncJobStatus.CANCELLED,
          endTime: new Date(),
        },
      });
    } catch (error) {
      console.error('Error cancelling sync job:', error);
      throw new Error(`Failed to cancel sync job: ${error.message}`);
    }
  }

  /**
   * Retry a failed sync job
   */
  async retrySyncJob(jobId: string): Promise<void> {
    try {
      const syncJob = await prisma.syncJob.findUnique({
        where: { id: jobId },
      });

      if (!syncJob) {
        throw new Error('Sync job not found');
      }

      if (syncJob.status !== SyncJobStatus.FAILED) {
        throw new Error('Only failed jobs can be retried');
      }

      // Update status
      await prisma.syncJob.update({
        where: { id: jobId },
        data: { 
          status: SyncJobStatus.RETRYING,
          retryCount: { increment: 1 },
        },
      });

      // Add to retry queue
      await this.retryQueue.add(
        'retry',
        syncJob,
        {
          jobId: `retry-${jobId}`,
          priority: SyncJobPriority.HIGH,
        }
      );
    } catch (error) {
      console.error('Error retrying sync job:', error);
      throw new Error(`Failed to retry sync job: ${error.message}`);
    }
  }

  /**
   * Get sync job status
   */
  async getSyncJobStatus(jobId: string): Promise<SyncJobResult | null> {
    try {
      const syncJob = await prisma.syncJob.findUnique({
        where: { id: jobId },
        include: {
          errors: true,
          conflicts: true,
        },
      });

      if (!syncJob) {
        return null;
      }

      return {
        jobId: syncJob.id,
        status: syncJob.status as SyncJobStatus,
        startTime: syncJob.startTime || syncJob.createdAt,
        endTime: syncJob.endTime || undefined,
        duration: syncJob.duration || undefined,
        recordsProcessed: syncJob.recordsProcessed || 0,
        recordsSucceeded: syncJob.recordsSucceeded || 0,
        recordsFailed: syncJob.recordsFailed || 0,
        recordsSkipped: syncJob.recordsSkipped || 0,
        errors: syncJob.errors || [],
        conflicts: syncJob.conflicts || [],
        summary: syncJob.summary || {},
        metadata: syncJob.metadata || {},
      };
    } catch (error) {
      console.error('Error getting sync job status:', error);
      throw new Error(`Failed to get sync job status: ${error.message}`);
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(
    ehrConnectionId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SyncStatistics> {
    try {
      const where: any = { ehrConnectionId };
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [totalJobs, completedJobs, failedJobs, activeJobs, queuedJobs] = await Promise.all([
        prisma.syncJob.count({ where }),
        prisma.syncJob.count({ where: { ...where, status: SyncJobStatus.COMPLETED } }),
        prisma.syncJob.count({ where: { ...where, status: SyncJobStatus.FAILED } }),
        prisma.syncJob.count({ where: { ...where, status: SyncJobStatus.PROCESSING } }),
        prisma.syncJob.count({ where: { ...where, status: SyncJobStatus.QUEUED } }),
      ]);

      const completedJobsData = await prisma.syncJob.findMany({
        where: { ...where, status: SyncJobStatus.COMPLETED },
        select: {
          duration: true,
          recordsProcessed: true,
          summary: true,
        },
      });

      const averageDuration = completedJobsData.length > 0
        ? completedJobsData.reduce((sum, job) => sum + (job.duration || 0), 0) / completedJobsData.length
        : 0;

      const totalRecordsProcessed = completedJobsData.reduce(
        (sum, job) => sum + (job.recordsProcessed || 0),
        0
      );

      const totalBytesTransferred = completedJobsData.reduce(
        (sum, job) => sum + ((job.summary as any)?.bytesTransferred || 0),
        0
      );

      const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      const lastSync = await prisma.syncJob.findFirst({
        where: { ...where, status: SyncJobStatus.COMPLETED },
        orderBy: { endTime: 'desc' },
        select: { endTime: true },
      });

      return {
        totalJobs,
        completedJobs,
        failedJobs,
        activeJobs,
        queuedJobs,
        averageDuration,
        successRate,
        totalRecordsProcessed,
        totalBytesTransferred,
        lastSyncTime: lastSync?.endTime || undefined,
      };
    } catch (error) {
      console.error('Error getting sync statistics:', error);
      throw new Error(`Failed to get sync statistics: ${error.message}`);
    }
  }

  /**
   * Get active sync jobs
   */
  async getActiveSyncJobs(ehrConnectionId?: string): Promise<SyncJobResult[]> {
    try {
      const where: any = {
        status: {
          in: [SyncJobStatus.PROCESSING, SyncJobStatus.QUEUED],
        },
      };

      if (ehrConnectionId) {
        where.ehrConnectionId = ehrConnectionId;
      }

      const jobs = await prisma.syncJob.findMany({
        where,
        include: {
          errors: true,
          conflicts: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return jobs.map(job => ({
        jobId: job.id,
        status: job.status as SyncJobStatus,
        startTime: job.startTime || job.createdAt,
        endTime: job.endTime || undefined,
        duration: job.duration || undefined,
        recordsProcessed: job.recordsProcessed || 0,
        recordsSucceeded: job.recordsSucceeded || 0,
        recordsFailed: job.recordsFailed || 0,
        recordsSkipped: job.recordsSkipped || 0,
        errors: job.errors || [],
        conflicts: job.conflicts || [],
        summary: job.summary || {},
        metadata: job.metadata || {},
      }));
    } catch (error) {
      console.error('Error getting active sync jobs:', error);
      throw new Error(`Failed to get active sync jobs: ${error.message}`);
    }
  }

  /**
   * Get sync history
   */
  async getSyncHistory(
    ehrConnectionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ jobs: SyncJobResult[]; total: number }> {
    try {
      const [jobs, total] = await Promise.all([
        prisma.syncJob.findMany({
          where: { ehrConnectionId },
          include: {
            errors: true,
            conflicts: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.syncJob.count({ where: { ehrConnectionId } }),
      ]);

      return {
        jobs: jobs.map(job => ({
          jobId: job.id,
          status: job.status as SyncJobStatus,
          startTime: job.startTime || job.createdAt,
          endTime: job.endTime || undefined,
          duration: job.duration || undefined,
          recordsProcessed: job.recordsProcessed || 0,
          recordsSucceeded: job.recordsSucceeded || 0,
          recordsFailed: job.recordsFailed || 0,
          recordsSkipped: job.recordsSkipped || 0,
          errors: job.errors || [],
          conflicts: job.conflicts || [],
          summary: job.summary || {},
          metadata: job.metadata || {},
        })),
        total,
      };
    } catch (error) {
      console.error('Error getting sync history:', error);
      throw new Error(`Failed to get sync history: ${error.message}`);
    }
  }

  /**
   * Validate sync configuration
   */
  private validateSyncConfig(config: SyncJobConfig): void {
    if (!config.jobId) {
      throw new Error('Job ID is required');
    }
    if (!config.type) {
      throw new Error('Job type is required');
    }
    if (!config.direction) {
      throw new Error('Sync direction is required');
    }
    if (!config.ehrProvider) {
      throw new Error('EHR provider is required');
    }
    if (!config.ehrConnectionId) {
      throw new Error('EHR connection ID is required');
    }
    if (!config.userId) {
      throw new Error('User ID is required');
    }
  }

  /**
   * Setup queue processors
   */
  private setupQueueProcessors(): void {
    // Main sync queue processor
    this.syncQueue.process('*', async (job: Job) => {
      const config = job.data as SyncJobConfig;
      
      try {
        // Update status to processing
        await prisma.syncJob.update({
          where: { id: config.jobId },
          data: { 
            status: SyncJobStatus.PROCESSING,
            startTime: new Date(),
          },
        });

        // Process sync job based on type
        const result = await this.processSyncJob(config);

        // Update job with results
        await prisma.syncJob.update({
          where: { id: config.jobId },
          data: {
            status: SyncJobStatus.COMPLETED,
            endTime: new Date(),
            duration: result.duration,
            recordsProcessed: result.recordsProcessed,
            recordsSucceeded: result.recordsSucceeded,
            recordsFailed: result.recordsFailed,
            recordsSkipped: result.recordsSkipped,
            summary: result.summary,
          },
        });

        return result;
      } catch (error) {
        // Update status to failed
        await prisma.syncJob.update({
          where: { id: config.jobId },
          data: {
            status: SyncJobStatus.FAILED,
            endTime: new Date(),
          },
        });

        throw error;
      }
    });

    // Webhook queue processor
    this.webhookQueue.process(async (job: Job) => {
      // Process webhook
      return await this.processWebhook(job.data);
    });

    // Retry queue processor
    this.retryQueue.process(async (job: Job) => {
      const config = job.data as SyncJobConfig;
      return await this.processSyncJob(config);
    });
  }

  /**
   * Setup queue event handlers
   */
  private setupQueueEventHandlers(): void {
    this.syncQueue.on('completed', (job, result) => {
      console.log(`Sync job ${job.id} completed successfully`);
    });

    this.syncQueue.on('failed', (job, error) => {
      console.error(`Sync job ${job.id} failed:`, error);
    });

    this.syncQueue.on('stalled', (job) => {
      console.warn(`Sync job ${job.id} stalled`);
    });
  }

  /**
   * Process sync job (placeholder - will be implemented with provider adapters)
   */
  private async processSyncJob(config: SyncJobConfig): Promise<SyncJobResult> {
    const startTime = new Date();
    
    // This will be implemented with provider-specific adapters
    // For now, return a mock result
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    return {
      jobId: config.jobId,
      status: SyncJobStatus.COMPLETED,
      startTime,
      endTime,
      duration,
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      recordsSkipped: 0,
      errors: [],
      conflicts: [],
      summary: {},
    };
  }

  /**
   * Process webhook (placeholder)
   */
  private async processWebhook(data: any): Promise<void> {
    // This will be implemented with webhook handlers
    console.log('Processing webhook:', data);
  }

  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    await this.syncQueue.close();
    await this.webhookQueue.close();
    await this.retryQueue.close();
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const syncOrchestrationService = new SyncOrchestrationService();