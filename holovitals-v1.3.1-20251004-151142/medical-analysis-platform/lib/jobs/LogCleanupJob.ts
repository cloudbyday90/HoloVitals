/**
 * Log Cleanup Job
 * Scheduled job to clean up old logs and purge duplicates
 */

import { enhancedErrorLogger } from '../errors/EnhancedErrorLogger';
import { logRotationService } from '../logging/LogRotationService';
import cron from 'node-cron';

// ============================================================================
// LOG CLEANUP JOB
// ============================================================================

export class LogCleanupJob {
  private static instance: LogCleanupJob;
  private cleanupTask: cron.ScheduledTask | null = null;
  private dedupTask: cron.ScheduledTask | null = null;

  private constructor() {}

  public static getInstance(): LogCleanupJob {
    if (!LogCleanupJob.instance) {
      LogCleanupJob.instance = new LogCleanupJob();
    }
    return LogCleanupJob.instance;
  }

  /**
   * Start scheduled cleanup jobs
   */
  public start(): void {
    // Daily cleanup at 2 AM
    this.cleanupTask = cron.schedule('0 2 * * *', async () => {
      console.log('🧹 Starting scheduled log cleanup...');
      await this.runCleanup();
    });

    // Deduplication every 5 minutes
    this.dedupTask = cron.schedule('*/5 * * * *', async () => {
      console.log('🔄 Starting error deduplication...');
      await this.runDeduplication();
    });

    console.log('✅ Log cleanup jobs scheduled');
    console.log('   - Daily cleanup: 2:00 AM');
    console.log('   - Deduplication: Every 5 minutes');
  }

  /**
   * Stop scheduled cleanup jobs
   */
  public stop(): void {
    if (this.cleanupTask) {
      this.cleanupTask.stop();
      this.cleanupTask = null;
    }
    if (this.dedupTask) {
      this.dedupTask.stop();
      this.dedupTask = null;
    }
    console.log('⏹️  Log cleanup jobs stopped');
  }

  /**
   * Run full cleanup process
   */
  public async runCleanup(): Promise<{
    errorLogsDeleted: { critical: number; high: number; medium: number; low: number };
    logFilesDeleted: number;
    duplicatesPurged: number;
  }> {
    const startTime = Date.now();
    console.log('🧹 Starting log cleanup process...');

    try {
      // 1. Clean up old error logs from database
      console.log('📊 Cleaning up old error logs...');
      const errorLogsDeleted = await enhancedErrorLogger.cleanupOldLogs();

      // 2. Clean up old log files
      console.log('📁 Cleaning up old log files...');
      await logRotationService.cleanupByAge();
      
      // Get log stats to report
      const logStats = await logRotationService.getLogStats();

      // 3. Purge duplicate errors (older than 24 hours)
      console.log('🔄 Purging duplicate error entries...');
      const duplicatesPurged = await enhancedErrorLogger.purgeDuplicates(24);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Log cleanup completed in ${duration}s`);
      console.log('   Results:');
      console.log(`   - Error logs deleted: ${JSON.stringify(errorLogsDeleted)}`);
      console.log(`   - Archive count: ${logStats.archiveCount}`);
      console.log(`   - Duplicates purged: ${duplicatesPurged}`);

      return {
        errorLogsDeleted,
        logFilesDeleted: logStats.archiveCount,
        duplicatesPurged,
      };
    } catch (error) {
      console.error('❌ Error during log cleanup:', error);
      throw error;
    }
  }

  /**
   * Run deduplication process
   */
  public async runDeduplication(): Promise<number> {
    try {
      // Purge duplicates older than 1 hour
      const purged = await enhancedErrorLogger.purgeDuplicates(1);
      
      if (purged > 0) {
        console.log(`✅ Purged ${purged} duplicate error entries`);
      }
      
      return purged;
    } catch (error) {
      console.error('❌ Error during deduplication:', error);
      return 0;
    }
  }

  /**
   * Get cleanup statistics
   */
  public async getCleanupStats(): Promise<{
    nextCleanup: Date | null;
    nextDedup: Date | null;
    logStats: Awaited<ReturnType<typeof logRotationService.getLogStats>>;
    errorStats: Awaited<ReturnType<typeof enhancedErrorLogger.getErrorStats>>;
  }> {
    const logStats = await logRotationService.getLogStats();
    const errorStats = await enhancedErrorLogger.getErrorStats(24);

    return {
      nextCleanup: this.cleanupTask ? this.getNextRunTime(this.cleanupTask) : null,
      nextDedup: this.dedupTask ? this.getNextRunTime(this.dedupTask) : null,
      logStats,
      errorStats,
    };
  }

  /**
   * Get next run time for a cron task
   */
  private getNextRunTime(task: cron.ScheduledTask): Date | null {
    try {
      // This is a simplified version - actual implementation would use the cron schedule
      // For now, return null as node-cron doesn't expose next run time directly
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Manually trigger cleanup
   */
  public async manualCleanup(): Promise<void> {
    console.log('🧹 Manual cleanup triggered');
    await this.runCleanup();
  }

  /**
   * Manually trigger deduplication
   */
  public async manualDedup(): Promise<void> {
    console.log('🔄 Manual deduplication triggered');
    await this.runDeduplication();
  }
}

// Export singleton instance
export const logCleanupJob = LogCleanupJob.getInstance();