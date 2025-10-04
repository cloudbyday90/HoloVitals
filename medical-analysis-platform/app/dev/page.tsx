'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  Activity,
  Database,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';

export default function DevDashboard() {
  // Mock data - will be replaced with real API calls
  const stats = {
    totalErrors: 23,
    criticalErrors: 3,
    apiRequests: 45234,
    avgResponseTime: 245,
    databaseQueries: 12456,
    slowQueries: 8,
    uptime: 99.8,
    activeConnections: 42,
  };

  const recentErrors = [
    { id: 1, message: 'Database connection timeout', severity: 'critical', time: '2 min ago', count: 3 },
    { id: 2, message: 'API rate limit exceeded', severity: 'warning', time: '15 min ago', count: 12 },
    { id: 3, message: 'Invalid JWT token', severity: 'error', time: '23 min ago', count: 5 },
    { id: 4, message: 'File upload failed', severity: 'error', time: '1 hour ago', count: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Developer Dashboard</h2>
        <p className="text-gray-600 mt-1">System monitoring and development tools</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Errors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Errors (24h)
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalErrors}</div>
            <p className="text-xs text-red-600 mt-1">
              {stats.criticalErrors} critical
            </p>
          </CardContent>
        </Card>

        {/* API Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              API Requests (24h)
            </CardTitle>
            <Activity className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.apiRequests.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              Avg: {stats.avgResponseTime}ms
            </p>
          </CardContent>
        </Card>

        {/* Database Queries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              DB Queries (24h)
            </CardTitle>
            <Database className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.databaseQueries.toLocaleString()}</div>
            <p className="text-xs text-orange-600 mt-1">
              {stats.slowQueries} slow queries
            </p>
          </CardContent>
        </Card>

        {/* System Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              System Uptime
            </CardTitle>
            <Zap className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.uptime}%</div>
            <p className="text-xs text-green-600 mt-1">
              {stats.activeConnections} active connections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors & Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Errors</CardTitle>
            <CardDescription>Latest system errors and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentErrors.map((error) => (
                <div key={error.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    {error.severity === 'critical' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : error.severity === 'warning' ? (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{error.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-600">{error.time}</p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-600">{error.count} occurrences</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Performance Metrics</CardTitle>
            <CardDescription>System performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Avg Response Time</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.avgResponseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Success Rate</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">99.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700">DB Connection Pool</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">42/100</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-700">CPU Usage</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">34%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Memory Usage</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">2.4 GB / 8 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}