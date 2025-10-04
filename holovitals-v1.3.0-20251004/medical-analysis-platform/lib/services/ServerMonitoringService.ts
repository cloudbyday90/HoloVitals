/**
 * Server Monitoring Service
 * Collects and stores server metrics, logs, and health data
 */

import { PrismaClient } from '@prisma/client';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export interface ServerMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
  };
  processes: {
    total: number;
    running: number;
  };
}

export interface ApplicationMetrics {
  timestamp: Date;
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  errors: {
    total: number;
    critical: number;
    warnings: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export class ServerMonitoringService {
  private static instance: ServerMonitoringService;
  private metricsInterval: NodeJS.Timeout | null = null;
  private logWatcher: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): ServerMonitoringService {
    if (!ServerMonitoringService.instance) {
      ServerMonitoringService.instance = new ServerMonitoringService();
    }
    return ServerMonitoringService.instance;
  }

  /**
   * Start monitoring server metrics
   */
  async startMonitoring(intervalMs: number = 60000): Promise<void> {
    // Collect metrics immediately
    await this.collectMetrics();

    // Then collect every interval
    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, intervalMs);

    // Start log watching
    this.startLogWatching();

    console.log('✅ Server monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    if (this.logWatcher) {
      clearInterval(this.logWatcher);
      this.logWatcher = null;
    }
    console.log('⏹️  Server monitoring stopped');
  }

  /**
   * Collect server metrics
   */
  async collectMetrics(): Promise<ServerMetrics> {
    const metrics: ServerMetrics = {
      timestamp: new Date(),
      cpu: await this.getCPUMetrics(),
      memory: this.getMemoryMetrics(),
      disk: await this.getDiskMetrics(),
      network: await this.getNetworkMetrics(),
      processes: await this.getProcessMetrics(),
    };

    // Store in database
    await this.storeMetrics(metrics);

    return metrics;
  }

  /**
   * Get CPU metrics
   */
  private async getCPUMetrics(): Promise<ServerMetrics['cpu']> {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const usage = 100 - (100 * totalIdle / totalTick);

    return {
      usage: Math.round(usage * 100) / 100,
      loadAverage: loadAvg,
      cores: cpus.length,
    };
  }

  /**
   * Get memory metrics
   */
  private getMemoryMetrics(): ServerMetrics['memory'] {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usagePercent = (used / total) * 100;

    return {
      total,
      used,
      free,
      usagePercent: Math.round(usagePercent * 100) / 100,
    };
  }

  /**
   * Get disk metrics
   */
  private async getDiskMetrics(): Promise<ServerMetrics['disk']> {
    try {
      const { stdout } = await execAsync('df -B1 / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      
      const total = parseInt(parts[1]);
      const used = parseInt(parts[2]);
      const free = parseInt(parts[3]);
      const usagePercent = parseFloat(parts[4]);

      return {
        total,
        used,
        free,
        usagePercent,
      };
    } catch (error) {
      console.error('Error getting disk metrics:', error);
      return {
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0,
      };
    }
  }

  /**
   * Get network metrics
   */
  private async getNetworkMetrics(): Promise<ServerMetrics['network']> {
    try {
      const { stdout } = await execAsync('cat /proc/net/dev | grep -E "eth0|ens|enp" | head -1');
      const parts = stdout.trim().split(/\s+/);
      
      return {
        bytesReceived: parseInt(parts[1]) || 0,
        bytesSent: parseInt(parts[9]) || 0,
      };
    } catch (error) {
      return {
        bytesReceived: 0,
        bytesSent: 0,
      };
    }
  }

  /**
   * Get process metrics
   */
  private async getProcessMetrics(): Promise<ServerMetrics['processes']> {
    try {
      const { stdout: totalOut } = await execAsync('ps aux | wc -l');
      const { stdout: runningOut } = await execAsync('ps aux | grep -c " R "');
      
      return {
        total: parseInt(totalOut) - 1, // Subtract header line
        running: parseInt(runningOut) || 0,
      };
    } catch (error) {
      return {
        total: 0,
        running: 0,
      };
    }
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(metrics: ServerMetrics): Promise<void> {
    try {
      await prisma.serverMetrics.create({
        data: {
          timestamp: metrics.timestamp,
          cpuUsage: metrics.cpu.usage,
          cpuLoadAverage: metrics.cpu.loadAverage,
          cpuCores: metrics.cpu.cores,
          memoryTotal: metrics.memory.total,
          memoryUsed: metrics.memory.used,
          memoryFree: metrics.memory.free,
          memoryUsagePercent: metrics.memory.usagePercent,
          diskTotal: metrics.disk.total,
          diskUsed: metrics.disk.used,
          diskFree: metrics.disk.free,
          diskUsagePercent: metrics.disk.usagePercent,
          networkBytesReceived: metrics.network.bytesReceived,
          networkBytesSent: metrics.network.bytesSent,
          processesTotal: metrics.processes.total,
          processesRunning: metrics.processes.running,
        },
      });

      // Clean old metrics (keep last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      await prisma.serverMetrics.deleteMany({
        where: {
          timestamp: {
            lt: sevenDaysAgo,
          },
        },
      });
    } catch (error) {
      console.error('Error storing metrics:', error);
    }
  }

