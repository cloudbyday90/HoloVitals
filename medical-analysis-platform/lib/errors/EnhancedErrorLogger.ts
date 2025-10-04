/**
 * Enhanced Error Logger with Deduplication and Master Error Codes
 * Prevents log bloat by deduplicating errors and grouping under master codes
 */

import { prisma } from '../prisma';
import { AppError, getErrorDetails } from './AppError';
import { ErrorCodeClassifier, MASTER_ERROR_CODES } from './MasterErrorCodes';
import crypto from 'crypto';

// ============================================================================
// ERROR SEVERITY LEVELS
// ============================================================================

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ============================================================================
// ERROR LOG ENTRY
// ============================================================================

export interface ErrorLogEntry {
  id?: string;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  masterCode?: string;
  statusCode?: number;
  stack?: string;
  details?: any;
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  occurrenceCount?: number;
  firstSeen?: Date;
  lastSeen?: Date;
}

// ============================================================================
// DEDUPLICATION CONFIGURATION
// ============================================================================

interface DeduplicationConfig {
  enabled: boolean;
  windowMinutes: number; // Time window for considering errors as duplicates
  maxSampleStacks: number; // Maximum number of stack traces to keep
}

const DEFAULT_DEDUP_CONFIG: DeduplicationConfig = {
  enabled: true,
  windowMinutes: 5,
  maxSampleStacks: 3,
};

// ============================================================================
// ENHANCED ERROR LOGGER SERVICE
// ============================================================================

export class EnhancedErrorLogger {
  private static instance: EnhancedErrorLogger;
  private dedupConfig: DeduplicationConfig;
  private dedupCache: Map<string, { id: string; count: number; lastSeen: Date }> = new Map();

  private constructor(config?: Partial<DeduplicationConfig>) {
    this.dedupConfig = { ...DEFAULT_DEDUP_CONFIG, ...config };
    
    // Clean up cache every 10 minutes
    setInterval(() => this.cleanupDedupCache(), 10 * 60 * 1000);
  }

  public static getInstance(config?: Partial<DeduplicationConfig>): EnhancedErrorLogger {
    if (!EnhancedErrorLogger.instance) {
      EnhancedErrorLogger.instance = new EnhancedErrorLogger(config);
    }
    return EnhancedErrorLogger.instance;
  }

  /**
   * Generate unique hash for error deduplication
   */
  private generateErrorHash(
    code: string | undefined,
    message: string,
    endpoint: string | undefined
  ): string {
    const hashInput = `${code || 'UNKNOWN'}:${message}:${endpoint || 'UNKNOWN'}`;
    return crypto.createHash('md5').update(hashInput).digest('hex');
  }

  /**
   * Check if error is a duplicate within the deduplication window
   */
  private async checkDuplicate(
    errorHash: string,
    timestamp: Date
  ): Promise<{ isDuplicate: boolean; existingId?: string }> {
    if (!this.dedupConfig.enabled) {
      return { isDuplicate: false };
    }

    // Check in-memory cache first
    const cached = this.dedupCache.get(errorHash);
    if (cached) {
      const timeDiff = timestamp.getTime() - cached.lastSeen.getTime();
      const windowMs = this.dedupConfig.windowMinutes * 60 * 1000;
      
      if (timeDiff <= windowMs) {
        return { isDuplicate: true, existingId: cached.id };
      }
    }

    // Check database for recent occurrences
    const windowStart = new Date(timestamp.getTime() - this.dedupConfig.windowMinutes * 60 * 1000);
    
    const existingError = await prisma.errorLog.findFirst({
      where: {
        errorHash,
        lastSeen: { gte: windowStart },
      },
      orderBy: { lastSeen: 'desc' },
    });

    if (existingError) {
      // Update cache
      this.dedupCache.set(errorHash, {
        id: existingError.id,
        count: existingError.occurrenceCount || 1,
        lastSeen: existingError.lastSeen || existingError.timestamp,
      });
      
      return { isDuplicate: true, existingId: existingError.id };
    }

    return { isDuplicate: false };
  }

