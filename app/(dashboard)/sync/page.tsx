/**
 * Data Sync Dashboard Page
 * 
 * Main dashboard for monitoring and managing EHR data synchronization
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  RefreshCw, 
  Settings, 
  Download,
  Bell,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SyncOverviewCards } from '@/components/sync/SyncOverviewCards';
import { ActiveSyncsList } from '@/components/sync/ActiveSyncsList';
import { SyncHistoryTable } from '@/components/sync/SyncHistoryTable';
import { ErrorLogViewer } from '@/components/sync/ErrorLogViewer';
import { SyncTrendChart } from '@/components/sync/SyncTrendChart';
import { ProviderComparisonChart } from '@/components/sync/ProviderComparisonChart';
import { SuccessRateChart } from '@/components/sync/SuccessRateChart';
import { useSyncDashboard } from '@/lib/hooks/useSyncDashboard';
import { useToast } from '@/hooks/use-toast';

export default function SyncDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const {
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
  } = useSyncDashboard({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });

  const handleCancelSync = async (syncId: string) => {
    try {
      await cancelSync(syncId);
      toast({
        title: 'Sync Cancelled',
        description: 'The sync operation has been cancelled.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Cancel',
        description: error.message || 'Failed to cancel sync operation',
        variant: 'destructive',
      });
    }
  };

  const handleRetrySync = async (syncId: string) => {
    try {
      await retryFailedSyncs({ syncIds: [syncId] });
      toast({
        title: 'Retry Initiated',
        description: 'The failed sync is being retried.',
      });
    } catch (error: any) {
      toast({
        title: 'Retry Failed',
        description: error.message || 'Failed to retry sync operation',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your sync history is being exported...',
    });
    // TODO: Implement export functionality
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Data Sync Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage EHR data synchronization operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refreshDashboard()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Notifications */}
          <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>
                  Recent sync events and alerts
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No notifications
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.read ? 'bg-muted/50' : 'bg-card'
                          }`}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                {notifications.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearNotifications}
                      className="w-full"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="outline" onClick={() => router.push('/settings/sync')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center justify-between">
          <p className="text-sm">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshDashboard()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Overview Cards */}
      <SyncOverviewCards statistics={metrics?.overview || null} isLoading={isLoading} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActiveSyncsList
              syncs={metrics?.activeSyncs || []}
              isLoading={isLoading}
              onCancelSync={handleCancelSync}
            />
            <ErrorLogViewer
              errors={metrics?.recentErrors || []}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <SyncHistoryTable
            syncs={syncHistory}
            filters={filters}
            isLoading={isLoading}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
            onRetrySync={handleRetrySync}
            onExport={handleExport}
          />
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          <ErrorLogViewer
            errors={metrics?.recentErrors || []}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SyncTrendChart
              trends={metrics?.trends || []}
              isLoading={isLoading}
            />
            <SuccessRateChart
              statistics={metrics?.overview || null}
              isLoading={isLoading}
            />
          </div>
          <ProviderComparisonChart
            providers={metrics?.providerStats || []}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}