/**
 * AI Context Cache Repository
 * 
 * This repository stores and provides the AI Analysis Repository with necessary context.
 * Key features:
 * - Pulls relevant patient data and new input
 * - Stores information in memory (cache)
 * - Sorts cache by importance
 * - Re-analyzes after new results to maintain relevance
 * - HIPAA-compliant: Removes all PII/PHI before caching
 */

import { IRepository, RepositoryHealth } from './interfaces/IRepository';
import { HIPAASanitizer, SanitizationResult } from '../utils/hipaa/sanitizer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ContextEntry {
  id: string;
  patientId: string; // Hashed/anonymized ID
  type: ContextType;
  data: any; // Sanitized data
  importance: number; // 0-100 score
  relevanceScore: number; // 0-1 score
  timestamp: Date;
  expiresAt?: Date;
  metadata: ContextMetadata;
  sanitizationInfo: SanitizationResult;
}

export type ContextType = 
  | 'medical_history'
  | 'test_results'
  | 'medications'
  | 'allergies'
  | 'conditions'
  | 'procedures'
  | 'vital_signs'
  | 'imaging_results'
  | 'clinical_notes'
  | 'trends'
  | 'correlations';

export interface ContextMetadata {
  source: string;
  documentIds: string[];
  dateRange?: { start: Date; end: Date };
  tags: string[];
  version: number;
  lastAccessed: Date;
  accessCount: number;
}

export interface CacheQuery {
  patientId: string;
  contextTypes?: ContextType[];
  minImportance?: number;
  maxAge?: number; // in milliseconds
  limit?: number;
  includeExpired?: boolean;
}

export interface CacheStatistics {
  totalEntries: number;
  entriesByType: Record<ContextType, number>;
  averageImportance: number;
  cacheHitRate: number;
  sanitizationCompliance: number;
  storageUsed: number;
  oldestEntry: Date;
  newestEntry: Date;
}

export interface ImportanceFactors {
  recency: number; // How recent is the data
  frequency: number; // How often is it accessed
  relevance: number; // How relevant to current analysis
  completeness: number; // How complete is the data
  accuracy: number; // Data quality score
}

export class AIContextCacheRepository implements IRepository<ContextEntry> {
  readonly name = 'AIContextCacheRepository';
  readonly version = '1.0.0';
  
  private cache: Map<string, ContextEntry> = new Map();
  private accessLog: Map<string, number> = new Map();
  private importanceCache: Map<string, ImportanceFactors> = new Map();
  
  // Cache configuration
  private readonly MAX_CACHE_SIZE = 10000; // Maximum entries
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly REANALYSIS_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  private lastReanalysis: Date = new Date();

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    
    // Start periodic reanalysis
    this.startPeriodicReanalysis();
    
