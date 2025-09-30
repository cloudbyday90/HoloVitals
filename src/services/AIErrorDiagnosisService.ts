/**
 * AI Error Diagnosis Service
 * 
 * Uses AI to analyze errors, detect patterns, identify root causes, and suggest fixes.
 * Provides automated diagnosis and recovery recommendations.
 */

import { PrismaClient, ErrorEvent, ErrorSeverity, ErrorCategory, ErrorDiagnosis, ErrorPattern } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ErrorEventData {
  severity: ErrorSeverity;
  category: ErrorCategory;
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  service: string;
  environment: string;
  endpoint?: string;
  userId?: string;
  metadata?: any;
}

interface DiagnosisResult {
  rootCause: string;
  rootCauseCategory: string;
  affectedComponents: string[];
  suggestedFixes: SuggestedFix[];
  confidence: number;
  similarIncidents: string[];
  kbArticles: string[];
}

interface SuggestedFix {
  action: string;
  description: string;
  priority: number;
  estimatedTime: number; // minutes
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  commands?: string[];
  rollbackProcedure?: string;
}

interface PatternAnalysis {
  isRecurring: boolean;
  frequency: string;
  pattern: ErrorPattern | null;
  relatedErrors: string[];
}

export class AIErrorDiagnosisService {
  /**
   * Report and diagnose an error
   */
  async reportAndDiagnoseError(data: ErrorEventData): Promise<{ error: ErrorEvent; diagnosis: ErrorDiagnosis }> {
    // Create error event
    const errorEvent = await this.createErrorEvent(data);

    // Perform AI diagnosis
    const diagnosis = await this.diagnoseError(errorEvent.id);

    // Check for patterns
    await this.analyzeErrorPatterns(errorEvent.id);

    return { error: errorEvent, diagnosis };
  }

  /**
   * Create error event
   */
  async createErrorEvent(data: ErrorEventData): Promise<ErrorEvent> {
    // Check if similar error exists
    const existingError = await this.findSimilarError(data);

    if (existingError) {
      // Update existing error occurrence count
      return await prisma.errorEvent.update({
        where: { id: existingError.id },
        data: {
          occurrenceCount: existingError.occurrenceCount + 1,
          lastOccurrence: new Date(),
        },
      });
    }

    // Create new error event
    return await prisma.errorEvent.create({
      data: {
        severity: data.severity,
        category: data.category,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        stackTrace: data.stackTrace,
        service: data.service,
        environment: data.environment,
        endpoint: data.endpoint,
        userId: data.userId,
        detectedBy: 'SYSTEM',
        metadata: data.metadata,
        diagnosisStatus: 'PENDING',
      },
    });
  }

  /**
   * Diagnose error using AI
   */
  async diagnoseError(errorEventId: string): Promise<ErrorDiagnosis> {
    const errorEvent = await prisma.errorEvent.findUnique({
      where: { id: errorEventId },
    });

    if (!errorEvent) {
      throw new Error('Error event not found');
    }

    // Update diagnosis status
    await prisma.errorEvent.update({
      where: { id: errorEventId },
      data: { diagnosisStatus: 'IN_PROGRESS' },
    });

    try {
      // Get similar historical incidents
      const similarIncidents = await this.findSimilarIncidents(errorEvent);

      // Get relevant KB articles
      const kbArticles = await this.findRelevantKBArticles(errorEvent);

      // Perform AI analysis
      const aiAnalysis = await this.performAIAnalysis(errorEvent, similarIncidents, kbArticles);

      // Create diagnosis record
      const diagnosis = await prisma.errorDiagnosis.create({
        data: {
          errorEventId,
          aiModel: 'gpt-4',
          modelVersion: '2024-01',
          confidence: aiAnalysis.confidence,
          rootCause: aiAnalysis.rootCause,
          rootCauseCategory: aiAnalysis.rootCauseCategory,
          affectedComponents: aiAnalysis.affectedComponents,
          suggestedFixes: aiAnalysis.suggestedFixes,
          recommendedFix: aiAnalysis.suggestedFixes[0]?.action,
          similarIncidents: similarIncidents.map(i => i.id),
          kbArticles: kbArticles.map(kb => kb.id),
        },
      });

      // Update error event
      await prisma.errorEvent.update({
        where: { id: errorEventId },
        data: {
          diagnosisStatus: 'COMPLETED',
          rootCause: aiAnalysis.rootCause,
          rootCauseService: aiAnalysis.affectedComponents[0],
          diagnosisConfidence: aiAnalysis.confidence,
        },
      });

      return diagnosis;
    } catch (error: any) {
      // Mark diagnosis as failed
      await prisma.errorEvent.update({
        where: { id: errorEventId },
        data: { diagnosisStatus: 'PENDING' },
      });

      throw new Error(`Diagnosis failed: ${error.message}`);
    }
  }