  /**
   * Update duplicate error occurrence
   */
  private async updateDuplicateError(
    errorId: string,
    stack: string | undefined,
    timestamp: Date
  ): Promise<void> {
    const existing = await prisma.errorLog.findUnique({
      where: { id: errorId },
    });

    if (!existing) return;

    // Parse existing sample stacks
    let sampleStacks: string[] = [];
    if (existing.sampleStacks) {
      try {
        sampleStacks = JSON.parse(existing.sampleStacks as string);
      } catch (e) {
        sampleStacks = [];
      }
    }

    // Add new stack trace if provided
    if (stack && !sampleStacks.includes(stack)) {
      sampleStacks.unshift(stack);
      // Keep only the most recent N stack traces
      sampleStacks = sampleStacks.slice(0, this.dedupConfig.maxSampleStacks);
    }

    // Update the error log
    await prisma.errorLog.update({
      where: { id: errorId },
      data: {
        occurrenceCount: { increment: 1 },
        lastSeen: timestamp,
        sampleStacks: JSON.stringify(sampleStacks),
      },
    });

    // Update cache
    const errorHash = existing.errorHash;
    if (errorHash) {
      const cached = this.dedupCache.get(errorHash);
      if (cached) {
        cached.count++;
        cached.lastSeen = timestamp;
      }
    }
  }

