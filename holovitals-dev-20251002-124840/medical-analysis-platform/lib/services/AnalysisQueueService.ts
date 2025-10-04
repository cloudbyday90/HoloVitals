/**
 * Analysis Queue Service
 * 
 * Priority-based task queue management for concurrent analysis processing.
 * Handles task lifecycle, progress tracking, error handling, and resource allocation.
 * 
 * Features:
 * - Priority queue (URGENT → HIGH → NORMAL → LOW)
 * - Concurrent task processing
 * - Progress tracking (0-100%)
 * - Automatic retries on failure
 * - Task cancellation
 * - Estimated completion time
 * - Resource allocation
 */

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

// Task priority levels
export enum TaskPriority {
  URGENT = 'URGENT',     // Process immediately (medical emergencies)
  HIGH = 'HIGH',         // Process soon (critical analysis)
  NORMAL = 'NORMAL',     // Standard processing
  LOW = 'LOW'           // Background processing
}

// Task status
export enum TaskStatus {
  PENDING = 'PENDING',           // Waiting in queue
  PROCESSING = 'PROCESSING',     // Currently being processed
  COMPLETED = 'COMPLETED',       // Successfully completed
  FAILED = 'FAILED',            // Failed after retries
  CANCELLED = 'CANCELLED'        // Cancelled by user
}

// Task type
export enum TaskType {
  DOCUMENT_ANALYSIS = 'DOCUMENT_ANALYSIS',
  CHAT_RESPONSE = 'CHAT_RESPONSE',
  BATCH_PROCESSING = 'BATCH_PROCESSING',
  REPORT_GENERATION = 'REPORT_GENERATION'
}

// Task request
export interface AnalysisTaskRequest {
  userId: string;
  type: TaskType;
  priority?: TaskPriority;
  data: any;
  metadata?: Record<string, any>;
}

// Task result
export interface AnalysisTask {
  id: string;
  userId: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  data: any;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  estimatedCompletionTime?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Queue statistics
export interface QueueStatistics {
  totalTasks: number;
  pendingTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  queueLength: number;
  estimatedWaitTime: number;
}

// Task processor function type
export type TaskProcessor = (task: AnalysisTask) => Promise<any>;

export class AnalysisQueueService extends EventEmitter {
  private static instance: AnalysisQueueService;
  private processors: Map<TaskType, TaskProcessor> = new Map();
  private processingTasks: Set<string> = new Set();
  private maxConcurrentTasks: number = 5;
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AnalysisQueueService {
    if (!AnalysisQueueService.instance) {
      AnalysisQueueService.instance = new AnalysisQueueService();
    }
    return AnalysisQueueService.instance;
  }

  /**
   * Register a task processor
   */
  registerProcessor(type: TaskType, processor: TaskProcessor): void {
    this.processors.set(type, processor);
  }

  /**
   * Set maximum concurrent tasks
   */
  setMaxConcurrentTasks(max: number): void {
    this.maxConcurrentTasks = max;
  }

  /**
   * Submit a new task to the queue
   */
  async submitTask(request: AnalysisTaskRequest): Promise<AnalysisTask> {
    const priority = request.priority || TaskPriority.NORMAL;
    const maxRetries = this.getMaxRetriesByPriority(priority);

    // Create task in database
    const task = await prisma.analysisTask.create({
      data: {
        userId: request.userId,
        type: request.type,
        priority,
        status: TaskStatus.PENDING,
        progress: 0,
        data: JSON.stringify(request.data),
        retryCount: 0,
        maxRetries,
        metadata: request.metadata ? JSON.stringify(request.metadata) : null
      }
    });

    // Emit task submitted event
    this.emit('taskSubmitted', task);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return this.mapTaskFromDb(task);
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<AnalysisTask | null> {
    const task = await prisma.analysisTask.findUnique({
      where: { id: taskId }
    });

    return task ? this.mapTaskFromDb(task) : null;
  }

  /**
   * Get tasks for a user
   */
  async getUserTasks(
    userId: string,
    options?: {
      status?: TaskStatus;
      type?: TaskType;
      limit?: number;
      offset?: number;
    }
  ): Promise<AnalysisTask[]> {
    const where: any = { userId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.type) {
      where.type = options.type;
    }

    const tasks = await prisma.analysisTask.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' }
      ],
      take: options?.limit || 50,
      skip: options?.offset || 0
    });

