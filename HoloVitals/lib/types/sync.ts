/**
 * Sync Types and Interfaces
 * 
 * Shared types for data synchronization components
 */

export type SyncStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIAL'
  | 'CANCELLED';

export type SyncType = 
  | 'MANUAL'
  | 'SCHEDULED'
  | 'AUTOMATIC'
  | 'BULK';

export type DataType = 
  | 'DEMOGRAPHICS'
  | 'ENCOUNTERS'
  | 'MEDICATIONS'
  | 'LABS'
  | 'ALLERGIES'
  | 'VITALS'
  | 'IMMUNIZATIONS'
  | 'PROCEDURES'
  | 'ALL';

export interface SyncOperation {
  id: string;
  customerId: string;
  customerName?: string;
  ehrProvider: string;
  status: SyncStatus;
  syncType: SyncType;
  dataTypes: DataType[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors?: SyncError[];
  progress?: number; // 0-100
  initiatedBy: string;
}

export interface SyncError {
  id: string;
  syncId: string;
  errorType: string;
  errorMessage: string;
  dataType?: DataType;
  recordId?: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
  resolution?: string;
}

export interface SyncStatistics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  partialSyncs: number;
  activeSyncs: number;
  successRate: number;
  averageDuration: number;
  totalRecordsProcessed: number;
  lastSyncAt?: string;
}

export interface ProviderStatistics {
  provider: string;
  totalSyncs: number;
  successRate: number;
  averageDuration: number;
  lastSyncAt?: string;
  activeConnections: number;
}

export interface SyncTrend {
  date: string;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
}

export interface SyncSchedule {
  id: string;
  customerId?: string;
  providerId?: string;
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  dataTypes: DataType[];
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  createdBy: string;
  createdAt: string;
}

export interface SyncFilters {
  status?: SyncStatus[];
  provider?: string[];
  syncType?: SyncType[];
  dataType?: DataType[];
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  initiatedBy?: string;
}

export interface SyncHistoryRequest {
  filters?: SyncFilters;
  sortBy?: 'startedAt' | 'duration' | 'recordsProcessed' | 'status';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SyncHistoryResponse {
  syncs: SyncOperation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ManualSyncRequest {
  customerIds: string[];
  dataTypes?: DataType[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export interface ManualSyncResponse {
  success: boolean;
  message: string;
  syncIds: string[];
  queuePosition?: number;
}

export interface SyncQueueItem {
  id: string;
  customerId: string;
  customerName?: string;
  dataTypes: DataType[];
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  queuedAt: string;
  estimatedStartTime?: string;
  position: number;
}

export interface SyncQueue {
  items: SyncQueueItem[];
  totalItems: number;
  processingCapacity: number;
  averageWaitTime: number;
}

export interface RetryRequest {
  syncIds: string[];
  dataTypes?: DataType[];
}

export interface RetryResponse {
  success: boolean;
  message: string;
  retriedSyncs: number;
  failedRetries: number;
}

// Dashboard-specific types
export interface DashboardMetrics {
  overview: SyncStatistics;
  providerStats: ProviderStatistics[];
  recentSyncs: SyncOperation[];
  activeSyncs: SyncOperation[];
  recentErrors: SyncError[];
  trends: SyncTrend[];
  queue: SyncQueue;
}

export interface SyncNotification {
  id: string;
  type: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  syncId?: string;
  timestamp: string;
  read: boolean;
}