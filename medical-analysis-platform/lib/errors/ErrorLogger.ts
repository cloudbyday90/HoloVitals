/**
 * Error Logging Service
 * Centralized error logging with different severity levels
 */

import { prisma } from '../prisma';
import { AppError, getErrorDetails } from './AppError';

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
}

// ============================================================================
// ERROR LOGGER SERVICE
// ============================================================================

export class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log error to database and console
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

    const logEntry: ErrorLogEntry = {
      severity,
      message: error.message,
      code: details.code,
      statusCode: details.statusCode,
      stack: details.stack,
      details: details.details,
      userId: context?.userId,
      requestId: context?.requestId,
      endpoint: context?.endpoint,
      method: context?.method,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      timestamp: new Date(),
    };

    // Log to console
    this.logToConsole(logEntry);

    // Log to database
    await this.logToDatabase(logEntry);

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
    const prefix = `[${timestamp}] [${entry.severity}]`;

    switch (entry.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(`${prefix} 🔴 CRITICAL ERROR:`, {
          message: entry.message,
          code: entry.code,
          statusCode: entry.statusCode,
          endpoint: entry.endpoint,
          userId: entry.userId,
          stack: entry.stack,
        });
        break;

      case ErrorSeverity.HIGH:
        console.error(`${prefix} 🟠 HIGH SEVERITY:`, {
          message: entry.message,
          code: entry.code,
          endpoint: entry.endpoint,
          userId: entry.userId,
        });
        break;

      case ErrorSeverity.MEDIUM:
        console.warn(`${prefix} 🟡 MEDIUM SEVERITY:`, {
          message: entry.message,
          code: entry.code,
          endpoint: entry.endpoint,
        });
        break;

      case ErrorSeverity.LOW:
        console.log(`${prefix} 🟢 LOW SEVERITY:`, {
          message: entry.message,
          code: entry.code,
        });
        break;
    }
  }

  /**
   * Log to database
   */
  private async logToDatabase(entry: ErrorLogEntry): Promise<void> {
    try {
      await prisma.errorLog.create({
        data: {
          severity: entry.severity,
          message: entry.message,
          code: entry.code,
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
        },
      });
    } catch (dbError) {
      // If database logging fails, at least log to console
      console.error('Failed to log error to database:', dbError);
      console.error('Original error:', entry);
    }
  }

  /**
   * Send critical error alerts
   */
  private async sendCriticalAlert(entry: ErrorLogEntry): Promise<void> {
    // TODO: Implement alert mechanism (email, Slack, PagerDuty, etc.)
    console.error('🚨 CRITICAL ALERT:', {
      message: entry.message,
      code: entry.code,
      endpoint: entry.endpoint,
      timestamp: entry.timestamp,
    });

    // Create notification in database
    try {
      await prisma.notification.create({
        data: {
          type: 'CRITICAL_ERROR',
          title: 'Critical System Error',
          message: `${entry.message} (${entry.code})`,
          severity: 'CRITICAL',
          metadata: JSON.stringify({
            errorCode: entry.code,
            endpoint: entry.endpoint,
            timestamp: entry.timestamp,
          }),
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to create critical error notification:', error);
    }
  }

  /**
   * Get recent errors
   */
  public async getRecentErrors(
    limit: number = 100,
    severity?: ErrorSeverity
  ): Promise<ErrorLogEntry[]> {
    const errors = await prisma.errorLog.findMany({
      where: severity ? { severity } : undefined,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return errors.map(error => ({
      id: error.id,
      severity: error.severity as ErrorSeverity,
      message: error.message,
      code: error.code || undefined,
      statusCode: error.statusCode || undefined,
      stack: error.stack || undefined,
      details: error.details ? JSON.parse(error.details) : undefined,
      userId: error.userId || undefined,
      requestId: error.requestId || undefined,
      endpoint: error.endpoint || undefined,
      method: error.method || undefined,
      userAgent: error.userAgent || undefined,
      ipAddress: error.ipAddress || undefined,
      timestamp: error.timestamp,
    }));
  }

  /**
   * Get error statistics
   */
  public async getErrorStats(timeRange: number = 24): Promise<{
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCode: Record<string, number>;
    byEndpoint: Record<string, number>;
  }> {
    const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);

    const errors = await prisma.errorLog.findMany({
      where: {
        timestamp: { gte: since },
      },
      select: {
        severity: true,
        code: true,
        endpoint: true,
      },
    });

    const stats = {
      total: errors.length,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      byCode: {} as Record<string, number>,
      byEndpoint: {} as Record<string, number>,
    };

    errors.forEach(error => {
      // Count by severity
      stats.bySeverity[error.severity as ErrorSeverity]++;

      // Count by code
      if (error.code) {
        stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
      }

      // Count by endpoint
      if (error.endpoint) {
        stats.byEndpoint[error.endpoint] = (stats.byEndpoint[error.endpoint] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clean up old error logs
   */
  public async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await prisma.errorLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        severity: {
          in: [ErrorSeverity.LOW, ErrorSeverity.MEDIUM],
        },
      },
    });

    console.log(`Cleaned up ${result.count} old error logs`);
    return result.count;
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();