    console.log(`[${this.name}] Initialized with max size: ${this.MAX_CACHE_SIZE}`);
  }

  /**
   * Store context entry (with automatic sanitization)
   */
  async store(key: string, data: ContextEntry): Promise<void> {
    // Ensure data is sanitized
    if (!data.sanitizationInfo) {
      const sanitized = HIPAASanitizer.sanitize(data.data);
      data.data = sanitized.sanitizedData;
      data.sanitizationInfo = sanitized;
    }

    // Validate HIPAA compliance
    const validation = HIPAASanitizer.validate(data.data);
    if (!validation.isValid) {
      throw new Error(`HIPAA validation failed: ${validation.issues.join(', ')}`);
    }

    // Check cache size and evict if necessary
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      await this.evictLeastImportant();
    }

    // Store entry
    this.cache.set(key, data);
    this.accessLog.set(key, 0);
    
    // Calculate initial importance
    await this.calculateImportance(key);
  }

  /**
   * Retrieve context entry
   */
  async retrieve(key: string): Promise<ContextEntry | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await this.delete(key);
      return null;
    }

    // Update access metadata
    entry.metadata.lastAccessed = new Date();
    entry.metadata.accessCount++;
    this.accessLog.set(key, (this.accessLog.get(key) || 0) + 1);

    return entry;
  }

  /**
   * Update context entry
   */
  async update(key: string, data: Partial<ContextEntry>): Promise<void> {
    const existing = await this.retrieve(key);
    if (!existing) {
      throw new Error(`Context entry ${key} not found`);
    }

    // If data is being updated, re-sanitize
    if (data.data) {
      const sanitized = HIPAASanitizer.sanitize(data.data);
      data.data = sanitized.sanitizedData;
      data.sanitizationInfo = sanitized;
    }

    const updated = {
      ...existing,
      ...data,
      timestamp: new Date()
    };

    await this.store(key, updated);
  }

  /**
   * Delete context entry
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.accessLog.delete(key);
    this.importanceCache.delete(key);
  }

  /**
   * Check if entry exists
   */
  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessLog.clear();
    this.importanceCache.clear();
  }

  /**
   * Get repository health
   */
  async getHealth(): Promise<RepositoryHealth> {
    const stats = await this.getStatistics();
    
    const issues: string[] = [];
    
    if (stats.sanitizationCompliance < 1.0) {
      issues.push(`Sanitization compliance below 100%: ${(stats.sanitizationCompliance * 100).toFixed(1)}%`);
    }
    
    if (stats.totalEntries > this.MAX_CACHE_SIZE * 0.9) {
      issues.push(`Cache near capacity: ${stats.totalEntries}/${this.MAX_CACHE_SIZE}`);
    }
    
    if (stats.cacheHitRate < 0.5) {
      issues.push(`Low cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
    }

    return {
      status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'degraded' : 'unhealthy',
      lastCheck: new Date(),
      metrics: {
        itemCount: stats.totalEntries,
        storageUsed: stats.storageUsed,
        averageResponseTime: 5 // Cache is fast
      },
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Add new context from patient data
   */
  async addPatientContext(
    patientId: string,
    type: ContextType,
    rawData: any,
    metadata: Partial<ContextMetadata>
  ): Promise<string> {
    // Sanitize data before storing
    const sanitized = HIPAASanitizer.sanitize(rawData);
    
    const entryId = this.generateEntryId();
    const entry: ContextEntry = {
      id: entryId,
      patientId: this.anonymizePatientId(patientId),
      type,
      data: sanitized.sanitizedData,
      importance: 50, // Default, will be calculated
      relevanceScore: 1.0,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.DEFAULT_TTL),
      metadata: {
        source: metadata.source || 'unknown',
        documentIds: metadata.documentIds || [],
        tags: metadata.tags || [],
        version: 1,
        lastAccessed: new Date(),
        accessCount: 0,
        ...metadata
      },
      sanitizationInfo: sanitized
    };

    await this.store(entryId, entry);
    
    // Trigger reanalysis of importance
    await this.reanalyzeImportance();

    return entryId;
  }

  /**
   * Query context cache
   */
  async query(query: CacheQuery): Promise<ContextEntry[]> {
    let results: ContextEntry[] = [];

    // Filter by patient
    for (const entry of this.cache.values()) {
      if (entry.patientId !== this.anonymizePatientId(query.patientId)) {
        continue;
      }

      // Filter by type
      if (query.contextTypes && !query.contextTypes.includes(entry.type)) {
        continue;
      }

      // Filter by importance
      if (query.minImportance && entry.importance < query.minImportance) {
        continue;
      }

      // Filter by age
      if (query.maxAge) {
        const age = Date.now() - entry.timestamp.getTime();
        if (age > query.maxAge) {
          continue;
        }
      }

      // Filter expired
      if (!query.includeExpired && entry.expiresAt && entry.expiresAt < new Date()) {
        continue;
      }

      results.push(entry);
    }

    // Sort by importance (descending)
    results.sort((a, b) => b.importance - a.importance);

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get sorted context for analysis
   */
  async getContextForAnalysis(
    patientId: string,
    analysisType: string,
    maxEntries: number = 20
  ): Promise<ContextEntry[]> {
    // Get all relevant context
    const allContext = await this.query({
      patientId,
      minImportance: 30, // Only include moderately important or higher
      includeExpired: false
    });

    // Calculate relevance scores based on analysis type
    for (const entry of allContext) {
      entry.relevanceScore = this.calculateRelevanceForAnalysis(entry, analysisType);
    }

    // Sort by combined importance and relevance
    allContext.sort((a, b) => {
      const scoreA = a.importance * 0.5 + a.relevanceScore * 50;
      const scoreB = b.importance * 0.5 + b.relevanceScore * 50;
      return scoreB - scoreA;
    });

    return allContext.slice(0, maxEntries);
  }

  /**
   * Reanalyze importance of all cached entries
   */
  async reanalyzeImportance(): Promise<void> {
    console.log(`[${this.name}] Reanalyzing importance of ${this.cache.size} entries...`);
    
    for (const [key, entry] of this.cache.entries()) {
      await this.calculateImportance(key);
    }

    this.lastReanalysis = new Date();
    console.log(`[${this.name}] Reanalysis complete`);
  }

  /**
   * Calculate importance score for an entry
   */
  private async calculateImportance(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (!entry) return;

    const factors: ImportanceFactors = {
      recency: this.calculateRecencyScore(entry),
      frequency: this.calculateFrequencyScore(key),
      relevance: entry.relevanceScore,
      completeness: this.calculateCompletenessScore(entry),
      accuracy: this.calculateAccuracyScore(entry)
    };

    // Weighted average
    const importance = 
      factors.recency * 0.25 +
      factors.frequency * 0.20 +
      factors.relevance * 0.30 +
      factors.completeness * 0.15 +
      factors.accuracy * 0.10;

    entry.importance = Math.round(importance * 100);
    this.importanceCache.set(key, factors);
  }

  /**
   * Calculate recency score (newer = higher)
   */
  private calculateRecencyScore(entry: ContextEntry): number {
    const ageMs = Date.now() - entry.timestamp.getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    
    // Exponential decay: score = e^(-age/30)
    return Math.exp(-ageDays / 30);
  }

  /**
   * Calculate frequency score (more accessed = higher)
   */
  private calculateFrequencyScore(key: string): number {
    const accessCount = this.accessLog.get(key) || 0;
    
    // Logarithmic scale: score = log(1 + count) / log(101)
    return Math.log(1 + accessCount) / Math.log(101);
  }

  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(entry: ContextEntry): number {
    // Check how much data was removed during sanitization
    const removedFields = entry.sanitizationInfo.removedFields.length;
    
    // Assume complete if few fields removed
    if (removedFields === 0) return 1.0;
    if (removedFields < 5) return 0.8;
    if (removedFields < 10) return 0.6;
    return 0.4;
  }

  /**
   * Calculate accuracy score
   */
  private calculateAccuracyScore(entry: ContextEntry): number {
    // In production, this would check data quality metrics
    // For now, assume high accuracy for recent data
    const ageMs = Date.now() - entry.timestamp.getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    
    if (ageDays < 7) return 1.0;
    if (ageDays < 30) return 0.9;
    if (ageDays < 90) return 0.8;
    return 0.7;
  }

  /**
   * Calculate relevance for specific analysis type
   */
  private calculateRelevanceForAnalysis(entry: ContextEntry, analysisType: string): number {
    // Map analysis types to relevant context types
    const relevanceMap: Record<string, ContextType[]> = {
      'bloodwork': ['test_results', 'trends', 'medical_history'],
      'imaging': ['imaging_results', 'procedures', 'clinical_notes'],
      'medication': ['medications', 'allergies', 'conditions'],
      'trend': ['test_results', 'vital_signs', 'trends'],
      'risk': ['conditions', 'medical_history', 'trends', 'correlations']
    };

    const relevantTypes = relevanceMap[analysisType] || [];
    
    if (relevantTypes.includes(entry.type)) {
      return 1.0;
    }

    return 0.3; // Still somewhat relevant
  }

  /**
   * Evict least important entries
   */
  private async evictLeastImportant(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Sort by importance (ascending)
    entries.sort((a, b) => a[1].importance - b[1].importance);
    
    // Remove bottom 10%
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      await this.delete(entries[i][0]);
    }

    console.log(`[${this.name}] Evicted ${toRemove} least important entries`);
  }

  /**
   * Get cache statistics
   */
  async getStatistics(): Promise<CacheStatistics> {
    const entries = Array.from(this.cache.values());
    
    const entriesByType: Record<ContextType, number> = {} as any;
    let totalImportance = 0;
    let sanitizedCount = 0;
    let oldestDate = new Date();
    let newestDate = new Date(0);

    for (const entry of entries) {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
      totalImportance += entry.importance;
      
      if (entry.sanitizationInfo.sanitizationLevel !== 'none') {
        sanitizedCount++;
      }
      
      if (entry.timestamp < oldestDate) oldestDate = entry.timestamp;
      if (entry.timestamp > newestDate) newestDate = entry.timestamp;
    }

    return {
      totalEntries: entries.length,
      entriesByType,
      averageImportance: entries.length > 0 ? totalImportance / entries.length : 0,
      cacheHitRate: this.calculateCacheHitRate(),
      sanitizationCompliance: entries.length > 0 ? sanitizedCount / entries.length : 1.0,
      storageUsed: this.estimateStorageUsed(),
      oldestEntry: oldestDate,
      newestEntry: newestDate
    };
  }

  /**
   * Start periodic reanalysis
   */
  private startPeriodicReanalysis(): void {
    setInterval(async () => {
      const timeSinceLastReanalysis = Date.now() - this.lastReanalysis.getTime();
      
      if (timeSinceLastReanalysis >= this.REANALYSIS_INTERVAL) {
        await this.reanalyzeImportance();
      }
    }, this.REANALYSIS_INTERVAL);
  }

  // Helper methods

  private generateEntryId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private anonymizePatientId(patientId: string): string {
    // Simple hash - in production, use proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < patientId.length; i++) {
      const char = patientId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `anon_${Math.abs(hash).toString(36)}`;
  }

  private calculateCacheHitRate(): number {
    // This would track actual cache hits vs misses
    // For now, return estimated value
    return 0.75;
  }

  private estimateStorageUsed(): number {
    return this.cache.size * 8000; // ~8KB per entry
  }
}

export const aiContextCacheRepository = new AIContextCacheRepository();