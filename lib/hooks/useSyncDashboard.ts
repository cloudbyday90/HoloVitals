/**
 * Sync Dashboard Hook
 * 
 * Custom hook for managing sync dashboard state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DashboardMetrics,
  SyncOperation,
  SyncFilters,
  SyncHistoryRequest,
  SyncHistoryResponse,
  ManualSyncRequest,
  RetryRequest,
  SyncNotification,
} from '@/lib/types/sync';

interface UseSyncDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseSyncDashboardReturn {
  // State
  metrics: DashboardMetrics | null;
  syncHistory: SyncOperation[];
  filters: SyncFilters;
  isLoading: boolean;
  error: string | null;
  notifications: SyncNotification[];
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  
  // Actions
  refreshDashboard: () => Promise<void>;
  loadSyncHistory: (request?: SyncHistoryRequest) => Promise<void>;
  updateFilters: (filters: Partial<SyncFilters>) => void;
  clearFilters: () => void;
  triggerManualSync: (request: ManualSyncRequest) => Promise<void>;
  retryFailedSyncs: (request: RetryRequest) => Promise<void>;
  cancelSync: (syncId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  goToPage: (page: number) => void;
  changePageSize: (pageSize: number) => void;
}

const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds
const DEFAULT_PAGE_SIZE = 20;

export function useSyncDashboard(
  options: UseSyncDashboardOptions = {}
): UseSyncDashboardReturn {
  const {
    autoRefresh = true,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  } = options;

  // State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncOperation[]>([]);
  const [filters, setFilters] = useState<SyncFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SyncNotification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Refresh dashboard metrics
  const refreshDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ehr/sync/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard metrics');
      }

      const data = await response.json();
      setMetrics(data.data);

      // Check for new notifications
      if (data.data.recentErrors?.length > 0) {
        const newNotifications: SyncNotification[] = data.data.recentErrors
          .slice(0, 5)
          .map((error: any) => ({
            id: error.id,
            type: 'FAILURE' as const,
            title: 'Sync Failed',
            message: error.errorMessage,
            syncId: error.syncId,
            timestamp: error.timestamp,
            read: false,
          }));
        
        setNotifications((prev) => [...newNotifications, ...prev].slice(0, 20));
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load sync history
  const loadSyncHistory = useCallback(async (request?: SyncHistoryRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Add filters
      if (filters.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters.provider?.length) {
        params.append('provider', filters.provider.join(','));
      }
      if (filters.syncType?.length) {
        params.append('syncType', filters.syncType.join(','));
      }
      if (filters.dataType?.length) {
        params.append('dataType', filters.dataType.join(','));
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters.patientId) {
        params.append('patientId', filters.patientId);
      }

      // Add pagination
      params.append('page', (request?.page || currentPage).toString());
      params.append('pageSize', (request?.pageSize || pageSize).toString());

      // Add sorting
      if (request?.sortBy) {
        params.append('sortBy', request.sortBy);
        params.append('sortDirection', request.sortDirection || 'desc');
      }

      const response = await fetch(`/api/ehr/sync/history?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load sync history');
      }

      const data: SyncHistoryResponse = await response.json();
      setSyncHistory(data.syncs);
      setTotalCount(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);

    } catch (err: any) {
      setError(err.message || 'Failed to load sync history');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SyncFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Trigger manual sync
  const triggerManualSync = useCallback(async (request: ManualSyncRequest) => {
    try {
      const response = await fetch('/api/ehr/sync/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger sync');
      }

      const data = await response.json();

      // Add success notification
      const notification: SyncNotification = {
        id: Date.now().toString(),
        type: 'SUCCESS',
        title: 'Sync Started',
        message: `Sync initiated for ${request.patientIds.length} patient(s)`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);

      // Refresh dashboard
      await refreshDashboard();

    } catch (err: any) {
      const notification: SyncNotification = {
        id: Date.now().toString(),
        type: 'FAILURE',
        title: 'Sync Failed',
        message: err.message || 'Failed to start sync',
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
      throw err;
    }
  }, [refreshDashboard]);

  // Retry failed syncs
  const retryFailedSyncs = useCallback(async (request: RetryRequest) => {
    try {
      const response = await fetch('/api/ehr/sync/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to retry syncs');
      }

      const data = await response.json();

      // Add notification
      const notification: SyncNotification = {
        id: Date.now().toString(),
        type: 'INFO',
        title: 'Retry Initiated',
        message: `Retrying ${request.syncIds.length} failed sync(s)`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);

      // Refresh dashboard
      await refreshDashboard();

    } catch (err: any) {
      throw err;
    }
  }, [refreshDashboard]);

  // Cancel sync
  const cancelSync = useCallback(async (syncId: string) => {
    try {
      const response = await fetch(`/api/ehr/sync/${syncId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel sync');
      }

      // Add notification
      const notification: SyncNotification = {
        id: Date.now().toString(),
        type: 'WARNING',
        title: 'Sync Cancelled',
        message: 'Sync operation has been cancelled',
        syncId,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);

      // Refresh dashboard
      await refreshDashboard();

    } catch (err: any) {
      throw err;
    }
  }, [refreshDashboard]);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Pagination
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    // Initial load
    refreshDashboard();
    loadSyncHistory();

    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshDashboard();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Reload history when filters or pagination changes
  useEffect(() => {
    loadSyncHistory();
  }, [filters, currentPage, pageSize]);

  return {
    // State
    metrics,
    syncHistory,
    filters,
    isLoading,
    error,
    notifications,
    currentPage,
    pageSize,
    totalPages,
    totalCount,
    
    // Actions
    refreshDashboard,
    loadSyncHistory,
    updateFilters,
    clearFilters,
    triggerManualSync,
    retryFailedSyncs,
    cancelSync,
    markNotificationRead,
    clearNotifications,
    goToPage,
    changePageSize,
  };
}