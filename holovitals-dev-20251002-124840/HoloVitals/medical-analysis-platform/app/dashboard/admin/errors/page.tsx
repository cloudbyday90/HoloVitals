/**
 * Error Monitoring Dashboard
 * OWNER/ADMIN only - Monitor system errors and health
 */

'use client';

import { useState, useEffect } from 'react';
import { AdminOnly } from '@/components/ui/RoleGuard';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorStats {
  total: number;
  bySeverity: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  byCode: Record<string, number>;
  byEndpoint: Record<string, number>;
  trend: {
    current: number;
    previous: number;
    change: number;
  };
}

interface ErrorLog {
  id: string;
  severity: string;
  message: string;
  code?: string;
  statusCode?: number;
  endpoint?: string;
  userId?: string;
  timestamp: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ErrorMonitoringPage() {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadErrorData();
    const interval = setInterval(loadErrorData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange, severityFilter]);

  const loadErrorData = async () => {
    try {
      setLoading(true);

      // Load error statistics
      const statsRes = await fetch(`/api/admin/errors/stats?range=${timeRange}`);
      const statsData = await statsRes.json();
      setStats(statsData);

      // Load recent errors
      const errorsRes = await fetch(
        `/api/admin/errors?limit=50&severity=${severityFilter !== 'all' ? severityFilter : ''}`
      );
      const errorsData = await errorsRes.json();
      setRecentErrors(errorsData.errors);
    } catch (error) {
      console.error('Failed to load error data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadErrorData();
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/errors/export?range=${timeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export errors:', error);
    }
  };

  const filteredErrors = recentErrors.filter(error =>
    error.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    error.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    error.endpoint?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminOnly>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Error Monitoring</h1>
            <p className="text-gray-600 mt-1">
              Monitor system errors and health metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Refresh Button */}
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Export Button */}
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Errors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Errors
                </CardTitle>
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                <div className="flex items-center mt-2">
                  {stats.trend.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  )}
                  <span
                    className={`text-sm ${
                      stats.trend.change > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {Math.abs(stats.trend.change)}% vs previous period
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Critical Errors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Critical Errors
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.bySeverity.CRITICAL.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>

            {/* High Severity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  High Severity
                </CardTitle>
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.bySeverity.HIGH.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Security and authorization issues
                </p>
              </CardContent>
            </Card>

            {/* Medium/Low Errors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Medium/Low
                </CardTitle>
                <Info className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {(stats.bySeverity.MEDIUM + stats.bySeverity.LOW).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Expected errors and validation issues
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Distribution Charts */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Errors by Code */}
            <Card>
              <CardHeader>
                <CardTitle>Top Error Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byCode)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([code, count]) => (
                      <div key={code} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{code}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(count / stats.total) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Errors by Endpoint */}
            <Card>
              <CardHeader>
                <CardTitle>Top Error Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byEndpoint)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([endpoint, count]) => (
                      <div key={endpoint} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                          {endpoint}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{
                                width: `${(count / stats.total) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Errors Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Errors</CardTitle>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search errors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Severity Filter */}
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Severity
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Message
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Code
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Endpoint
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredErrors.map((error) => (
                    <tr key={error.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <SeverityBadge severity={error.severity} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-md truncate">
                        {error.message}
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {error.code || 'N/A'}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {error.endpoint || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(error.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredErrors.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">No errors found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    System is running smoothly
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SeverityBadge({ severity }: { severity: string }) {
  const config = {
    CRITICAL: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    HIGH: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    MEDIUM: { color: 'bg-yellow-100 text-yellow-800', icon: Info },
    LOW: { color: 'bg-blue-100 text-blue-800', icon: Info },
  };

  const { color, icon: Icon } = config[severity as keyof typeof config] || config.LOW;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {severity}
    </span>
  );
}