    return tasks.map(task => this.mapTaskFromDb(task));
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string, userId: string): Promise<boolean> {
    const task = await prisma.analysisTask.findUnique({
      where: { id: taskId }
    });

    if (!task || task.userId !== userId) {
      return false;
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return false;
    }

    await prisma.analysisTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.CANCELLED,
        updatedAt: new Date()
      }
    });

    this.emit('taskCancelled', taskId);
    return true;
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(): Promise<QueueStatistics> {
    const [
      totalTasks,
      pendingTasks,
      processingTasks,
      completedTasks,
      failedTasks,
      avgProcessingTime
    ] = await Promise.all([
      prisma.analysisTask.count(),
      prisma.analysisTask.count({ where: { status: TaskStatus.PENDING } }),
      prisma.analysisTask.count({ where: { status: TaskStatus.PROCESSING } }),
      prisma.analysisTask.count({ where: { status: TaskStatus.COMPLETED } }),
      prisma.analysisTask.count({ where: { status: TaskStatus.FAILED } }),
      this.calculateAverageProcessingTime()
    ]);

    const queueLength = pendingTasks;
    const estimatedWaitTime = this.calculateEstimatedWaitTime(queueLength, avgProcessingTime);

    return {
      totalTasks,
      pendingTasks,
      processingTasks,
      completedTasks,
      failedTasks,
      averageProcessingTime: avgProcessingTime,
      queueLength,
      estimatedWaitTime
    };
  }

  /**
   * Start processing tasks
   */
  private startProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      this.processNextTasks();
    }, 1000); // Check every second
  }

  /**
   * Stop processing tasks
   */
  stopProcessing(): void {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Process next tasks from queue
   */
  private async processNextTasks(): Promise<void> {
    try {
      // Check if we can process more tasks
      const availableSlots = this.maxConcurrentTasks - this.processingTasks.size;
      if (availableSlots <= 0) return;

      // Get pending tasks ordered by priority
      const tasks = await prisma.analysisTask.findMany({
        where: { status: TaskStatus.PENDING },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'asc' }
        ],
        take: availableSlots
      });

      // Process each task
      for (const task of tasks) {
        this.processTask(this.mapTaskFromDb(task));
      }
    } catch (error) {
      console.error('Error processing next tasks:', error);
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: AnalysisTask): Promise<void> {
    // Mark as processing
    this.processingTasks.add(task.id);

    try {
      // Update task status
      await prisma.analysisTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.PROCESSING,
          startedAt: new Date(),
          updatedAt: new Date()
        }
      });

      this.emit('taskStarted', task);

      // Get processor for task type
      const processor = this.processors.get(task.type);
      if (!processor) {
        throw new Error(`No processor registered for task type: ${task.type}`);
      }

      // Process task
      const result = await processor(task);

      // Update task as completed
      await prisma.analysisTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.COMPLETED,
          progress: 100,
          result: JSON.stringify(result),
          completedAt: new Date(),
          updatedAt: new Date()
        }
      });

      this.emit('taskCompleted', task.id, result);

    } catch (error: any) {
      console.error(`Error processing task ${task.id}:`, error);

      // Check if we should retry
      if (task.retryCount < task.maxRetries) {
        // Retry task
        await prisma.analysisTask.update({
          where: { id: task.id },
          data: {
            status: TaskStatus.PENDING,
            retryCount: task.retryCount + 1,
            error: error.message,
            updatedAt: new Date()
          }
        });

        this.emit('taskRetry', task.id, task.retryCount + 1);
      } else {
        // Mark as failed
        await prisma.analysisTask.update({
          where: { id: task.id },
          data: {
            status: TaskStatus.FAILED,
            error: error.message,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });

        this.emit('taskFailed', task.id, error);
      }
    } finally {
      // Remove from processing set
      this.processingTasks.delete(task.id);
    }
  }

  /**
   * Update task progress
   */
  async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: {
        progress: Math.min(100, Math.max(0, progress)),
        updatedAt: new Date()
      }
    });

    this.emit('taskProgress', taskId, progress);
  }

  /**
   * Get max retries by priority
   */
  private getMaxRetriesByPriority(priority: TaskPriority): number {
    switch (priority) {
      case TaskPriority.URGENT:
        return 5;
      case TaskPriority.HIGH:
        return 3;
      case TaskPriority.NORMAL:
        return 2;
      case TaskPriority.LOW:
        return 1;
      default:
        return 2;
    }
  }

  /**
   * Calculate average processing time
   */
  private async calculateAverageProcessingTime(): Promise<number> {
    const completedTasks = await prisma.analysisTask.findMany({
      where: {
        status: TaskStatus.COMPLETED,
        startedAt: { not: null },
        completedAt: { not: null }
      },
      select: {
        startedAt: true,
        completedAt: true
      },
      take: 100,
      orderBy: { completedAt: 'desc' }
    });

    if (completedTasks.length === 0) return 60000; // Default 1 minute

    const totalTime = completedTasks.reduce((sum, task) => {
      const duration = task.completedAt!.getTime() - task.startedAt!.getTime();
      return sum + duration;
    }, 0);

    return totalTime / completedTasks.length;
  }

  /**
   * Calculate estimated wait time
   */
  private calculateEstimatedWaitTime(queueLength: number, avgProcessingTime: number): number {
    if (queueLength === 0) return 0;
    
    const tasksPerSlot = Math.ceil(queueLength / this.maxConcurrentTasks);
    return tasksPerSlot * avgProcessingTime;
  }

  /**
   * Map database task to AnalysisTask
   */
  private mapTaskFromDb(dbTask: any): AnalysisTask {
    return {
      id: dbTask.id,
      userId: dbTask.userId,
      type: dbTask.type as TaskType,
      priority: dbTask.priority as TaskPriority,
      status: dbTask.status as TaskStatus,
      progress: dbTask.progress,
      data: dbTask.data ? JSON.parse(dbTask.data) : null,
      result: dbTask.result ? JSON.parse(dbTask.result) : null,
      error: dbTask.error,
      retryCount: dbTask.retryCount,
      maxRetries: dbTask.maxRetries,
      estimatedCompletionTime: dbTask.estimatedCompletionTime,
      startedAt: dbTask.startedAt,
      completedAt: dbTask.completedAt,
      createdAt: dbTask.createdAt,
      updatedAt: dbTask.updatedAt,
      metadata: dbTask.metadata ? JSON.parse(dbTask.metadata) : null
    };
  }

  /**
   * Clean up old completed tasks
   */
  async cleanupOldTasks(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.analysisTask.deleteMany({
      where: {
        status: {
          in: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]
        },
        completedAt: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }
}

// Export singleton instance
export const analysisQueue = AnalysisQueueService.getInstance();