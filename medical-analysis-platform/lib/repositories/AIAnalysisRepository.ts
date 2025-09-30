/**
 * AI Analysis Repository
 * 
 * This repository actively analyzes data and seeks the missing pieces of the "puzzle"
 * that need to be analyzed. It stores:
 * - Patient info (sanitized)
 * - Data to be analyzed
 * - Context from Context Cache Repository
 * - AI prompts from Prompt Optimization Repository
 * - Analysis results and status
 */

import { IRepository, RepositoryHealth } from './interfaces/IRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalysisTask {
  id: string;
  patientId: string;
  documentIds: string[];
  query: string;
  context: AnalysisContext;
  prompt: OptimizedPrompt;
  status: AnalysisStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  result?: AnalysisResult;
  missingPieces?: MissingPiece[];
}

export interface AnalysisContext {
  relevantDocuments: string[];
  historicalData: any[];
  relatedFindings: any[];
  temporalContext: {
    dateRange: { start: Date; end: Date };
    documentCount: number;
  };
  medicalContext: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  };
}

export interface OptimizedPrompt {
  id: string;
  template: string;
  variables: Record<string, any>;
  optimizationScore: number;
  estimatedTokens: number;
  version: string;
}

export type AnalysisStatus = 
  | 'pending'           // Waiting to be processed
  | 'gathering_context' // Collecting context from cache
  | 'optimizing_prompt' // Getting optimized prompt
  | 'analyzing'         // AI is analyzing
  | 'completed'         // Analysis complete
  | 'failed'            // Analysis failed
  | 'missing_data';     // Missing required data

export interface AnalysisResult {
  answer: string;
  confidence: number;
  sources: string[];
  insights: Insight[];
  recommendations: string[];
  flags: AnalysisFlag[];
  tokensUsed: number;
  processingTime: number;
}

export interface Insight {
  type: 'trend' | 'anomaly' | 'correlation' | 'risk' | 'improvement';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  confidence: number;
}

export interface AnalysisFlag {
  type: 'abnormal_value' | 'missing_data' | 'inconsistency' | 'urgent' | 'follow_up';
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  affectedFields: string[];
}

export interface MissingPiece {
  type: 'document' | 'data_point' | 'context' | 'historical_data';
  description: string;
  importance: 'required' | 'recommended' | 'optional';
  suggestedAction: string;
}

export class AIAnalysisRepository implements IRepository<AnalysisTask> {
  readonly name = 'AIAnalysisRepository';
  readonly version = '1.0.0';
  
  private tasks: Map<string, AnalysisTask> = new Map();
  private processingQueue: string[] = [];

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    
    // Load pending tasks from database
    const pendingTasks = await prisma.analysisSession.findMany({
      where: {
        sessionType: 'ai_analysis'
      },
      include: {
        interactions: true
      }
    });

