'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Zap,
} from 'lucide-react';

interface ServerMetrics {
  timestamp: string;
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

interface ServerStatus {
  status: 'healthy' | 'warning' | 'critical';
  metrics: ServerMetrics;
  issues: string[];
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

export default function ServerMonitoringPage() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [metrics, setMetrics] = useState<ServerMetrics[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = async () => {
    try {
      // Load current status
      const statusRes = await fetch('/api/monitoring/status');
      const statusData = await statusRes.json();
      if (statusData.success) {
        setStatus(statusData.data);
      }

      // Load recent metrics
      const metricsRes = await fetch('/api/monitoring/metrics?hours=24');
      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }

      // Load recent logs
      const logsRes = await fetch('/api/monitoring/logs?hours=24&level=error');
      const logsData = await logsRes.json();
      if (logsData.success) {
        setLogs(logsData.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Server Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time server health and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {status && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(status.status)}
                <div>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Overall server health</CardDescription>
                </div>
              </div>
              <Badge className={getStatusColor(status.status)}>
                {status.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {status.issues.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Active Issues:</p>
                {status.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600">✅ No issues detected</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Cpu className="h-5 w-5 text-blue-600" />
                <Badge variant="outline">{status.metrics.cpu.cores} cores</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {status.metrics.cpu.usage.toFixed(1)}%
                  </span>
                  {status.metrics.cpu.usage > 70 ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">CPU Usage</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      status.metrics.cpu.usage > 90
                        ? 'bg-red-600'
                        : status.metrics.cpu.usage > 70
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${status.metrics.cpu.usage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Load: {status.metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Memory */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Server className="h-5 w-5 text-purple-600" />
                <Badge variant="outline">{formatBytes(status.metrics.memory.total)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {status.metrics.memory.usagePercent.toFixed(1)}%
                  </span>
                  {status.metrics.memory.usagePercent > 80 ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">Memory Usage</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      status.metrics.memory.usagePercent > 90
                        ? 'bg-red-600'
                        : status.metrics.memory.usagePercent > 80
                        ? 'bg-yellow-600'
                        : 'bg-purple-600'
                    }`}
                    style={{ width: `${status.metrics.memory.usagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {formatBytes(status.metrics.memory.used)} / {formatBytes(status.metrics.memory.total)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Disk */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <HardDrive className="h-5 w-5 text-orange-600" />
                <Badge variant="outline">{formatBytes(status.metrics.disk.total)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {status.metrics.disk.usagePercent.toFixed(1)}%
                  </span>
                  {status.metrics.disk.usagePercent > 80 ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">Disk Usage</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      status.metrics.disk.usagePercent > 90
                        ? 'bg-red-600'
                        : status.metrics.disk.usagePercent > 80
                        ? 'bg-yellow-600'
                        : 'bg-orange-600'
                    }`}
                    style={{ width: `${status.metrics.disk.usagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {formatBytes(status.metrics.disk.used)} / {formatBytes(status.metrics.disk.total)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Network */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Network className="h-5 w-5 text-cyan-600" />
                <Badge variant="outline">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatBytes(status.metrics.network.bytesReceived + status.metrics.network.bytesSent)}
                  </span>
                  <Zap className="h-4 w-4 text-cyan-600" />
                </div>
                <p className="text-sm text-gray-600">Network Traffic</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>↓ Received:</span>
                    <span>{formatBytes(status.metrics.network.bytesReceived)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>↑ Sent:</span>
                    <span>{formatBytes(status.metrics.network.bytesSent)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Metrics History</TabsTrigger>
          <TabsTrigger value="logs">Error Logs</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
        </TabsList>

        {/* Metrics History */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Metrics History</CardTitle>
              <CardDescription>Server performance over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length > 0 ? (
                <div className="space-y-6">
                  {/* CPU Chart */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">CPU Usage</h3>
                    <div className="h-32 flex items-end gap-1">
                      {metrics.slice(0, 24).reverse().map((m, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-blue-500 rounded-t"
                          style={{ height: `${m.cpu.usage}%` }}
                          title={`${m.cpu.usage.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Memory Chart */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Memory Usage</h3>
                    <div className="h-32 flex items-end gap-1">
                      {metrics.slice(0, 24).reverse().map((m, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-purple-500 rounded-t"
                          style={{ height: `${m.memory.usagePercent}%` }}
                          title={`${m.memory.usagePercent.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Disk Chart */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Disk Usage</h3>
                    <div className="h-32 flex items-end gap-1">
                      {metrics.slice(0, 24).reverse().map((m, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-orange-500 rounded-t"
                          style={{ height: `${m.disk.usagePercent}%` }}
                          title={`${m.disk.usagePercent.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No metrics data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Error Logs</CardTitle>
              <CardDescription>Last 24 hours of error-level logs</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <Badge variant="destructive" className="text-xs">
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{log.source}</p>
                      <p className="text-sm text-gray-700 mt-1">{log.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No error logs in the last 24 hours</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processes */}
        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Information</CardTitle>
              <CardDescription>Running processes and system load</CardDescription>
            </CardHeader>
            <CardContent>
              {status && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Processes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {status.metrics.processes.total}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Running Processes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {status.metrics.processes.running}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Load Average</p>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-gray-500">1 min</p>
                        <p className="text-lg font-bold text-gray-900">
                          {status.metrics.cpu.loadAverage[0].toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">5 min</p>
                        <p className="text-lg font-bold text-gray-900">
                          {status.metrics.cpu.loadAverage[1].toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">15 min</p>
                        <p className="text-lg font-bold text-gray-900">
                          {status.metrics.cpu.loadAverage[2].toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Access Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>Endpoints for remote monitoring access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
              <p className="text-gray-600 mb-1">Current Status:</p>
              <p className="text-gray-900">GET https://holovitals.net/api/monitoring/status</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
              <p className="text-gray-600 mb-1">Metrics History:</p>
              <p className="text-gray-900">GET https://holovitals.net/api/monitoring/metrics?hours=24</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
              <p className="text-gray-600 mb-1">Error Logs:</p>
              <p className="text-gray-900">GET https://holovitals.net/api/monitoring/logs?hours=24&level=error</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
              <p className="text-gray-600 mb-1">Health Check:</p>
              <p className="text-gray-900">GET https://holovitals.net/api/monitoring/health</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ℹ️ All endpoints require ADMIN authentication except /health
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}