  /**
   * Log error to database and console with deduplication
   */
  public async logError(
    error: Error,
    context?: {
      userId?: string;
      requestId?: string;
      endpoint?: string;
      method?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<void> {
    const severity = this.determineSeverity(error);
    const details = getErrorDetails(error);
    const timestamp = new Date();

    // Determine master error code
    let masterCode: string | null = null;
    if (details.code) {
      masterCode = ErrorCodeClassifier.getMasterCode(details.code);
    }
    if (!masterCode) {
      masterCode = ErrorCodeClassifier.classifyByMessage(error.message);
    }

    // Generate error hash for deduplication
    const errorHash = this.generateErrorHash(
      details.code,
      error.message,
      context?.endpoint
    );

    // Check for duplicates
    const { isDuplicate, existingId } = await this.checkDuplicate(errorHash, timestamp);

    if (isDuplicate && existingId) {
      // Update existing error
      await this.updateDuplicateError(existingId, details.stack, timestamp);
      
      // Log to console (abbreviated for duplicates)
      this.logDuplicateToConsole(error.message, details.code, existingId);
      
      return;
    }

    // Create new error log entry
    const logEntry: ErrorLogEntry = {
      severity,
      message: error.message,
      code: details.code,
      masterCode: masterCode || undefined,
      statusCode: details.statusCode,
      stack: details.stack,
      details: details.details,
      userId: context?.userId,
      requestId: context?.requestId,
      endpoint: context?.endpoint,
      method: context?.method,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      timestamp,
      occurrenceCount: 1,
      firstSeen: timestamp,
      lastSeen: timestamp,
    };

    // Log to console
    this.logToConsole(logEntry);

    // Log to database
    const createdError = await this.logToDatabase(logEntry, errorHash);

    // Update cache
    if (createdError) {
      this.dedupCache.set(errorHash, {
        id: createdError.id,
        count: 1,
        lastSeen: timestamp,
      });
    }

    // Send alerts for critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      await this.sendCriticalAlert(logEntry);
    }
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): ErrorSeverity {
    if (error instanceof AppError) {
      // Critical errors (system failures)
      if (!error.isOperational || error.statusCode >= 500) {
        return ErrorSeverity.CRITICAL;
      }

      // High severity (authorization, HIPAA violations)
      if (
        error.code === 'HIPAA_VIOLATION' ||
        error.code === 'PHI_ACCESS_ERROR' ||
        error.code === 'AUTHORIZATION_ERROR'
      ) {
        return ErrorSeverity.HIGH;
      }

      // Medium severity (validation, not found)
      if (
        error.statusCode === 400 ||
        error.statusCode === 404 ||
        error.statusCode === 409
      ) {
        return ErrorSeverity.MEDIUM;
      }

      // Low severity (rate limiting, etc.)
      return ErrorSeverity.LOW;
    }

    // Unknown errors are critical
    return ErrorSeverity.CRITICAL;
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const masterInfo = entry.masterCode ? ` [${entry.masterCode}]` : '';
    const prefix = `[${timestamp}] [${entry.severity}]${masterInfo}`;

    switch (entry.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(`${prefix} 🔴 CRITICAL ERROR:`, {
          message: entry.message,
          code: entry.code,
          masterCode: entry.masterCode,
          statusCode: entry.statusCode,
          endpoint: entry.endpoint,
          userId: entry.userId,
        });
        break;

      case ErrorSeverity.HIGH:
        console.error(`${prefix} 🟠 HIGH SEVERITY:`, {
          message: entry.message,
          code: entry.code,
          masterCode: entry.masterCode,
          endpoint: entry.endpoint,
          userId: entry.userId,
        });
        break;

      case ErrorSeverity.MEDIUM:
        console.warn(`${prefix} 🟡 MEDIUM SEVERITY:`, {
          message: entry.message,
          code: entry.code,
          masterCode: entry.masterCode,
          endpoint: entry.endpoint,
        });
        break;

      case ErrorSeverity.LOW:
        console.log(`${prefix} 🟢 LOW SEVERITY:`, {
          message: entry.message,
          code: entry.code,
          masterCode: entry.masterCode,
        });
        break;
    }
  }

  /**
   * Log duplicate to console (abbreviated)
   */
  private logDuplicateToConsole(message: string, code: string | undefined, errorId: string): void {
    console.log(`[DUPLICATE] Error repeated: ${code || 'UNKNOWN'} - ${message.substring(0, 50)}... (ID: ${errorId})`);
  }

  /**
   * Log to database
   */
  private async logToDatabase(entry: ErrorLogEntry, errorHash: string): Promise<any> {
    try {
      const sampleStacks = entry.stack ? [entry.stack] : [];
      
      return await prisma.errorLog.create({
        data: {
          severity: entry.severity,
          message: entry.message,
          code: entry.code,
          masterCode: entry.masterCode,
          statusCode: entry.statusCode,
          stack: entry.stack,
          details: entry.details ? JSON.stringify(entry.details) : null,
          userId: entry.userId,
          requestId: entry.requestId,
          endpoint: entry.endpoint,
          method: entry.method,
          userAgent: entry.userAgent,
          ipAddress: entry.ipAddress,
          timestamp: entry.timestamp,
          errorHash,
          occurrenceCount: 1,
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
          sampleStacks: JSON.stringify(sampleStacks),
          isDuplicate: false,
        },
      });
    } catch (dbError) {
      // If database logging fails, at least log to console
      console.error('Failed to log error to database:', dbError);
      console.error('Original error:', entry);
      return null;
    }
  }

  /**
   * Send critical error alerts
   */
  private async sendCriticalAlert(entry: ErrorLogEntry): Promise<void> {
    console.error('🚨 CRITICAL ALERT:', {
      message: entry.message,
      code: entry.code,
      masterCode: entry.masterCode,
      endpoint: entry.endpoint,
      timestamp: entry.timestamp,
    });

    // Import alert service dynamically to avoid circular dependency
    try {
      const { errorAlertService } = await import('../services/ErrorAlertService');
      
      await errorAlertService.sendCriticalAlert(
        entry.id || 'unknown',
        entry.message,
        {
          code: entry.code,
          masterCode: entry.masterCode,
          endpoint: entry.endpoint,
          userId: entry.userId,
          timestamp: entry.timestamp,
        }
      );
    } catch (error) {
      console.error('Failed to send critical error alert:', error);
    }
  }

  /**
   * Clean up old entries from deduplication cache
   */
  private cleanupDedupCache(): void {
    const now = new Date();
    const windowMs = this.dedupConfig.windowMinutes * 60 * 1000;

    for (const [hash, cached] of this.dedupCache.entries()) {
      const age = now.getTime() - cached.lastSeen.getTime();
      if (age > windowMs * 2) {
        this.dedupCache.delete(hash);
      }
    }
  }

  /**
   * Get error statistics with master code grouping
   */
  public async getErrorStats(timeRange: number = 24): Promise<{
    total: number;
    totalOccurrences: number;
    bySeverity: Record<ErrorSeverity, number>;
    byMasterCode: Record<string, { count: number; occurrences: number; description: string }>;
    topErrors: Array<{ code: string; message: string; count: number; occurrences: number }>;
  }> {
    const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);

    const errors = await prisma.errorLog.findMany({
      where: {
        timestamp: { gte: since },
      },
      select: {
        severity: true,
        code: true,
        masterCode: true,
        message: true,
        occurrenceCount: true,
      },
    });

    const stats = {
      total: errors.length,
      totalOccurrences: 0,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      byMasterCode: {} as Record<string, { count: number; occurrences: number; description: string }>,
      topErrors: [] as Array<{ code: string; message: string; count: number; occurrences: number }>,
    };

    const errorCounts = new Map<string, { message: string; count: number; occurrences: number }>();

    errors.forEach(error => {
      const occurrences = error.occurrenceCount || 1;
      stats.totalOccurrences += occurrences;

      // Count by severity
      stats.bySeverity[error.severity as ErrorSeverity]++;

      // Count by master code
      if (error.masterCode) {
        if (!stats.byMasterCode[error.masterCode]) {
          const definition = MASTER_ERROR_CODES[error.masterCode];
          stats.byMasterCode[error.masterCode] = {
            count: 0,
            occurrences: 0,
            description: definition?.description || 'Unknown',
          };
        }
        stats.byMasterCode[error.masterCode].count++;
        stats.byMasterCode[error.masterCode].occurrences += occurrences;
      }

      // Track individual errors for top errors
      const errorKey = `${error.code || 'UNKNOWN'}:${error.message}`;
      if (!errorCounts.has(errorKey)) {
        errorCounts.set(errorKey, {
          message: error.message,
          count: 0,
          occurrences: 0,
        });
      }
      const errorCount = errorCounts.get(errorKey)!;
      errorCount.count++;
      errorCount.occurrences += occurrences;
    });

    // Get top 10 errors by occurrence count
    stats.topErrors = Array.from(errorCounts.entries())
      .map(([key, data]) => ({
        code: key.split(':')[0],
        message: data.message,
        count: data.count,
        occurrences: data.occurrences,
      }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10);

    return stats;
  }

  /**
   * Purge duplicate error entries (keep only the master entry)
   */
  public async purgeDuplicates(olderThanHours: number = 24): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    // Find all error hashes with duplicates
    const duplicateGroups = await prisma.errorLog.groupBy({
      by: ['errorHash'],
      where: {
        errorHash: { not: null },
        timestamp: { lt: cutoffDate },
      },
      having: {
        errorHash: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    let totalPurged = 0;

    for (const group of duplicateGroups) {
      if (!group.errorHash) continue;

      // Get all errors in this group
      const errors = await prisma.errorLog.findMany({
        where: { errorHash: group.errorHash },
        orderBy: { firstSeen: 'asc' },
      });

      if (errors.length <= 1) continue;

      // Keep the first one (master), delete the rest
      const masterError = errors[0];
      const duplicateIds = errors.slice(1).map(e => e.id);

      // Calculate total occurrences
      const totalOccurrences = errors.reduce((sum, e) => sum + (e.occurrenceCount || 1), 0);

      // Update master with total occurrences and latest timestamp
      await prisma.errorLog.update({
        where: { id: masterError.id },
        data: {
          occurrenceCount: totalOccurrences,
          lastSeen: errors[errors.length - 1].lastSeen || errors[errors.length - 1].timestamp,
        },
      });

      // Delete duplicates
      const result = await prisma.errorLog.deleteMany({
        where: { id: { in: duplicateIds } },
      });

      totalPurged += result.count;
    }

    console.log(`Purged ${totalPurged} duplicate error entries`);
    return totalPurged;
  }

  /**
   * Clean up old error logs based on retention policy
   */
  public async cleanupOldLogs(): Promise<{
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    const now = Date.now();
    const result = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    // Retention periods (in days)
    const retentionPeriods = {
      [ErrorSeverity.CRITICAL]: 365,
      [ErrorSeverity.HIGH]: 180,
      [ErrorSeverity.MEDIUM]: 90,
      [ErrorSeverity.LOW]: 30,
    };

    for (const [severity, days] of Object.entries(retentionPeriods)) {
      const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000);

      const deleted = await prisma.errorLog.deleteMany({
        where: {
          severity,
          timestamp: { lt: cutoffDate },
        },
      });

      result[severity.toLowerCase() as keyof typeof result] = deleted.count;
    }

    const total = Object.values(result).reduce((sum, count) => sum + count, 0);
    console.log(`Cleaned up ${total} old error logs:`, result);

    return result;
  }
}

// Export singleton instance
export const enhancedErrorLogger = EnhancedErrorLogger.getInstance();