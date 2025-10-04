/**
 * Conflict Resolution Service
 * 
 * Handles detection and resolution of data conflicts during bidirectional
 * EHR synchronization. Implements multiple resolution strategies.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Conflict Resolution Strategy
export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'LAST_WRITE_WINS',
  FIRST_WRITE_WINS = 'FIRST_WRITE_WINS',
  LOCAL_WINS = 'LOCAL_WINS',
  REMOTE_WINS = 'REMOTE_WINS',
  MERGE = 'MERGE',
  MANUAL = 'MANUAL',
  CUSTOM = 'CUSTOM',
}

// Conflict Type
export enum ConflictType {
  UPDATE_UPDATE = 'UPDATE_UPDATE',
  UPDATE_DELETE = 'UPDATE_DELETE',
  DELETE_UPDATE = 'DELETE_UPDATE',
  CREATE_CREATE = 'CREATE_CREATE',
  FIELD_MISMATCH = 'FIELD_MISMATCH',
}

// Conflict Severity
export enum ConflictSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// Conflict Status
export enum ConflictStatus {
  DETECTED = 'DETECTED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED',
}

// Data Conflict
export interface DataConflict {
  conflictId: string;
  type: ConflictType;
  severity: ConflictSeverity;
  status: ConflictStatus;
  resourceType: string;
  resourceId: string;
  field: string;
  localValue: any;
  remoteValue: any;
  localTimestamp: Date;
  remoteTimestamp: Date;
  localVersion?: string;
  remoteVersion?: string;
  detectedAt: Date;
  detectedBy: string;
  resolution?: ConflictResolution;
  metadata?: Record<string, any>;
}

// Conflict Resolution
export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  resolvedValue: any;
  resolvedBy: string;
  resolvedAt: Date;
  reason?: string;
  customFunction?: string;
  metadata?: Record<string, any>;
}

// Conflict Detection Result
export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: DataConflict[];
  summary: {
    totalConflicts: number;
    criticalConflicts: number;
    highPriorityConflicts: number;
    autoResolvableConflicts: number;
    manualReviewRequired: number;
  };
}

// Conflict Resolution Result
export interface ConflictResolutionResult {
  success: boolean;
  conflictId: string;
  resolvedValue: any;
  strategy: ConflictResolutionStrategy;
  errors?: string[];
  warnings?: string[];
}

// Merge Strategy Options
export interface MergeStrategyOptions {
  preferLocal?: string[];
  preferRemote?: string[];
  concatenate?: string[];
  average?: string[];
  max?: string[];
  min?: string[];
  custom?: Record<string, (local: any, remote: any) => any>;
}

/**
 * Conflict Resolution Service
 */
export class ConflictResolutionService {
  private resolutionStrategies: Map<string, ConflictResolutionStrategy> = new Map();
  private customResolvers: Map<string, (conflict: DataConflict) => any> = new Map();

  constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * Detect conflicts between local and remote data
   */
  async detectConflicts(
    resourceType: string,
    resourceId: string,
    localData: any,
    remoteData: any,
    options?: {
      ignoreFields?: string[];
      sensitiveFields?: string[];
      timestampField?: string;
      versionField?: string;
    }
  ): Promise<ConflictDetectionResult> {
    const conflicts: DataConflict[] = [];
    const ignoreFields = new Set(options?.ignoreFields || []);
    const sensitiveFields = new Set(options?.sensitiveFields || []);

    try {
      // Get timestamps
      const localTimestamp = options?.timestampField 
        ? new Date(localData[options.timestampField])
        : new Date();
      const remoteTimestamp = options?.timestampField
        ? new Date(remoteData[options.timestampField])
        : new Date();

      // Get versions
      const localVersion = options?.versionField ? localData[options.versionField] : undefined;
      const remoteVersion = options?.versionField ? remoteData[options.versionField] : undefined;

      // Compare all fields
      const allFields = new Set([
        ...Object.keys(localData || {}),
        ...Object.keys(remoteData || {}),
      ]);

      for (const field of allFields) {
        if (ignoreFields.has(field)) continue;

        const localValue = localData?.[field];
        const remoteValue = remoteData?.[field];

        // Check for conflicts
        if (this.hasConflict(localValue, remoteValue)) {
          const conflict: DataConflict = {
            conflictId: `${resourceId}-${field}-${Date.now()}`,
            type: this.determineConflictType(localValue, remoteValue),
            severity: this.determineSeverity(field, sensitiveFields),
            status: ConflictStatus.DETECTED,
            resourceType,
            resourceId,
            field,
            localValue,
            remoteValue,
            localTimestamp,
            remoteTimestamp,
            localVersion,
            remoteVersion,
            detectedAt: new Date(),
            detectedBy: 'system',
          };

          conflicts.push(conflict);

          // Save conflict to database
          await this.saveConflict(conflict);
        }
      }

      // Generate summary
      const summary = {
        totalConflicts: conflicts.length,
        criticalConflicts: conflicts.filter(c => c.severity === ConflictSeverity.CRITICAL).length,
        highPriorityConflicts: conflicts.filter(c => c.severity === ConflictSeverity.HIGH).length,
        autoResolvableConflicts: conflicts.filter(c => this.isAutoResolvable(c)).length,
        manualReviewRequired: conflicts.filter(c => !this.isAutoResolvable(c)).length,
      };

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        summary,
      };
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw new Error(`Conflict detection failed: ${error.message}`);
    }
  }

  /**
   * Resolve a conflict using specified strategy
   */
  async resolveConflict(
    conflict: DataConflict,
    strategy: ConflictResolutionStrategy,
    options?: {
      userId?: string;
      reason?: string;
      customFunction?: string;
      mergeOptions?: MergeStrategyOptions;
    }
  ): Promise<ConflictResolutionResult> {
    try {
      let resolvedValue: any;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Apply resolution strategy
      switch (strategy) {
        case ConflictResolutionStrategy.LAST_WRITE_WINS:
          resolvedValue = this.resolveLastWriteWins(conflict);
          break;

        case ConflictResolutionStrategy.FIRST_WRITE_WINS:
          resolvedValue = this.resolveFirstWriteWins(conflict);
          break;

        case ConflictResolutionStrategy.LOCAL_WINS:
          resolvedValue = conflict.localValue;
          break;

        case ConflictResolutionStrategy.REMOTE_WINS:
          resolvedValue = conflict.remoteValue;
          break;

        case ConflictResolutionStrategy.MERGE:
          resolvedValue = this.resolveMerge(conflict, options?.mergeOptions);
          break;

        case ConflictResolutionStrategy.MANUAL:
          // Manual resolution requires user input
          return {
            success: false,
            conflictId: conflict.conflictId,
            resolvedValue: null,
            strategy,
            errors: ['Manual resolution required - no automatic resolution available'],
          };

        case ConflictResolutionStrategy.CUSTOM:
          if (!options?.customFunction) {
            return {
              success: false,
              conflictId: conflict.conflictId,
              resolvedValue: null,
              strategy,
              errors: ['Custom function required for CUSTOM strategy'],
            };
          }
          resolvedValue = this.resolveCustom(conflict, options.customFunction);
          break;

        default:
          return {
            success: false,
            conflictId: conflict.conflictId,
            resolvedValue: null,
            strategy,
            errors: [`Unknown resolution strategy: ${strategy}`],
          };
      }

      // Create resolution record
      const resolution: ConflictResolution = {
        strategy,
        resolvedValue,
        resolvedBy: options?.userId || 'system',
        resolvedAt: new Date(),
        reason: options?.reason,
        customFunction: options?.customFunction,
      };

      // Update conflict in database
      await this.updateConflictResolution(conflict.conflictId, resolution);

      return {
        success: true,
        conflictId: conflict.conflictId,
        resolvedValue,
        strategy,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return {
        success: false,
        conflictId: conflict.conflictId,
        resolvedValue: null,
        strategy,
        errors: [`Resolution failed: ${error.message}`],
      };
    }
  }

  /**
   * Resolve multiple conflicts in batch
   */
  async resolveConflictsBatch(
    conflicts: DataConflict[],
    strategy: ConflictResolutionStrategy,
    options?: {
      userId?: string;
      reason?: string;
      mergeOptions?: MergeStrategyOptions;
    }
  ): Promise<ConflictResolutionResult[]> {
    const results: ConflictResolutionResult[] = [];

    for (const conflict of conflicts) {
      const result = await this.resolveConflict(conflict, strategy, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Auto-resolve conflicts based on configured strategies
   */
  async autoResolveConflicts(
    resourceType: string,
    resourceId: string
  ): Promise<ConflictResolutionResult[]> {
    try {
      // Get pending conflicts
      const conflicts = await this.getPendingConflicts(resourceType, resourceId);

      const results: ConflictResolutionResult[] = [];

      for (const conflict of conflicts) {
        // Check if auto-resolvable
        if (!this.isAutoResolvable(conflict)) {
          continue;
        }

        // Get configured strategy for this resource type and field
        const strategy = this.getConfiguredStrategy(resourceType, conflict.field);

        // Resolve conflict
        const result = await this.resolveConflict(conflict, strategy);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Error auto-resolving conflicts:', error);
      throw new Error(`Auto-resolution failed: ${error.message}`);
    }
  }

  /**
   * Get pending conflicts
   */
  async getPendingConflicts(
    resourceType?: string,
    resourceId?: string
  ): Promise<DataConflict[]> {
    try {
      const where: any = {
        status: {
          in: [ConflictStatus.DETECTED, ConflictStatus.PENDING_REVIEW],
        },
      };

      if (resourceType) where.resourceType = resourceType;
      if (resourceId) where.resourceId = resourceId;

      const conflicts = await prisma.syncConflict.findMany({
        where,
        orderBy: [
          { severity: 'asc' },
          { detectedAt: 'desc' },
        ],
      });

      return conflicts as any[];
    } catch (error) {
      console.error('Error getting pending conflicts:', error);
      throw new Error(`Failed to get pending conflicts: ${error.message}`);
    }
  }

  /**
   * Get conflict statistics
   */
  async getConflictStatistics(
    resourceType?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    byType: Record<ConflictType, number>;
    bySeverity: Record<ConflictSeverity, number>;
    byStatus: Record<ConflictStatus, number>;
    byStrategy: Record<ConflictResolutionStrategy, number>;
    averageResolutionTime: number;
  }> {
    try {
      const where: any = {};
      if (resourceType) where.resourceType = resourceType;
      if (startDate || endDate) {
        where.detectedAt = {};
        if (startDate) where.detectedAt.gte = startDate;
        if (endDate) where.detectedAt.lte = endDate;
      }

      const conflicts = await prisma.syncConflict.findMany({ where });

      const stats = {
        total: conflicts.length,
        byType: {} as Record<ConflictType, number>,
        bySeverity: {} as Record<ConflictSeverity, number>,
        byStatus: {} as Record<ConflictStatus, number>,
        byStrategy: {} as Record<ConflictResolutionStrategy, number>,
        averageResolutionTime: 0,
      };

      // Calculate statistics
      let totalResolutionTime = 0;
      let resolvedCount = 0;

      for (const conflict of conflicts) {
        // Count by type
        stats.byType[conflict.type as ConflictType] = 
          (stats.byType[conflict.type as ConflictType] || 0) + 1;

        // Count by severity
        stats.bySeverity[conflict.severity as ConflictSeverity] = 
          (stats.bySeverity[conflict.severity as ConflictSeverity] || 0) + 1;

        // Count by status
        stats.byStatus[conflict.status as ConflictStatus] = 
          (stats.byStatus[conflict.status as ConflictStatus] || 0) + 1;

        // Count by strategy and calculate resolution time
        if (conflict.resolution) {
          const resolution = conflict.resolution as any;
          stats.byStrategy[resolution.strategy] = 
            (stats.byStrategy[resolution.strategy] || 0) + 1;

          if (resolution.resolvedAt && conflict.detectedAt) {
            const resolutionTime = 
              new Date(resolution.resolvedAt).getTime() - 
              new Date(conflict.detectedAt).getTime();
            totalResolutionTime += resolutionTime;
            resolvedCount++;
          }
        }
      }

      stats.averageResolutionTime = resolvedCount > 0 
        ? totalResolutionTime / resolvedCount 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting conflict statistics:', error);
      throw new Error(`Failed to get conflict statistics: ${error.message}`);
    }
  }

  /**
   * Check if values have conflict
   */
  private hasConflict(localValue: any, remoteValue: any): boolean {
    // Both undefined or null - no conflict
    if ((localValue === undefined || localValue === null) && 
        (remoteValue === undefined || remoteValue === null)) {
      return false;
    }

    // One is undefined/null, other is not - conflict
    if ((localValue === undefined || localValue === null) !== 
        (remoteValue === undefined || remoteValue === null)) {
      return true;
    }

    // Deep comparison for objects and arrays
    if (typeof localValue === 'object' && typeof remoteValue === 'object') {
      return JSON.stringify(localValue) !== JSON.stringify(remoteValue);
    }

    // Simple comparison for primitives
    return localValue !== remoteValue;
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(localValue: any, remoteValue: any): ConflictType {
    const localExists = localValue !== undefined && localValue !== null;
    const remoteExists = remoteValue !== undefined && remoteValue !== null;

    if (localExists && remoteExists) {
      return ConflictType.UPDATE_UPDATE;
    } else if (localExists && !remoteExists) {
      return ConflictType.UPDATE_DELETE;
    } else if (!localExists && remoteExists) {
      return ConflictType.DELETE_UPDATE;
    } else {
      return ConflictType.FIELD_MISMATCH;
    }
  }

  /**
   * Determine conflict severity
   */
  private determineSeverity(
    field: string,
    sensitiveFields: Set<string>
  ): ConflictSeverity {
    if (sensitiveFields.has(field)) {
      return ConflictSeverity.CRITICAL;
    }

    // Critical fields
    const criticalFields = ['id', 'customerId', 'mrn', 'ssn'];
    if (criticalFields.some(f => field.toLowerCase().includes(f))) {
      return ConflictSeverity.CRITICAL;
    }

    // High priority fields
    const highPriorityFields = ['diagnosis', 'medication', 'allergy', 'procedure'];
    if (highPriorityFields.some(f => field.toLowerCase().includes(f))) {
      return ConflictSeverity.HIGH;
    }

    // Medium priority fields
    const mediumPriorityFields = ['name', 'address', 'phone', 'email'];
    if (mediumPriorityFields.some(f => field.toLowerCase().includes(f))) {
      return ConflictSeverity.MEDIUM;
    }

    return ConflictSeverity.LOW;
  }

  /**
   * Check if conflict is auto-resolvable
   */
  private isAutoResolvable(conflict: DataConflict): boolean {
    // Critical conflicts require manual review
    if (conflict.severity === ConflictSeverity.CRITICAL) {
      return false;
    }

    // Check if strategy is configured
    const strategy = this.resolutionStrategies.get(
      `${conflict.resourceType}-${conflict.field}`
    );

    return strategy !== undefined && strategy !== ConflictResolutionStrategy.MANUAL;
  }

  /**
   * Resolve using last-write-wins strategy
   */
  private resolveLastWriteWins(conflict: DataConflict): any {
    return conflict.localTimestamp > conflict.remoteTimestamp
      ? conflict.localValue
      : conflict.remoteValue;
  }

  /**
   * Resolve using first-write-wins strategy
   */
  private resolveFirstWriteWins(conflict: DataConflict): any {
    return conflict.localTimestamp < conflict.remoteTimestamp
      ? conflict.localValue
      : conflict.remoteValue;
  }

  /**
   * Resolve using merge strategy
   */
  private resolveMerge(
    conflict: DataConflict,
    options?: MergeStrategyOptions
  ): any {
    const { localValue, remoteValue } = conflict;

    // Handle arrays
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      return [...new Set([...localValue, ...remoteValue])];
    }

    // Handle objects
    if (typeof localValue === 'object' && typeof remoteValue === 'object') {
      return { ...remoteValue, ...localValue };
    }

    // Handle primitives with options
    if (options) {
      const field = conflict.field;

      if (options.preferLocal?.includes(field)) {
        return localValue;
      }
      if (options.preferRemote?.includes(field)) {
        return remoteValue;
      }
      if (options.concatenate?.includes(field)) {
        return `${localValue} ${remoteValue}`;
      }
      if (options.average?.includes(field)) {
        return (Number(localValue) + Number(remoteValue)) / 2;
      }
      if (options.max?.includes(field)) {
        return Math.max(Number(localValue), Number(remoteValue));
      }
      if (options.min?.includes(field)) {
        return Math.min(Number(localValue), Number(remoteValue));
      }
      if (options.custom?.[field]) {
        return options.custom[field](localValue, remoteValue);
      }
    }

    // Default: prefer local
    return localValue;
  }

  /**
   * Resolve using custom function
   */
  private resolveCustom(conflict: DataConflict, functionStr: string): any {
    try {
      const func = new Function('conflict', `return ${functionStr};`);
      return func(conflict);
    } catch (error) {
      throw new Error(`Custom resolution function failed: ${error.message}`);
    }
  }

  /**
   * Get configured strategy for resource type and field
   */
  private getConfiguredStrategy(
    resourceType: string,
    field: string
  ): ConflictResolutionStrategy {
    const key = `${resourceType}-${field}`;
    return this.resolutionStrategies.get(key) || ConflictResolutionStrategy.LAST_WRITE_WINS;
  }

  /**
   * Save conflict to database
   */
  private async saveConflict(conflict: DataConflict): Promise<void> {
    await prisma.syncConflict.create({
      data: {
        id: conflict.conflictId,
        type: conflict.type,
        severity: conflict.severity,
        status: conflict.status,
        resourceType: conflict.resourceType,
        resourceId: conflict.resourceId,
        field: conflict.field,
        localValue: conflict.localValue,
        remoteValue: conflict.remoteValue,
        localTimestamp: conflict.localTimestamp,
        remoteTimestamp: conflict.remoteTimestamp,
        localVersion: conflict.localVersion,
        remoteVersion: conflict.remoteVersion,
        detectedAt: conflict.detectedAt,
        detectedBy: conflict.detectedBy,
        metadata: conflict.metadata,
      },
    });
  }

  /**
   * Update conflict resolution
   */
  private async updateConflictResolution(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    await prisma.syncConflict.update({
      where: { id: conflictId },
      data: {
        status: ConflictStatus.RESOLVED,
        resolution: resolution as any,
      },
    });
  }

  /**
   * Initialize default resolution strategies
   */
  private initializeDefaultStrategies(): void {
    // Default strategies for common fields
    this.resolutionStrategies.set('Customer-name', ConflictResolutionStrategy.LAST_WRITE_WINS);
    this.resolutionStrategies.set('Customer-address', ConflictResolutionStrategy.LAST_WRITE_WINS);
    this.resolutionStrategies.set('Customer-phone', ConflictResolutionStrategy.LAST_WRITE_WINS);
    this.resolutionStrategies.set('Observation-value', ConflictResolutionStrategy.LAST_WRITE_WINS);
    this.resolutionStrategies.set('Medication-dosage', ConflictResolutionStrategy.MANUAL);
    this.resolutionStrategies.set('Allergy-severity', ConflictResolutionStrategy.MANUAL);
  }

  /**
   * Configure resolution strategy
   */
  configureStrategy(
    resourceType: string,
    field: string,
    strategy: ConflictResolutionStrategy
  ): void {
    const key = `${resourceType}-${field}`;
    this.resolutionStrategies.set(key, strategy);
  }

  /**
   * Register custom resolver
   */
  registerCustomResolver(
    name: string,
    resolver: (conflict: DataConflict) => any
  ): void {
    this.customResolvers.set(name, resolver);
  }
}

// Export singleton instance
export const conflictResolutionService = new ConflictResolutionService();