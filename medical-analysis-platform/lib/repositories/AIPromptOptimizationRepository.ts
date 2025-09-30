/**
 * AI Prompt Optimization Repository
 * 
 * This repository optimizes current and future prompts for the AI Analysis Repository.
 * It ensures prompts are:
 * - Relevant and accurate
 * - Cost-efficient (token optimization)
 * - Performance-optimized
 * - Contextually appropriate
 */

import { IRepository, RepositoryHealth } from './interfaces/IRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  template: string;
  variables: PromptVariable[];
  version: string;
  optimizationMetrics: OptimizationMetrics;
  performanceHistory: PerformanceRecord[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export type PromptCategory = 
  | 'document_analysis'
  | 'trend_analysis'
  | 'anomaly_detection'
  | 'summarization'
  | 'comparison'
  | 'recommendation'
  | 'risk_assessment';

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ValidationRule;
}

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface OptimizationMetrics {
  averageTokenCount: number;
  averageResponseTime: number;
  successRate: number;
  costPerExecution: number;
  relevanceScore: number;
  clarityScore: number;
  efficiencyScore: number;
  overallScore: number;
}

export interface PerformanceRecord {
  timestamp: Date;
  tokensUsed: number;
  responseTime: number;
  success: boolean;
  userFeedback?: number; // 1-5 rating
  errorMessage?: string;
}

export interface OptimizationRequest {
  promptId: string;
  context: string;
  targetMetrics: {
    maxTokens?: number;
    maxResponseTime?: number;
    minRelevanceScore?: number;
  };
  constraints?: string[];
}

export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: Improvement[];
  estimatedSavings: {
    tokens: number;
    cost: number;
    time: number;
  };
  confidence: number;
}

export interface Improvement {
  type: 'token_reduction' | 'clarity' | 'specificity' | 'structure' | 'context';
  description: string;
  impact: 'high' | 'medium' | 'low';
  before: string;
  after: string;
}

export class AIPromptOptimizationRepository implements IRepository<PromptTemplate> {
  readonly name = 'AIPromptOptimizationRepository';
  readonly version = '1.0.0';
  
  private templates: Map<string, PromptTemplate> = new Map();
  private optimizationCache: Map<string, OptimizationResult> = new Map();

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    
    // Load default prompt templates
    await this.loadDefaultTemplates();
    
