export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ErrorStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED',
}

export interface ErrorLog {
  id: string;
  message: string;
  severity: ErrorSeverity;
  status: ErrorStatus;
  stackTrace: string;
  timestamp: Date;
  count: number;
  lastOccurrence: Date;
  affectedUsers: number;
  environment: 'development' | 'staging' | 'production';
  browser?: string;
  os?: string;
  url?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorGroup {
  id: string;
  errorHash: string;
  message: string;
  severity: ErrorSeverity;
  count: number;
  affectedUsers: number;
  firstSeen: Date;
  lastSeen: Date;
  status: ErrorStatus;
  errors: ErrorLog[];
}

export interface ErrorStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  open: number;
  last24h: number;
  last7d: number;
}