  /**
   * Perform AI analysis using OpenAI
   */
  private async performAIAnalysis(
    errorEvent: ErrorEvent,
    similarIncidents: any[],
    kbArticles: any[]
  ): Promise<DiagnosisResult> {
    const prompt = this.buildDiagnosisPrompt(errorEvent, similarIncidents, kbArticles);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert system administrator and DevOps engineer specializing in diagnosing and resolving system errors. 
          Analyze the error information provided and provide a detailed diagnosis with actionable solutions.
          Return your response in JSON format with the following structure:
          {
            "rootCause": "detailed explanation of the root cause",
            "rootCauseCategory": "category of the root cause",
            "affectedComponents": ["list", "of", "affected", "components"],
            "confidence": 0.95,
            "suggestedFixes": [
              {
                "action": "brief action description",
                "description": "detailed description",
                "priority": 1,
                "estimatedTime": 10,
                "risk": "LOW",
                "commands": ["command1", "command2"],
                "rollbackProcedure": "how to rollback if needed"
              }
            ]
          }`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    return {
      rootCause: analysis.rootCause,
      rootCauseCategory: analysis.rootCauseCategory,
      affectedComponents: analysis.affectedComponents,
      suggestedFixes: analysis.suggestedFixes,
      confidence: analysis.confidence,
      similarIncidents: similarIncidents.map(i => i.id),
      kbArticles: kbArticles.map(kb => kb.id),
    };
  }

  /**
   * Build diagnosis prompt for AI
   */
  private buildDiagnosisPrompt(
    errorEvent: ErrorEvent,
    similarIncidents: any[],
    kbArticles: any[]
  ): string {
    let prompt = `Analyze the following error and provide a diagnosis:\n\n`;
    
    prompt += `ERROR DETAILS:\n`;
    prompt += `- Severity: ${errorEvent.severity}\n`;
    prompt += `- Category: ${errorEvent.category}\n`;
    prompt += `- Service: ${errorEvent.service}\n`;
    prompt += `- Environment: ${errorEvent.environment}\n`;
    prompt += `- Error Message: ${errorEvent.errorMessage}\n`;
    
    if (errorEvent.errorCode) {
      prompt += `- Error Code: ${errorEvent.errorCode}\n`;
    }
    
    if (errorEvent.endpoint) {
      prompt += `- Endpoint: ${errorEvent.endpoint}\n`;
    }
    
    if (errorEvent.stackTrace) {
      prompt += `\nSTACK TRACE:\n${errorEvent.stackTrace}\n`;
    }
    
    if (similarIncidents.length > 0) {
      prompt += `\nSIMILAR PAST INCIDENTS:\n`;
      similarIncidents.forEach((incident, index) => {
        prompt += `${index + 1}. ${incident.title}\n`;
        prompt += `   Resolution: ${incident.resolutionSummary || 'N/A'}\n`;
      });
    }
    
    if (kbArticles.length > 0) {
      prompt += `\nRELEVANT KNOWLEDGE BASE ARTICLES:\n`;
      kbArticles.forEach((article, index) => {
        prompt += `${index + 1}. ${article.title}\n`;
        prompt += `   Resolution: ${article.resolution}\n`;
      });
    }
    
    prompt += `\nProvide a comprehensive diagnosis with actionable solutions.`;
    
    return prompt;
  }

  /**
   * Analyze error patterns
   */
  async analyzeErrorPatterns(errorEventId: string): Promise<PatternAnalysis> {
    const errorEvent = await prisma.errorEvent.findUnique({
      where: { id: errorEventId },
    });

    if (!errorEvent) {
      throw new Error('Error event not found');
    }

    // Find similar errors in the last 24 hours
    const recentSimilarErrors = await prisma.errorEvent.findMany({
      where: {
        category: errorEvent.category,
        service: errorEvent.service,
        detectedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const isRecurring = recentSimilarErrors.length > 3;

    if (isRecurring) {
      // Check if pattern already exists
      let pattern = await prisma.errorPattern.findFirst({
        where: {
          errorCategory: errorEvent.category,
          services: { has: errorEvent.service },
        },
      });

      if (pattern) {
        // Update existing pattern
        pattern = await prisma.errorPattern.update({
          where: { id: pattern.id },
          data: {
            lastDetected: new Date(),
            occurrences: pattern.occurrences + 1,
          },
        });
      } else {
        // Create new pattern
        pattern = await prisma.errorPattern.create({
          data: {
            patternName: `Recurring ${errorEvent.category} in ${errorEvent.service}`,
            patternType: 'RECURRING',
            description: `Pattern detected: ${errorEvent.errorMessage}`,
            errorCategory: errorEvent.category,
            services: [errorEvent.service],
            frequency: 'HOURLY',
            severity: errorEvent.severity,
          },
        });
      }

      return {
        isRecurring: true,
        frequency: 'HOURLY',
        pattern,
        relatedErrors: recentSimilarErrors.map(e => e.id),
      };
    }

    return {
      isRecurring: false,
      frequency: 'NONE',
      pattern: null,
      relatedErrors: [],
    };
  }

  /**
   * Get error diagnosis
   */
  async getErrorDiagnosis(errorEventId: string): Promise<ErrorDiagnosis | null> {
    return await prisma.errorDiagnosis.findUnique({
      where: { errorEventId },
    });
  }

  /**
   * Validate diagnosis (after resolution)
   */
  async validateDiagnosis(diagnosisId: string, wasCorrect: boolean, actualRootCause?: string): Promise<void> {
    await prisma.errorDiagnosis.update({
      where: { id: diagnosisId },
      data: {
        diagnosisCorrect: wasCorrect,
        actualRootCause,
        validatedAt: new Date(),
      },
    });

    // Update KB if diagnosis was correct
    if (wasCorrect) {
      const diagnosis = await prisma.errorDiagnosis.findUnique({
        where: { id: diagnosisId },
        include: { errorEvent: true },
      });

      if (diagnosis) {
        await this.updateKnowledgeBase(diagnosis);
      }
    }
  }

  /**
   * Create or update knowledge base article
   */
  async updateKnowledgeBase(diagnosis: any): Promise<void> {
    const errorEvent = diagnosis.errorEvent;

    // Check if KB article exists
    const existingArticle = await prisma.errorKnowledgeBase.findFirst({
      where: {
        category: errorEvent.category,
        errorCode: errorEvent.errorCode,
      },
    });

    if (existingArticle) {
      // Update existing article
      await prisma.errorKnowledgeBase.update({
        where: { id: existingArticle.id },
        data: {
          timesReferenced: existingArticle.timesReferenced + 1,
          lastUsed: new Date(),
        },
      });
    } else {
      // Create new article
      await prisma.errorKnowledgeBase.create({
        data: {
          title: `${errorEvent.category}: ${errorEvent.errorMessage.substring(0, 100)}`,
          category: errorEvent.category,
          errorCode: errorEvent.errorCode,
          description: errorEvent.errorMessage,
          symptoms: errorEvent.errorMessage,
          rootCause: diagnosis.rootCause,
          resolution: JSON.stringify(diagnosis.suggestedFixes),
          severity: errorEvent.severity,
          affectedServices: [errorEvent.service],
          tags: [errorEvent.category, errorEvent.service],
          createdBy: 'SYSTEM',
          verified: true,
          verifiedBy: 'AI_DIAGNOSIS',
          verifiedAt: new Date(),
        },
      });
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStatistics(): Promise<any> {
    const [
      totalErrors,
      criticalErrors,
      unresolvedErrors,
      errorsBySeverity,
      errorsByCategory,
      errorsByService,
      averageDiagnosisTime,
      averageResolutionTime,
      diagnosisAccuracy,
    ] = await Promise.all([
      prisma.errorEvent.count(),
      prisma.errorEvent.count({ where: { severity: ErrorSeverity.CRITICAL } }),
      prisma.errorEvent.count({ where: { resolved: false } }),
      this.getErrorCountBySeverity(),
      this.getErrorCountByCategory(),
      this.getErrorCountByService(),
      this.calculateAverageDiagnosisTime(),
      this.calculateAverageResolutionTime(),
      this.calculateDiagnosisAccuracy(),
    ]);

    return {
      total: totalErrors,
      critical: criticalErrors,
      unresolved: unresolvedErrors,
      bySeverity: errorsBySeverity,
      byCategory: errorsByCategory,
      byService: errorsByService,
      averageDiagnosisTime,
      averageResolutionTime,
      diagnosisAccuracy,
    };
  }

  /**
   * Get active error patterns
   */
  async getActivePatterns(): Promise<ErrorPattern[]> {
    return await prisma.errorPattern.findMany({
      where: {
        lastDetected: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        occurrences: 'desc',
      },
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async findSimilarError(data: ErrorEventData): Promise<ErrorEvent | null> {
    return await prisma.errorEvent.findFirst({
      where: {
        errorMessage: data.errorMessage,
        service: data.service,
        environment: data.environment,
        resolved: false,
        detectedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });
  }

  private async findSimilarIncidents(errorEvent: ErrorEvent): Promise<any[]> {
    // TODO: Implement similarity search
    // This would use vector embeddings or text similarity
    return [];
  }

  private async findRelevantKBArticles(errorEvent: ErrorEvent): Promise<any[]> {
    return await prisma.errorKnowledgeBase.findMany({
      where: {
        category: errorEvent.category,
        affectedServices: { has: errorEvent.service },
      },
      orderBy: {
        timesReferenced: 'desc',
      },
      take: 3,
    });
  }

  private async getErrorCountBySeverity(): Promise<any> {
    const counts = await prisma.errorEvent.groupBy({
      by: ['severity'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.severity] = curr._count;
      return acc;
    }, {} as any);
  }

  private async getErrorCountByCategory(): Promise<any> {
    const counts = await prisma.errorEvent.groupBy({
      by: ['category'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.category] = curr._count;
      return acc;
    }, {} as any);
  }

  private async getErrorCountByService(): Promise<any> {
    const counts = await prisma.errorEvent.groupBy({
      by: ['service'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.service] = curr._count;
      return acc;
    }, {} as any);
  }

  private async calculateAverageDiagnosisTime(): Promise<number> {
    const diagnoses = await prisma.errorDiagnosis.findMany({
      include: {
        errorEvent: true,
      },
    });

    if (diagnoses.length === 0) return 0;

    const totalTime = diagnoses.reduce((sum, diagnosis) => {
      const diagnosisTime = diagnosis.diagnosedAt.getTime() - diagnosis.errorEvent.detectedAt.getTime();
      return sum + diagnosisTime;
    }, 0);

    // Return average in seconds
    return Math.round(totalTime / diagnoses.length / 1000);
  }

  private async calculateAverageResolutionTime(): Promise<number> {
    const resolvedErrors = await prisma.errorEvent.findMany({
      where: {
        resolved: true,
        resolvedAt: { not: null },
      },
    });

    if (resolvedErrors.length === 0) return 0;

    const totalTime = resolvedErrors.reduce((sum, error) => {
      const resolutionTime = error.resolvedAt!.getTime() - error.detectedAt.getTime();
      return sum + resolutionTime;
    }, 0);

    // Return average in minutes
    return Math.round(totalTime / resolvedErrors.length / (1000 * 60));
  }

  private async calculateDiagnosisAccuracy(): Promise<number> {
    const validatedDiagnoses = await prisma.errorDiagnosis.findMany({
      where: {
        diagnosisCorrect: { not: null },
      },
    });

    if (validatedDiagnoses.length === 0) return 0;

    const correctDiagnoses = validatedDiagnoses.filter(d => d.diagnosisCorrect).length;

    return Math.round((correctDiagnoses / validatedDiagnoses.length) * 100);
  }
}

export default AIErrorDiagnosisService;