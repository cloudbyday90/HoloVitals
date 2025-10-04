'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  Database,
  Zap,
  TrendingUp,
} from 'lucide-react';

interface SyncJob {
  id: string;
  type: string;
  status: string;
  ehrProvider: string;
  priority: number;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  startTime: string;
  endTime?: string;
  duration?: number;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface SyncStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  averageDuration: number;
}

export default function SyncDashboardPage() {
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      // Fetch sync jobs
      const jobsResponse = await fetch('/api/sync/jobs?limit=20');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setSyncJobs(jobsData.jobs || []);
      }

      // Fetch statistics
      const statsResponse = await fetch('/api/sync/statistics');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSyncStats(statsData);
      }

      // Mock queue stats (would come from Redis in production)
      setQueueStats({
        waiting: 5,
        active: 2,
        completed: 150,
        failed: 3,
        delayed: 1,
      });
    } catch (error) {
      console.error('Error fetching sync data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'PENDING':
      case 'QUEUED':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      COMPLETED: 'default',
      FAILED: 'destructive',
      PROCESSING: 'secondary',
      PENDING: 'outline',
      QUEUED: 'outline',
    };

    return (
      <Badge variant={variants[status.toUpperCase()] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">EHR Sync Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage data synchronization</p>
        </div>
        <Button onClick={fetchData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{syncStats?.totalJobs || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {syncStats?.completedJobs || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{queueStats?.active || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {queueStats?.waiting || 0} waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Records Synced</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {syncStats?.recordsSucceeded?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {syncStats?.recordsFailed || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Avg Duration</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(syncStats?.averageDuration)}
            </div>
            <p className="text-xs text-gray-600 mt-1">per job</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
          <TabsTrigger value="queue">Queue Status</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Sync Jobs</CardTitle>
              <CardDescription className="text-gray-600">
                Latest synchronization jobs across all EHR providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncJobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No sync jobs found</p>
                ) : (
                  syncJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(job.status)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{job.type}</span>
                            <Badge variant="outline" className="text-xs">
                              {job.ehrProvider}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {job.recordsProcessed} records processed •{' '}
                            {formatDuration(job.duration)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(job.status)}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Queue Status</CardTitle>
              <CardDescription className="text-gray-600">
                Real-time status of sync job queues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Waiting</p>
                    <p className="text-sm text-gray-600">Jobs in queue</p>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{queueStats?.waiting || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Active</p>
                    <p className="text-sm text-gray-600">Currently processing</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{queueStats?.active || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Completed</p>
                    <p className="text-sm text-gray-600">Successfully finished</p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{queueStats?.completed || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Failed</p>
                    <p className="text-sm text-gray-600">Requires attention</p>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{queueStats?.failed || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Data Conflicts</CardTitle>
              <CardDescription className="text-gray-600">
                Conflicts detected during synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">No conflicts detected</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}