    console.log(`[${this.name}] Loaded ${this.templates.size} prompt templates`);
  }

  /**
   * Store prompt template
   */
  async store(key: string, data: PromptTemplate): Promise<void> {
    this.templates.set(key, data);
  }

  /**
   * Retrieve prompt template
   */
  async retrieve(key: string): Promise<PromptTemplate | null> {
    return this.templates.get(key) || null;
  }

  /**
   * Update prompt template
   */
  async update(key: string, data: Partial<PromptTemplate>): Promise<void> {
    const existing = await this.retrieve(key);
    if (!existing) {
      throw new Error(`Template ${key} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    await this.store(key, updated);
  }

  /**
   * Delete prompt template
   */
  async delete(key: string): Promise<void> {
    this.templates.delete(key);
  }

  /**
   * Check if template exists
   */
  async exists(key: string): Promise<boolean> {
    return this.templates.has(key);
  }

  /**
   * Clear all templates
   */
  async clear(): Promise<void> {
    this.templates.clear();
    this.optimizationCache.clear();
  }

  /**
   * Get repository health
   */
  async getHealth(): Promise<RepositoryHealth> {
    const templateCount = this.templates.size;
    const activeTemplates = Array.from(this.templates.values()).filter(t => t.isActive).length;
    
    const avgOptimizationScore = this.calculateAverageOptimizationScore();
    
    const issues: string[] = [];
    if (activeTemplates === 0) {
      issues.push('No active templates available');
    }
    if (avgOptimizationScore < 0.7) {
      issues.push(`Low average optimization score: ${avgOptimizationScore.toFixed(2)}`);
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'degraded',
      lastCheck: new Date(),
      metrics: {
        itemCount: templateCount,
        storageUsed: this.estimateStorageUsed(),
        averageResponseTime: 0
      },
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Optimize a prompt for specific use case
   */
  async optimizePrompt(request: OptimizationRequest): Promise<OptimizationResult> {
    const template = await this.retrieve(request.promptId);
    if (!template) {
      throw new Error(`Template ${request.promptId} not found`);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = this.optimizationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform optimization
    const result = await this.performOptimization(template, request);
    
    // Cache result
    this.optimizationCache.set(cacheKey, result);
    
    // Update template metrics
    await this.updateTemplateMetrics(request.promptId, result);

    return result;
  }

  /**
   * Get best prompt for a category
   */
  async getBestPrompt(category: PromptCategory): Promise<PromptTemplate | null> {
    const categoryTemplates = Array.from(this.templates.values())
      .filter(t => t.category === category && t.isActive);

    if (categoryTemplates.length === 0) {
      return null;
    }

    // Sort by overall optimization score
    categoryTemplates.sort((a, b) => 
      b.optimizationMetrics.overallScore - a.optimizationMetrics.overallScore
    );

    return categoryTemplates[0];
  }

  /**
   * Create new prompt template
   */
  async createTemplate(
    name: string,
    category: PromptCategory,
    template: string,
    variables: PromptVariable[]
  ): Promise<PromptTemplate> {
    const id = this.generateTemplateId();
    
    const newTemplate: PromptTemplate = {
      id,
      name,
      category,
      template,
      variables,
      version: '1.0.0',
      optimizationMetrics: this.getDefaultMetrics(),
      performanceHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    await this.store(id, newTemplate);
    return newTemplate;
  }

  /**
   * Record performance of a prompt execution
   */
  async recordPerformance(
    promptId: string,
    record: PerformanceRecord
  ): Promise<void> {
    const template = await this.retrieve(promptId);
    if (!template) return;

    template.performanceHistory.push(record);
    
    // Keep only last 100 records
    if (template.performanceHistory.length > 100) {
      template.performanceHistory = template.performanceHistory.slice(-100);
    }

    // Recalculate metrics
    template.optimizationMetrics = this.calculateMetrics(template.performanceHistory);
    
    await this.store(promptId, template);
  }

  /**
   * Analyze prompt efficiency
   */
  async analyzeEfficiency(promptId: string): Promise<EfficiencyAnalysis> {
    const template = await this.retrieve(promptId);
    if (!template) {
      throw new Error(`Template ${promptId} not found`);
    }

    const history = template.performanceHistory;
    if (history.length === 0) {
      return {
        status: 'insufficient_data',
        recommendations: ['Execute prompt multiple times to gather performance data']
      };
    }

    const recommendations: string[] = [];
    const issues: string[] = [];

    // Analyze token usage
    const avgTokens = template.optimizationMetrics.averageTokenCount;
    if (avgTokens > 2000) {
      issues.push('High token usage detected');
      recommendations.push('Consider breaking down the prompt into smaller, focused queries');
    }

    // Analyze response time
    const avgResponseTime = template.optimizationMetrics.averageResponseTime;
    if (avgResponseTime > 5000) {
      issues.push('Slow response time detected');
      recommendations.push('Optimize prompt length and complexity');
    }

    // Analyze success rate
    const successRate = template.optimizationMetrics.successRate;
    if (successRate < 0.9) {
      issues.push('Low success rate detected');
      recommendations.push('Review prompt clarity and variable validation');
    }

    return {
      status: issues.length === 0 ? 'optimal' : issues.length < 3 ? 'needs_improvement' : 'poor',
      metrics: template.optimizationMetrics,
      issues,
      recommendations,
      comparisonToAverage: this.compareToAverage(template)
    };
  }

  /**
   * Get prompt suggestions for a query
   */
  async suggestPrompts(query: string, category?: PromptCategory): Promise<PromptTemplate[]> {
    let candidates = Array.from(this.templates.values()).filter(t => t.isActive);

    if (category) {
      candidates = candidates.filter(t => t.category === category);
    }

    // Score each template based on relevance to query
    const scored = candidates.map(template => ({
      template,
      score: this.calculateRelevanceScore(template, query)
    }));

    // Sort by score and return top 3
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.template);
  }

  // Private helper methods

  private async loadDefaultTemplates(): Promise<void> {
    // Document Analysis Template
    await this.createTemplate(
      'Standard Document Analysis',
      'document_analysis',
      `Analyze the following medical document and provide:
1. Key findings and important information
2. Any abnormal values or concerning results
3. Relevant context from patient history
4. Recommendations for follow-up

Document Type: {{documentType}}
Document Date: {{documentDate}}
Extracted Data: {{extractedData}}
Patient Context: {{patientContext}}

Provide a comprehensive analysis focusing on medical accuracy and actionable insights.`,
      [
        { name: 'documentType', type: 'string', required: true, description: 'Type of medical document' },
        { name: 'documentDate', type: 'string', required: true, description: 'Date of the document' },
        { name: 'extractedData', type: 'string', required: true, description: 'Extracted data from OCR' },
        { name: 'patientContext', type: 'string', required: false, description: 'Relevant patient history' }
      ]
    );

    // Trend Analysis Template
    await this.createTemplate(
      'Trend Analysis',
      'trend_analysis',
      `Analyze trends in the following medical data over time:

{{dataPoints}}

Identify:
1. Significant changes or patterns
2. Values moving toward or away from normal ranges
3. Potential concerns or improvements
4. Recommendations for monitoring

Focus on clinically significant trends and provide clear explanations.`,
      [
        { name: 'dataPoints', type: 'array', required: true, description: 'Time-series data points' }
      ]
    );

    // Anomaly Detection Template
    await this.createTemplate(
      'Anomaly Detection',
      'anomaly_detection',
      `Review the following medical data for anomalies:

Current Results: {{currentResults}}
Reference Ranges: {{referenceRanges}}
Historical Data: {{historicalData}}

Identify:
1. Values outside normal ranges
2. Unexpected changes from baseline
3. Potential data quality issues
4. Clinical significance of anomalies

Prioritize findings by severity and clinical importance.`,
      [
        { name: 'currentResults', type: 'object', required: true, description: 'Current test results' },
        { name: 'referenceRanges', type: 'object', required: true, description: 'Normal reference ranges' },
        { name: 'historicalData', type: 'array', required: false, description: 'Previous results for comparison' }
      ]
    );
  }

  private async performOptimization(
    template: PromptTemplate,
    request: OptimizationRequest
  ): Promise<OptimizationResult> {
    const improvements: Improvement[] = [];
    let optimizedPrompt = template.template;

    // Token reduction optimization
    const tokenReduction = this.optimizeForTokens(optimizedPrompt);
    if (tokenReduction.improved) {
      improvements.push({
        type: 'token_reduction',
        description: 'Reduced unnecessary verbosity while maintaining clarity',
        impact: 'high',
        before: optimizedPrompt,
        after: tokenReduction.result
      });
      optimizedPrompt = tokenReduction.result;
    }

    // Clarity optimization
    const clarityImprovement = this.optimizeForClarity(optimizedPrompt);
    if (clarityImprovement.improved) {
      improvements.push({
        type: 'clarity',
        description: 'Improved instruction clarity and specificity',
        impact: 'medium',
        before: optimizedPrompt,
        after: clarityImprovement.result
      });
      optimizedPrompt = clarityImprovement.result;
    }

    // Structure optimization
    const structureImprovement = this.optimizeStructure(optimizedPrompt);
    if (structureImprovement.improved) {
      improvements.push({
        type: 'structure',
        description: 'Improved prompt structure and organization',
        impact: 'medium',
        before: optimizedPrompt,
        after: structureImprovement.result
      });
      optimizedPrompt = structureImprovement.result;
    }

    const originalTokens = this.estimateTokens(template.template);
    const optimizedTokens = this.estimateTokens(optimizedPrompt);
    const tokenSavings = originalTokens - optimizedTokens;

    return {
      originalPrompt: template.template,
      optimizedPrompt,
      improvements,
      estimatedSavings: {
        tokens: tokenSavings,
        cost: tokenSavings * 0.00002, // Approximate cost per token
        time: tokenSavings * 0.001 // Approximate time per token
      },
      confidence: improvements.length > 0 ? 0.85 : 0.5
    };
  }

  private optimizeForTokens(prompt: string): { improved: boolean; result: string } {
    let optimized = prompt;
    let improved = false;

    // Remove redundant phrases
    const redundantPhrases = [
      'please ',
      'kindly ',
      'I would like you to ',
      'Could you ',
      'Would you '
    ];

    for (const phrase of redundantPhrases) {
      if (optimized.includes(phrase)) {
        optimized = optimized.replace(new RegExp(phrase, 'gi'), '');
        improved = true;
      }
    }

    // Simplify verbose instructions
    optimized = optimized.replace(/in order to/gi, 'to');
    optimized = optimized.replace(/due to the fact that/gi, 'because');
    optimized = optimized.replace(/at this point in time/gi, 'now');

    return { improved, result: optimized };
  }

  private optimizeForClarity(prompt: string): { improved: boolean; result: string } {
    // This is a simplified version - in production, this would use NLP
    return { improved: false, result: prompt };
  }

  private optimizeStructure(prompt: string): { improved: boolean; result: string } {
    // This is a simplified version - in production, this would analyze structure
    return { improved: false, result: prompt };
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private calculateMetrics(history: PerformanceRecord[]): OptimizationMetrics {
    if (history.length === 0) {
      return this.getDefaultMetrics();
    }

    const avgTokens = history.reduce((sum, r) => sum + r.tokensUsed, 0) / history.length;
    const avgResponseTime = history.reduce((sum, r) => sum + r.responseTime, 0) / history.length;
    const successRate = history.filter(r => r.success).length / history.length;
    const avgFeedback = history
      .filter(r => r.userFeedback !== undefined)
      .reduce((sum, r) => sum + (r.userFeedback || 0), 0) / 
      history.filter(r => r.userFeedback !== undefined).length || 0;

    const relevanceScore = avgFeedback / 5; // Normalize to 0-1
    const clarityScore = successRate;
    const efficiencyScore = Math.max(0, 1 - (avgTokens / 4000)); // Penalize high token usage
    const overallScore = (relevanceScore + clarityScore + efficiencyScore) / 3;

    return {
      averageTokenCount: avgTokens,
      averageResponseTime: avgResponseTime,
      successRate,
      costPerExecution: avgTokens * 0.00002,
      relevanceScore,
      clarityScore,
      efficiencyScore,
      overallScore
    };
  }

  private getDefaultMetrics(): OptimizationMetrics {
    return {
      averageTokenCount: 0,
      averageResponseTime: 0,
      successRate: 0,
      costPerExecution: 0,
      relevanceScore: 0,
      clarityScore: 0,
      efficiencyScore: 0,
      overallScore: 0
    };
  }

  private calculateAverageOptimizationScore(): number {
    const templates = Array.from(this.templates.values());
    if (templates.length === 0) return 0;

    const totalScore = templates.reduce((sum, t) => sum + t.optimizationMetrics.overallScore, 0);
    return totalScore / templates.length;
  }

  private estimateStorageUsed(): number {
    return this.templates.size * 5000; // ~5KB per template
  }

  private generateTemplateId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCacheKey(request: OptimizationRequest): string {
    return `${request.promptId}_${JSON.stringify(request.targetMetrics)}`;
  }

  private async updateTemplateMetrics(promptId: string, result: OptimizationResult): Promise<void> {
    // Update template with optimization results
    const template = await this.retrieve(promptId);
    if (!template) return;

    // This would update metrics based on optimization results
    await this.store(promptId, template);
  }

  private compareToAverage(template: PromptTemplate): any {
    const avgScore = this.calculateAverageOptimizationScore();
    return {
      betterThanAverage: template.optimizationMetrics.overallScore > avgScore,
      difference: template.optimizationMetrics.overallScore - avgScore
    };
  }

  private calculateRelevanceScore(template: PromptTemplate, query: string): number {
    // Simple keyword matching - in production, use embeddings
    const queryLower = query.toLowerCase();
    const templateLower = template.template.toLowerCase();
    
    const queryWords = queryLower.split(/\s+/);
    const matches = queryWords.filter(word => templateLower.includes(word)).length;
    
    return matches / queryWords.length;
  }
}

export interface EfficiencyAnalysis {
  status: 'optimal' | 'needs_improvement' | 'poor' | 'insufficient_data';
  metrics?: OptimizationMetrics;
  issues?: string[];
  recommendations: string[];
  comparisonToAverage?: any;
}

export const aiPromptOptimizationRepository = new AIPromptOptimizationRepository();