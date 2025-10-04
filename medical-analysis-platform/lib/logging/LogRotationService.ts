/**
 * Log Rotation Service
 * Manages log file sizes, rotation, and archival
 */

import fs from 'fs/promises';
import path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface LogRotationConfig {
  logDirectory: string;
  maxLogFileSizeMB: number;
  maxTotalLogSizeMB: number;
  rotationThreshold: number; // 0.0 to 1.0 (e.g., 0.8 = 80%)
  retentionDays: number;
  compressionEnabled: boolean;
}

const DEFAULT_CONFIG: LogRotationConfig = {
  logDirectory: '/var/log/holovitals',
  maxLogFileSizeMB: 50,
  maxTotalLogSizeMB: 500,
  rotationThreshold: 0.8,
  retentionDays: 90,
  compressionEnabled: true,
};

// ============================================================================
// LOG ROTATION SERVICE
// ============================================================================

export class LogRotationService {
  private static instance: LogRotationService;
  private config: LogRotationConfig;
  private rotationInterval: NodeJS.Timeout | null = null;

  private constructor(config?: Partial<LogRotationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<LogRotationConfig>): LogRotationService {
    if (!LogRotationService.instance) {
      LogRotationService.instance = new LogRotationService(config);
    }
    return LogRotationService.instance;
  }

  /**
   * Initialize log rotation service
   */
  public async initialize(): Promise<void> {
    // Ensure log directories exist
    await this.ensureDirectories();

    // Check log sizes immediately
    await this.checkAndRotate();

    // Schedule periodic checks (every hour)
    this.rotationInterval = setInterval(async () => {
      await this.checkAndRotate();
    }, 60 * 60 * 1000);

    console.log('✅ Log rotation service initialized');
  }

  /**
   * Stop log rotation service
   */
  public stop(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
    console.log('⏹️  Log rotation service stopped');
  }

  /**
   * Ensure log directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const directories = [
      this.config.logDirectory,
      path.join(this.config.logDirectory, 'archives'),
      path.join(this.config.logDirectory, 'critical'),
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  /**
   * Check log sizes and rotate if necessary
   */
  public async checkAndRotate(): Promise<void> {
    try {
      const currentLogPath = path.join(this.config.logDirectory, 'current.log');
      
      // Check if current log file exists
      try {
        await fs.access(currentLogPath);
      } catch {
        // File doesn't exist, nothing to rotate
        return;
      }

      // Get current log file size
      const stats = await fs.stat(currentLogPath);
      const sizeMB = stats.size / (1024 * 1024);
      const threshold = this.config.maxLogFileSizeMB * this.config.rotationThreshold;

      if (sizeMB >= threshold) {
        console.log(`📊 Current log size: ${sizeMB.toFixed(2)} MB (threshold: ${threshold.toFixed(2)} MB)`);
        await this.rotateLog(currentLogPath);
      }

      // Check total log size and clean up if necessary
      await this.checkTotalSize();
    } catch (error) {
      console.error('Error during log rotation check:', error);
    }
  }

  /**
   * Rotate the current log file
   */
  private async rotateLog(currentLogPath: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const archivePath = path.join(
        this.config.logDirectory,
        'archives',
        `${timestamp}.log`
      );

      console.log(`🔄 Rotating log file to: ${archivePath}`);

      // Move current log to archive
      await fs.rename(currentLogPath, archivePath);

      // Compress the archived log if enabled
      if (this.config.compressionEnabled) {
        await this.compressLog(archivePath);
      }

      console.log('✅ Log rotation completed');
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
  }

  /**
   * Compress a log file
   */
  private async compressLog(logPath: string): Promise<void> {
    try {
      const gzipPath = `${logPath}.gz`;
      
      console.log(`🗜️  Compressing log: ${path.basename(logPath)}`);

      const source = createReadStream(logPath);
      const destination = createWriteStream(gzipPath);
      const gzip = createGzip();

      await pipeline(source, gzip, destination);

      // Delete original uncompressed file
      await fs.unlink(logPath);

      const originalSize = (await fs.stat(gzipPath)).size;
      console.log(`✅ Compression completed: ${path.basename(gzipPath)} (${(originalSize / 1024 / 1024).toFixed(2)} MB)`);
    } catch (error) {
      console.error('Error compressing log file:', error);
    }
  }

