/**
 * Repository Coordinator
 * 
 * Coordinates the three core repositories:
 * 1. AI Analysis Repository - Active analysis tasks
 * 2. AI Prompt Optimization Repository - Optimized prompts
 * 3. AI Context Cache Repository - HIPAA-compliant context
 * 
 * This coordinator ensures proper data flow and synchronization between repositories.
 */

import { aiAnalysisRepository, AnalysisTask, AnalysisResult } from './AIAnalysisRepository';
import { aiPromptOptimizationRepository, PromptTemplate } from './AIPromptOptimizationRepository';
import { aiContextCacheRepository, ContextEntry } from './AIContextCacheRepository';
import { HIPAASanitizer } from '../utils/hipaa/sanitizer';

export interface AnalysisRequest {
  patientId: string;
  documentIds: string[];
  query: string;
  analysisType?: string;
  priority?: number;
}

export interface AnalysisResponse {
  taskId: string;
  status: string;
  result?: AnalysisResult;
  missingPieces?: any[];
  contextUsed: ContextSummary;
  promptUsed: PromptSummary;
}

export interface ContextSummary {
  entriesUsed: number;
  types: string[];
  averageImportance: number;
  sanitizationCompliant: boolean;
}

export interface PromptSummary {
  templateId: string;
  templateName: string;
  tokensEstimated: number;
  optimizationScore: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  repositories: {
    analysis: any;
    promptOptimization: any;
    contextCache: any;
  };
  timestamp: Date;
}