  /**
   * Get recent metrics
   */
  async getRecentMetrics(hours: number = 24): Promise<ServerMetrics[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const records = await prisma.serverMetrics.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return records.map(record => ({
      timestamp: record.timestamp,
      cpu: {
        usage: record.cpuUsage,
        loadAverage: record.cpuLoadAverage as number[],
        cores: record.cpuCores,
      },
      memory: {
        total: record.memoryTotal,
        used: record.memoryUsed,
        free: record.memoryFree,
        usagePercent: record.memoryUsagePercent,
      },
      disk: {
        total: record.diskTotal,
        used: record.diskUsed,
        free: record.diskFree,
        usagePercent: record.diskUsagePercent,
      },
      network: {
        bytesReceived: record.networkBytesReceived,
        bytesSent: record.networkBytesSent,
      },
      processes: {
        total: record.processesTotal,
        running: record.processesRunning,
      },
    }));
  }

  /**
   * Get current server status
   */
  async getCurrentStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: ServerMetrics;
    issues: string[];
  }> {
    const metrics = await this.collectMetrics();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check CPU
    if (metrics.cpu.usage > 90) {
      issues.push('CPU usage critically high (>90%)');
      status = 'critical';
    } else if (metrics.cpu.usage > 70) {
      issues.push('CPU usage high (>70%)');
      if (status === 'healthy') status = 'warning';
    }

    // Check Memory
    if (metrics.memory.usagePercent > 90) {
      issues.push('Memory usage critically high (>90%)');
      status = 'critical';
    } else if (metrics.memory.usagePercent > 80) {
      issues.push('Memory usage high (>80%)');
      if (status === 'healthy') status = 'warning';
    }

    // Check Disk
    if (metrics.disk.usagePercent > 90) {
      issues.push('Disk usage critically high (>90%)');
      status = 'critical';
    } else if (metrics.disk.usagePercent > 80) {
      issues.push('Disk usage high (>80%)');
      if (status === 'healthy') status = 'warning';
    }

    return {
      status,
      metrics,
      issues,
    };
  }

  /**
   * Start watching logs
   */
  private startLogWatching(): void {
    this.logWatcher = setInterval(async () => {
      await this.collectLogs();
    }, 30000); // Every 30 seconds
  }

  /**
   * Collect application logs
   */
  private async collectLogs(): Promise<void> {
    try {
      // Get PM2 logs
      const { stdout } = await execAsync('pm2 logs holovitals --lines 100 --nostream --raw');
      
      // Parse logs and store critical ones
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('ERROR') || line.includes('CRITICAL')) {
          await this.storeLog({
            timestamp: new Date(),
            level: 'error',
            source: 'application',
            message: line,
          });
        }
      }
    } catch (error) {
      console.error('Error collecting logs:', error);
    }
  }

  /**
   * Store log entry
   */
  private async storeLog(log: LogEntry): Promise<void> {
    try {
      await prisma.serverLog.create({
        data: {
          timestamp: log.timestamp,
          level: log.level,
          source: log.source,
          message: log.message,
          metadata: log.metadata as any,
        },
      });

      // Clean old logs (keep last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await prisma.serverLog.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo,
          },
        },
      });
    } catch (error) {
      console.error('Error storing log:', error);
    }
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(
    hours: number = 24,
    level?: 'info' | 'warn' | 'error' | 'debug'
  ): Promise<LogEntry[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const records = await prisma.serverLog.findMany({
      where: {
        timestamp: {
          gte: since,
        },
        ...(level && { level }),
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 1000,
    });

    return records.map(record => ({
      timestamp: record.timestamp,
      level: record.level as LogEntry['level'],
      source: record.source,
      message: record.message,
      metadata: record.metadata as Record<string, unknown> | undefined,
    }));
  }

  /**
   * Get deployment history
   */
  async getDeploymentHistory(limit: number = 20): Promise<any[]> {
    try {
      const deploymentsPath = path.join(process.cwd(), 'deployment-info.json');
      const content = await fs.readFile(deploymentsPath, 'utf-8');
      return [JSON.parse(content)];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStatistics(hours: number = 24): Promise<{
    total: number;
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
    recentErrors: LogEntry[];
  }> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const errors = await prisma.serverLog.findMany({
      where: {
        timestamp: {
          gte: since,
        },
        level: {
          in: ['error', 'warn'],
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const byLevel: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    errors.forEach(error => {
      byLevel[error.level] = (byLevel[error.level] || 0) + 1;
      bySource[error.source] = (bySource[error.source] || 0) + 1;
    });

    return {
      total: errors.length,
      byLevel,
      bySource,
      recentErrors: errors.slice(0, 50).map(record => ({
        timestamp: record.timestamp,
        level: record.level as LogEntry['level'],
        source: record.source,
        message: record.message,
        metadata: record.metadata as Record<string, unknown> | undefined,
      })),
    };
  }

  /**
   * Get system health summary
   */
  async getHealthSummary(): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastDeployment: Date | null;
    activeIssues: number;
    metrics: ServerMetrics;
  }> {
    const status = await this.getCurrentStatus();
    const uptime = os.uptime();
    const deployments = await this.getDeploymentHistory(1);
    const errorStats = await this.getErrorStatistics(1);

    return {
      overall: status.status,
      uptime,
      lastDeployment: deployments[0]?.timestamp || null,
      activeIssues: status.issues.length + errorStats.total,
      metrics: status.metrics,
    };
  }

  /**
   * Check if monitoring is running
   */
  isMonitoring(): boolean {
    return this.metricsInterval !== null;
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isRunning: boolean;
    uptime: number;
    lastCollection: Date | null;
  } {
    return {
      isRunning: this.isMonitoring(),
      uptime: os.uptime(),
      lastCollection: new Date(), // Would track actual last collection time
    };
  }
}

// Export singleton instance
export const serverMonitoring = ServerMonitoringService.getInstance();