  /**
   * Check total log size and clean up old logs if necessary
   */
  private async checkTotalSize(): Promise<void> {
    try {
      const archivesDir = path.join(this.config.logDirectory, 'archives');
      const files = await fs.readdir(archivesDir);

      let totalSize = 0;
      const fileStats: Array<{ name: string; size: number; mtime: Date }> = [];

      for (const file of files) {
        const filePath = path.join(archivesDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileStats.push({
          name: file,
          size: stats.size,
          mtime: stats.mtime,
        });
      }

      const totalSizeMB = totalSize / (1024 * 1024);
      console.log(`📊 Total archive size: ${totalSizeMB.toFixed(2)} MB (limit: ${this.config.maxTotalLogSizeMB} MB)`);

      if (totalSizeMB > this.config.maxTotalLogSizeMB) {
        await this.cleanupOldLogs(fileStats, totalSizeMB);
      }
    } catch (error) {
      console.error('Error checking total log size:', error);
    }
  }

  /**
   * Clean up old log files to stay within size limit
   */
  private async cleanupOldLogs(
    fileStats: Array<{ name: string; size: number; mtime: Date }>,
    currentSizeMB: number
  ): Promise<void> {
    // Sort files by modification time (oldest first)
    fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    const targetSizeMB = this.config.maxTotalLogSizeMB * 0.8; // Clean up to 80% of limit
    let deletedSize = 0;
    let deletedCount = 0;

    for (const file of fileStats) {
      if (currentSizeMB - deletedSize <= targetSizeMB) {
        break;
      }

      const filePath = path.join(this.config.logDirectory, 'archives', file.name);
      
      try {
        await fs.unlink(filePath);
        deletedSize += file.size / (1024 * 1024);
        deletedCount++;
        console.log(`🗑️  Deleted old log: ${file.name}`);
      } catch (error) {
        console.error(`Failed to delete ${file.name}:`, error);
      }
    }

    console.log(`✅ Cleaned up ${deletedCount} old log files (freed ${deletedSize.toFixed(2)} MB)`);
  }

  /**
   * Clean up logs older than retention period
   */
  public async cleanupByAge(): Promise<void> {
    try {
      const archivesDir = path.join(this.config.logDirectory, 'archives');
      const files = await fs.readdir(archivesDir);
      const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(archivesDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          try {
            await fs.unlink(filePath);
            deletedCount++;
            console.log(`🗑️  Deleted expired log: ${file}`);
          } catch (error) {
            console.error(`Failed to delete ${file}:`, error);
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} expired log files`);
      }
    } catch (error) {
      console.error('Error cleaning up logs by age:', error);
    }
  }

  /**
   * Get log statistics
   */
  public async getLogStats(): Promise<{
    currentLogSizeMB: number;
    totalArchiveSizeMB: number;
    archiveCount: number;
    oldestArchive: string | null;
    newestArchive: string | null;
  }> {
    const stats = {
      currentLogSizeMB: 0,
      totalArchiveSizeMB: 0,
      archiveCount: 0,
      oldestArchive: null as string | null,
      newestArchive: null as string | null,
    };

    try {
      // Get current log size
      const currentLogPath = path.join(this.config.logDirectory, 'current.log');
      try {
        const currentStats = await fs.stat(currentLogPath);
        stats.currentLogSizeMB = currentStats.size / (1024 * 1024);
      } catch {
        // Current log doesn't exist
      }

      // Get archive statistics
      const archivesDir = path.join(this.config.logDirectory, 'archives');
      const files = await fs.readdir(archivesDir);
      
      if (files.length > 0) {
        stats.archiveCount = files.length;

        const fileStats: Array<{ name: string; size: number; mtime: Date }> = [];
        
        for (const file of files) {
          const filePath = path.join(archivesDir, file);
          const fileStat = await fs.stat(filePath);
          stats.totalArchiveSizeMB += fileStat.size / (1024 * 1024);
          fileStats.push({
            name: file,
            size: fileStat.size,
            mtime: fileStat.mtime,
          });
        }

        // Sort by modification time
        fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
        stats.oldestArchive = fileStats[0].name;
        stats.newestArchive = fileStats[fileStats.length - 1].name;
      }
    } catch (error) {
      console.error('Error getting log statistics:', error);
    }

    return stats;
  }

  /**
   * Manually trigger log rotation
   */
  public async manualRotate(): Promise<void> {
    const currentLogPath = path.join(this.config.logDirectory, 'current.log');
    await this.rotateLog(currentLogPath);
  }

  /**
   * Get configuration
   */
  public getConfig(): LogRotationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<LogRotationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('✅ Log rotation configuration updated');
  }
}

// Export singleton instance
export const logRotationService = LogRotationService.getInstance();