    console.log(`[${this.name}] Loaded ${pendingTasks.length} pending tasks`);
  }

  /**
   * Create a new analysis task
   */
  async createTask(
    patientId: string,
    documentIds: string[],
    query: string
  ): Promise<AnalysisTask> {
    const taskId = this.generateTaskId();
    
    const task: AnalysisTask = {
      id: taskId,
      patientId,
      documentIds,
      query,
      context: await this.gatherInitialContext(documentIds),
      prompt: await this.getOptimizedPrompt(query),
      status: 'pending',
      priority: this.calculatePriority(query, documentIds),
      createdAt: new Date(),
      updatedAt: new Date(),
      missingPieces: []
    };

    await this.store(taskId, task);
    this.addToQueue(taskId);

    return task;
  }

  /**
   * Store analysis task
   */
  async store(key: string, data: AnalysisTask): Promise<void> {
    this.tasks.set(key, data);
    
    // Persist to database
    await prisma.analysisSession.upsert({
      where: { id: key },
      create: {
        id: key,
        userId: data.patientId,
        sessionType: 'ai_analysis',
        createdAt: data.createdAt
      },
      update: {
        updatedAt: data.updatedAt
      }
    });
  }

  /**
   * Retrieve analysis task
   */
  async retrieve(key: string): Promise<AnalysisTask | null> {
    return this.tasks.get(key) || null;
  }

  /**
   * Update analysis task
   */
  async update(key: string, data: Partial<AnalysisTask>): Promise<void> {
    const existing = await this.retrieve(key);
    if (!existing) {
      throw new Error(`Task ${key} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    await this.store(key, updated);
  }

  /**
   * Delete analysis task
   */
  async delete(key: string): Promise<void> {
    this.tasks.delete(key);
    await prisma.analysisSession.delete({
      where: { id: key }
    });
  }

  /**
   * Check if task exists
   */
  async exists(key: string): Promise<boolean> {
    return this.tasks.has(key);
  }

  /**
   * Clear all tasks
   */
  async clear(): Promise<void> {
    this.tasks.clear();
    this.processingQueue = [];
  }

  /**
   * Get repository health
   */
  async getHealth(): Promise<RepositoryHealth> {
    const taskCount = this.tasks.size;
    const queueLength = this.processingQueue.length;
    
    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    for (const task of this.tasks.values()) {
      if (task.status === 'pending') statusCounts.pending++;
      else if (task.status === 'analyzing') statusCounts.processing++;
      else if (task.status === 'completed') statusCounts.completed++;
      else if (task.status === 'failed') statusCounts.failed++;
    }

    const issues: string[] = [];
    if (queueLength > 100) {
      issues.push(`High queue length: ${queueLength} tasks pending`);
    }
    if (statusCounts.failed > 10) {
      issues.push(`High failure rate: ${statusCounts.failed} failed tasks`);
    }

    return {
      status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'degraded' : 'unhealthy',
      lastCheck: new Date(),
      metrics: {
        itemCount: taskCount,
        storageUsed: this.estimateStorageUsed(),
        averageResponseTime: await this.calculateAverageResponseTime()
      },
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Identify missing pieces for analysis
   */
  async identifyMissingPieces(taskId: string): Promise<MissingPiece[]> {
    const task = await this.retrieve(taskId);
    if (!task) return [];

    const missing: MissingPiece[] = [];

    // Check for missing documents
    if (task.documentIds.length === 0) {
      missing.push({
        type: 'document',
        description: 'No documents provided for analysis',
        importance: 'required',
        suggestedAction: 'Upload relevant medical documents'
      });
    }

    // Check for missing context
    if (!task.context.historicalData || task.context.historicalData.length === 0) {
      missing.push({
        type: 'historical_data',
        description: 'No historical data available for trend analysis',
        importance: 'recommended',
        suggestedAction: 'Upload previous test results for comparison'
      });
    }

    // Check for missing medical context
    if (task.context.medicalContext.conditions.length === 0) {
      missing.push({
        type: 'context',
        description: 'No medical conditions recorded',
        importance: 'optional',
        suggestedAction: 'Add known medical conditions for better context'
      });
    }

    // Update task with missing pieces
    await this.update(taskId, { missingPieces: missing });

    return missing;
  }

  /**
   * Process next task in queue
   */
  async processNextTask(): Promise<AnalysisTask | null> {
    if (this.processingQueue.length === 0) {
      return null;
    }

    const taskId = this.processingQueue.shift()!;
    const task = await this.retrieve(taskId);
    
    if (!task) {
      return null;
    }

    // Check for missing pieces
    const missingPieces = await this.identifyMissingPieces(taskId);
    
    if (missingPieces.some(p => p.importance === 'required')) {
      await this.update(taskId, { 
        status: 'missing_data',
        missingPieces 
      });
      return task;
    }

    // Update status to analyzing
    await this.update(taskId, { status: 'analyzing' });

    return task;
  }

  /**
   * Complete analysis task with result
   */
  async completeTask(taskId: string, result: AnalysisResult): Promise<void> {
    await this.update(taskId, {
      status: 'completed',
      result,
      completedAt: new Date()
    });

    // Store result in database
    await prisma.aiInteraction.create({
      data: {
        sessionId: taskId,
        query: (await this.retrieve(taskId))!.query,
        response: result.answer,
        contextDocuments: (await this.retrieve(taskId))!.documentIds,
        createdAt: new Date()
      }
    });
  }

  /**
   * Mark task as failed
   */
  async failTask(taskId: string, error: string): Promise<void> {
    await this.update(taskId, {
      status: 'failed',
      result: {
        answer: `Analysis failed: ${error}`,
        confidence: 0,
        sources: [],
        insights: [],
        recommendations: [],
        flags: [{
          type: 'urgent',
          description: error,
          severity: 'error',
          affectedFields: []
        }],
        tokensUsed: 0,
        processingTime: 0
      }
    });
  }

  /**
   * Get all tasks by status
   */
  async getTasksByStatus(status: AnalysisStatus): Promise<AnalysisTask[]> {
    const tasks: AnalysisTask[] = [];
    for (const task of this.tasks.values()) {
      if (task.status === status) {
        tasks.push(task);
      }
    }
    return tasks;
  }

  /**
   * Get tasks for a specific patient
   */
  async getPatientTasks(patientId: string): Promise<AnalysisTask[]> {
    const tasks: AnalysisTask[] = [];
    for (const task of this.tasks.values()) {
      if (task.patientId === patientId) {
        tasks.push(task);
      }
    }
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Private helper methods

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async gatherInitialContext(documentIds: string[]): Promise<AnalysisContext> {
    // This will be enhanced to pull from Context Cache Repository
    return {
      relevantDocuments: documentIds,
      historicalData: [],
      relatedFindings: [],
      temporalContext: {
        dateRange: { start: new Date(), end: new Date() },
        documentCount: documentIds.length
      },
      medicalContext: {
        conditions: [],
        medications: [],
        allergies: []
      }
    };
  }

  private async getOptimizedPrompt(query: string): Promise<OptimizedPrompt> {
    // This will be enhanced to pull from Prompt Optimization Repository
    return {
      id: `prompt_${Date.now()}`,
      template: 'Analyze the following medical data: {{query}}',
      variables: { query },
      optimizationScore: 0.8,
      estimatedTokens: 100,
      version: '1.0'
    };
  }

  private calculatePriority(query: string, documentIds: string[]): number {
    // Higher priority for urgent keywords
    const urgentKeywords = ['urgent', 'emergency', 'critical', 'abnormal', 'severe'];
    const hasUrgent = urgentKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );

    return hasUrgent ? 10 : 5;
  }

  private addToQueue(taskId: string): void {
    this.processingQueue.push(taskId);
    // Sort by priority
    this.processingQueue.sort((a, b) => {
      const taskA = this.tasks.get(a);
      const taskB = this.tasks.get(b);
      return (taskB?.priority || 0) - (taskA?.priority || 0);
    });
  }

  private estimateStorageUsed(): number {
    // Rough estimate in bytes
    return this.tasks.size * 10000; // ~10KB per task
  }

  private async calculateAverageResponseTime(): Promise<number> {
    const completedTasks = await this.getTasksByStatus('completed');
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      if (task.result) {
        return sum + task.result.processingTime;
      }
      return sum;
    }, 0);

    return totalTime / completedTasks.length;
  }
}

export const aiAnalysisRepository = new AIAnalysisRepository();