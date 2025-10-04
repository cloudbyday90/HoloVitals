import { ErrorLog, ErrorSeverity, ErrorStatus, ErrorGroup, ErrorStats } from '@/lib/types/error-monitoring';

// Mock data generator
function generateMockErrors(): ErrorLog[] {
  const errors: ErrorLog[] = [];
  const errorMessages = [
    'Database connection timeout',
    'API rate limit exceeded',
    'Invalid JWT token',
    'File upload failed',
    'Memory allocation error',
    'Network request failed',
    'Undefined property access',
    'Type mismatch error',
    'Permission denied',
    'Resource not found',
  ];

  const severities = [ErrorSeverity.CRITICAL, ErrorSeverity.HIGH, ErrorSeverity.MEDIUM, ErrorSeverity.LOW];
  const statuses = [ErrorStatus.OPEN, ErrorStatus.IN_PROGRESS, ErrorStatus.RESOLVED];
  const environments = ['development', 'staging', 'production'] as const;
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const oses = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];

  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    errors.push({
      id: `error-${i + 1}`,
      message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      stackTrace: `Error: ${errorMessages[Math.floor(Math.random() * errorMessages.length)]}\n    at Component.render (app.tsx:${Math.floor(Math.random() * 1000)}:${Math.floor(Math.random() * 100)})\n    at processChild (react-dom.js:${Math.floor(Math.random() * 5000)}:${Math.floor(Math.random() * 100)})\n    at reconcileChildren (react-dom.js:${Math.floor(Math.random() * 5000)}:${Math.floor(Math.random() * 100)})`,
      timestamp,
      count: Math.floor(Math.random() * 50) + 1,
      lastOccurrence: new Date(timestamp.getTime() + Math.random() * 24 * 60 * 60 * 1000),
      affectedUsers: Math.floor(Math.random() * 20) + 1,
      environment: environments[Math.floor(Math.random() * environments.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      os: oses[Math.floor(Math.random() * oses.length)],
      url: `/app/page-${Math.floor(Math.random() * 10)}`,
      userId: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
      metadata: {
        component: `Component${Math.floor(Math.random() * 10)}`,
        action: ['click', 'submit', 'load', 'render'][Math.floor(Math.random() * 4)],
      },
    });
  }

  return errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export class ErrorMonitoringService {
  private static errors: ErrorLog[] = generateMockErrors();

  static async getErrors(filters?: {
    severity?: ErrorSeverity;
    status?: ErrorStatus;
    environment?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ErrorLog[]> {
    let filtered = [...this.errors];

    if (filters?.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    if (filters?.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    if (filters?.environment) {
      filtered = filtered.filter(e => e.environment === filters.environment);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.message.toLowerCase().includes(search) ||
        e.stackTrace.toLowerCase().includes(search)
      );
    }

    if (filters?.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
    }

    return filtered;
  }

  static async getErrorById(id: string): Promise<ErrorLog | null> {
    return this.errors.find(e => e.id === id) || null;
  }

  static async getErrorStats(): Promise<ErrorStats> {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    return {
      total: this.errors.length,
      critical: this.errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length,
      high: this.errors.filter(e => e.severity === ErrorSeverity.HIGH).length,
      medium: this.errors.filter(e => e.severity === ErrorSeverity.MEDIUM).length,
      low: this.errors.filter(e => e.severity === ErrorSeverity.LOW).length,
      resolved: this.errors.filter(e => e.status === ErrorStatus.RESOLVED).length,
      open: this.errors.filter(e => e.status === ErrorStatus.OPEN).length,
      last24h: this.errors.filter(e => now - e.timestamp.getTime() < day).length,
      last7d: this.errors.filter(e => now - e.timestamp.getTime() < 7 * day).length,
    };
  }

  static async updateErrorStatus(id: string, status: ErrorStatus): Promise<void> {
    const error = this.errors.find(e => e.id === id);
    if (error) {
      error.status = status;
    }
  }

  static async groupErrors(): Promise<ErrorGroup[]> {
    const groups = new Map<string, ErrorGroup>();

    this.errors.forEach(error => {
      const hash = error.message; // Simple grouping by message
      
      if (!groups.has(hash)) {
        groups.set(hash, {
          id: `group-${groups.size + 1}`,
          errorHash: hash,
          message: error.message,
          severity: error.severity,
          count: 0,
          affectedUsers: 0,
          firstSeen: error.timestamp,
          lastSeen: error.timestamp,
          status: error.status,
          errors: [],
        });
      }

      const group = groups.get(hash)!;
      group.count += error.count;
      group.affectedUsers += error.affectedUsers;
      group.errors.push(error);
      
      if (error.timestamp < group.firstSeen) {
        group.firstSeen = error.timestamp;
      }
      if (error.timestamp > group.lastSeen) {
        group.lastSeen = error.timestamp;
      }
    });

    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }
}