'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertCircle,
  XCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import { ErrorMonitoringService } from '@/lib/services/ErrorMonitoringService';
import { ErrorLog, ErrorSeverity, ErrorStatus, ErrorStats } from '@/lib/types/error-monitoring';

export default function DevErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [severityFilter, statusFilter, environmentFilter, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [errorsData, statsData] = await Promise.all([
        ErrorMonitoringService.getErrors({
          severity: severityFilter !== 'all' ? severityFilter as ErrorSeverity : undefined,
          status: statusFilter !== 'all' ? statusFilter as ErrorStatus : undefined,
          environment: environmentFilter !== 'all' ? environmentFilter : undefined,
          search: searchQuery || undefined,
        }),
        ErrorMonitoringService.getErrorStats(),
      ]);
      
      setErrors(errorsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <XCircle className="w-4 h-4 text-red-600" />;
      case ErrorSeverity.HIGH:
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case ErrorSeverity.MEDIUM:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case ErrorSeverity.LOW:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case ErrorSeverity.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ErrorSeverity.LOW:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: ErrorStatus) => {
    switch (status) {
      case ErrorStatus.OPEN:
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case ErrorStatus.IN_PROGRESS:
        return <Clock className="w-4 h-4 text-orange-600" />;
      case ErrorStatus.RESOLVED:
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case ErrorStatus.IGNORED:
        return <X className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Error Monitoring</h2>
          <p className="text-gray-600 mt-1">Track and resolve system errors</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Errors</CardTitle>
              <AlertCircle className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-600 mt-1">{stats.last24h} in last 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Critical</CardTitle>
              <XCircle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.critical}</div>
              <p className="text-xs text-red-600 mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Open</CardTitle>
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.open}</div>
              <p className="text-xs text-gray-600 mt-1">Unresolved issues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Resolved</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.resolved}</div>
              <p className="text-xs text-green-600 mt-1">Fixed issues</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search errors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Severity Filter */}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value={ErrorSeverity.CRITICAL}>Critical</SelectItem>
                <SelectItem value={ErrorSeverity.HIGH}>High</SelectItem>
                <SelectItem value={ErrorSeverity.MEDIUM}>Medium</SelectItem>
                <SelectItem value={ErrorSeverity.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={ErrorStatus.OPEN}>Open</SelectItem>
                <SelectItem value={ErrorStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={ErrorStatus.RESOLVED}>Resolved</SelectItem>
                <SelectItem value={ErrorStatus.IGNORED}>Ignored</SelectItem>
              </SelectContent>
            </Select>

            {/* Environment Filter */}
            <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Error Log</CardTitle>
          <CardDescription>{errors.length} errors found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading errors...</p>
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Errors Found</h3>
              <p className="text-gray-600">Great! No errors match your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedError(error)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(error.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{error.message}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getSeverityColor(error.severity)}`}>
                            {error.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            {getStatusIcon(error.status)}
                            {error.status}
                          </span>
                          <span>{error.environment}</span>
                          <span>{error.count} occurrences</span>
                          <span>{error.affectedUsers} users</span>
                          <span>{formatDate(error.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(selectedError.severity)}
                  <div>
                    <CardTitle className="text-gray-900">{selectedError.message}</CardTitle>
                    <CardDescription>Error ID: {selectedError.id}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedError(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Severity</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedError.severity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedError.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Environment</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedError.environment}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Occurrences</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedError.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Affected Users</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedError.affectedUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">First Seen</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedError.timestamp)}</p>
                </div>
                {selectedError.browser && (
                  <div>
                    <p className="text-sm text-gray-600">Browser</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedError.browser}</p>
                  </div>
                )}
                {selectedError.os && (
                  <div>
                    <p className="text-sm text-gray-600">OS</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedError.os}</p>
                  </div>
                )}
              </div>

              {/* Stack Trace */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Stack Trace</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {selectedError.stackTrace}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    ErrorMonitoringService.updateErrorStatus(selectedError.id, ErrorStatus.IN_PROGRESS);
                    setSelectedError(null);
                    loadData();
                  }}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    ErrorMonitoringService.updateErrorStatus(selectedError.id, ErrorStatus.RESOLVED);
                    setSelectedError(null);
                    loadData();
                  }}
                >
                  Mark Resolved
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    ErrorMonitoringService.updateErrorStatus(selectedError.id, ErrorStatus.IGNORED);
                    setSelectedError(null);
                    loadData();
                  }}
                >
                  Ignore
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}