export class RepositoryCoordinator {
  private static instance: RepositoryCoordinator;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): RepositoryCoordinator {
    if (!RepositoryCoordinator.instance) {
      RepositoryCoordinator.instance = new RepositoryCoordinator();
    }
    return RepositoryCoordinator.instance;
  }

  /**
   * Initialize all repositories
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[RepositoryCoordinator] Already initialized');
      return;
    }

    console.log('[RepositoryCoordinator] Initializing all repositories...');

    try {
      await Promise.all([
        aiAnalysisRepository.initialize(),
        aiPromptOptimizationRepository.initialize(),
        aiContextCacheRepository.initialize()
      ]);

      this.initialized = true;
      console.log('[RepositoryCoordinator] All repositories initialized successfully');
    } catch (error) {
      console.error('[RepositoryCoordinator] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Submit a new analysis request
   * This orchestrates all three repositories
   */
  async submitAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    await this.ensureInitialized();

    console.log(`[RepositoryCoordinator] Processing analysis request for patient ${request.patientId}`);

    // Step 1: Get relevant context from Context Cache Repository
    const context = await this.gatherContext(request);
    
    // Step 2: Get optimized prompt from Prompt Optimization Repository
    const prompt = await this.getOptimizedPrompt(request, context);
    
    // Step 3: Create analysis task in Analysis Repository
    const task = await aiAnalysisRepository.createTask(
      request.patientId,
      request.documentIds,
      request.query
    );

    // Step 4: Update task with context and prompt
    await aiAnalysisRepository.update(task.id, {
      context: {
        relevantDocuments: context.map(c => c.id),
        historicalData: context.filter(c => c.type === 'test_results').map(c => c.data),
        relatedFindings: context.filter(c => c.type === 'trends').map(c => c.data),
        temporalContext: {
          dateRange: this.calculateDateRange(context),
          documentCount: request.documentIds.length
        },
        medicalContext: this.extractMedicalContext(context)
      },
      prompt: {
        id: prompt.id,
        template: prompt.template,
        variables: this.buildPromptVariables(request, context),
        optimizationScore: prompt.optimizationMetrics.overallScore,
        estimatedTokens: prompt.optimizationMetrics.averageTokenCount,
        version: prompt.version
      }
    });

    return {
      taskId: task.id,
      status: task.status,
      missingPieces: task.missingPieces,
      contextUsed: {
        entriesUsed: context.length,
        types: [...new Set(context.map(c => c.type))],
        averageImportance: context.reduce((sum, c) => sum + c.importance, 0) / context.length,
        sanitizationCompliant: context.every(c => 
          HIPAASanitizer.validate(c.data).isValid
        )
      },
      promptUsed: {
        templateId: prompt.id,
        templateName: prompt.name,
        tokensEstimated: prompt.optimizationMetrics.averageTokenCount,
        optimizationScore: prompt.optimizationMetrics.overallScore
      }
    };
  }

  /**
   * Execute analysis task
   */
  async executeAnalysis(taskId: string): Promise<AnalysisResult> {
    await this.ensureInitialized();

    const task = await aiAnalysisRepository.retrieve(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    console.log(`[RepositoryCoordinator] Executing analysis task ${taskId}`);

    try {
      // Process the task
      await aiAnalysisRepository.processNextTask();

      // Simulate AI analysis (in production, this calls OpenAI)
      const result = await this.performAIAnalysis(task);

      // Record prompt performance
      await aiPromptOptimizationRepository.recordPerformance(
        task.prompt.id,
        {
          timestamp: new Date(),
          tokensUsed: result.tokensUsed,
          responseTime: result.processingTime,
          success: true
        }
      );

      // Complete the task
      await aiAnalysisRepository.completeTask(taskId, result);

      // Update context cache with new insights
      await this.updateContextWithResults(task.patientId, result);

      return result;
    } catch (error) {
      console.error(`[RepositoryCoordinator] Analysis failed:`, error);
      await aiAnalysisRepository.failTask(taskId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Add new patient data to context cache
   */
  async addPatientData(
    patientId: string,
    documentId: string,
    extractedData: any,
    documentType: string
  ): Promise<void> {
    await this.ensureInitialized();

    console.log(`[RepositoryCoordinator] Adding patient data to context cache`);

    // Determine context type from document type
    const contextType = this.mapDocumentTypeToContextType(documentType);

    // Add to context cache (will be automatically sanitized)
    await aiContextCacheRepository.addPatientContext(
      patientId,
      contextType,
      extractedData,
      {
        source: documentId,
        documentIds: [documentId],
        tags: [documentType, 'extracted']
      }
    );

    // Trigger context reanalysis
    await aiContextCacheRepository.reanalyzeImportance();
  }

  /**
   * Get system health across all repositories
   */
  async getSystemHealth(): Promise<SystemHealth> {
    await this.ensureInitialized();

    const [analysisHealth, promptHealth, cacheHealth] = await Promise.all([
      aiAnalysisRepository.getHealth(),
      aiPromptOptimizationRepository.getHealth(),
      aiContextCacheRepository.getHealth()
    ]);

    const statuses = [analysisHealth.status, promptHealth.status, cacheHealth.status];
    const overall = statuses.includes('unhealthy') ? 'unhealthy' :
                   statuses.includes('degraded') ? 'degraded' : 'healthy';

    return {
      overall,
      repositories: {
        analysis: analysisHealth,
        promptOptimization: promptHealth,
        contextCache: cacheHealth
      },
      timestamp: new Date()
    };
  }

  /**
   * Get analysis status
   */
  async getAnalysisStatus(taskId: string): Promise<AnalysisResponse> {
    await this.ensureInitialized();

    const task = await aiAnalysisRepository.retrieve(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    return {
      taskId: task.id,
      status: task.status,
      result: task.result,
      missingPieces: task.missingPieces,
      contextUsed: {
        entriesUsed: task.context.relevantDocuments.length,
        types: Object.keys(task.context.medicalContext),
        averageImportance: 0,
        sanitizationCompliant: true
      },
      promptUsed: {
        templateId: task.prompt.id,
        templateName: 'Analysis Prompt',
        tokensEstimated: task.prompt.estimatedTokens,
        optimizationScore: task.prompt.optimizationScore
      }
    };
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async gatherContext(request: AnalysisRequest): Promise<ContextEntry[]> {
    // Get relevant context from cache
    const context = await aiContextCacheRepository.getContextForAnalysis(
      request.patientId,
      request.analysisType || 'general',
      20 // Max 20 context entries
    );

    console.log(`[RepositoryCoordinator] Gathered ${context.length} context entries`);
    return context;
  }

  private async getOptimizedPrompt(
    request: AnalysisRequest,
    context: ContextEntry[]
  ): Promise<PromptTemplate> {
    // Determine prompt category
    const category = this.determinePromptCategory(request.query, request.analysisType);

    // Get best prompt for category
    const prompt = await aiPromptOptimizationRepository.getBestPrompt(category);

    if (!prompt) {
      throw new Error(`No prompt template found for category: ${category}`);
    }

    console.log(`[RepositoryCoordinator] Using prompt template: ${prompt.name}`);
    return prompt;
  }

  private determinePromptCategory(query: string, analysisType?: string): any {
    const queryLower = query.toLowerCase();

    if (analysisType === 'trend' || queryLower.includes('trend') || queryLower.includes('over time')) {
      return 'trend_analysis';
    }
    if (queryLower.includes('abnormal') || queryLower.includes('unusual')) {
      return 'anomaly_detection';
    }
    if (queryLower.includes('summarize') || queryLower.includes('summary')) {
      return 'summarization';
    }
    if (queryLower.includes('compare') || queryLower.includes('difference')) {
      return 'comparison';
    }
    if (queryLower.includes('risk') || queryLower.includes('danger')) {
      return 'risk_assessment';
    }

    return 'document_analysis';
  }

  private buildPromptVariables(request: AnalysisRequest, context: ContextEntry[]): Record<string, any> {
    return {
      query: request.query,
      documentIds: request.documentIds,
      contextData: context.map(c => ({
        type: c.type,
        data: c.data,
        importance: c.importance
      })),
      patientContext: this.extractMedicalContext(context)
    };
  }

  private calculateDateRange(context: ContextEntry[]): { start: Date; end: Date } {
    const dates = context.map(c => c.timestamp);
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  private extractMedicalContext(context: ContextEntry[]): any {
    const conditions = context
      .filter(c => c.type === 'conditions')
      .flatMap(c => c.data.conditions || []);

    const medications = context
      .filter(c => c.type === 'medications')
      .flatMap(c => c.data.medications || []);

    const allergies = context
      .filter(c => c.type === 'allergies')
      .flatMap(c => c.data.allergies || []);

    return { conditions, medications, allergies };
  }

  private async performAIAnalysis(task: AnalysisTask): Promise<AnalysisResult> {
    // This is a placeholder - in production, this would call OpenAI API
    const startTime = Date.now();

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      answer: `Analysis complete for query: "${task.query}". Based on the provided context and documents, here are the findings...`,
      confidence: 0.85,
      sources: task.documentIds,
      insights: [
        {
          type: 'trend',
          description: 'Sample insight from analysis',
          severity: 'medium',
          evidence: ['Document 1', 'Document 2'],
          confidence: 0.8
        }
      ],
      recommendations: [
        'Follow up with healthcare provider',
        'Monitor specific values'
      ],
      flags: [],
      tokensUsed: task.prompt.estimatedTokens,
      processingTime: Date.now() - startTime
    };
  }

  private async updateContextWithResults(patientId: string, result: AnalysisResult): Promise<void> {
    // Add insights to context cache
    if (result.insights.length > 0) {
      await aiContextCacheRepository.addPatientContext(
        patientId,
        'trends',
        { insights: result.insights },
        {
          source: 'ai_analysis',
          documentIds: result.sources,
          tags: ['ai_generated', 'insights']
        }
      );
    }
  }

  private mapDocumentTypeToContextType(documentType: string): any {
    const mapping: Record<string, any> = {
      'bloodwork': 'test_results',
      'imaging': 'imaging_results',
      'prescription': 'medications',
      'aftercare': 'clinical_notes',
      'discharge': 'clinical_notes'
    };

    return mapping[documentType] || 'medical_history';
  }
}

export const repositoryCoordinator = RepositoryCoordinator.getInstance();