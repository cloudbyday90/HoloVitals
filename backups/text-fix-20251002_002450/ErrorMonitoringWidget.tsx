/**
 * Error Monitoring Widget
 * Compact widget for dashboard showing error summary
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminOnly } from '@/components/ui/RoleGuard';

interface ErrorStats {
  total: number;
  bySeverity: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  trend: {
    change: number;
  };
}

export function ErrorMonitoringWidget() {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/errors/stats?range=24h');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load error stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminOnly>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Error Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </AdminOnly>
    );
  }

  if (!stats) {
    return null;
  }

  const hasCriticalErrors = stats.bySeverity.CRITICAL > 0;
  const hasHighErrors = stats.bySeverity.HIGH > 0;

  return (
    <AdminOnly>
      <Card className={hasCriticalErrors ? 'border-red-300 bg-red-50' : ''}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Error Monitoring</CardTitle>
          <Link
            href="/dashboard/admin/errors"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Total Errors */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-800">Total errors (24h)</p>
              </div>
              <div className="flex items-center gap-1">
                {stats.trend.change > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">+{stats.trend.change}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">{stats.trend.change}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Severity Breakdown */}
            <div className="space-y-2">
              {/* Critical */}
              {stats.bySeverity.CRITICAL > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-100 rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Critical</span>
                  </div>
                  <span className="text-sm font-bold text-red-900">
                    {stats.bySeverity.CRITICAL}
                  </span>
                </div>
              )}

              {/* High */}
              {stats.bySeverity.HIGH > 0 && (
                <div className="flex items-center justify-between p-2 bg-orange-100 rounded">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">High</span>
                  </div>
                  <span className="text-sm font-bold text-orange-900">
                    {stats.bySeverity.HIGH}
                  </span>
                </div>
              )}

              {/* Medium/Low */}
              {(stats.bySeverity.MEDIUM > 0 || stats.bySeverity.LOW > 0) && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm text-gray-700">Medium/Low</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.bySeverity.MEDIUM + stats.bySeverity.LOW}
                  </span>
                </div>
              )}
            </div>

            {/* Status Message */}
            {hasCriticalErrors ? (
              <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-200 rounded">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    Critical errors detected
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Immediate attention required
                  </p>
                </div>
              </div>
            ) : hasHighErrors ? (
              <div className="flex items-start gap-2 p-3 bg-orange-100 border border-orange-200 rounded">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    High severity errors present
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Review recommended
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-green-600 font-medium">
                  ✓ System running smoothly
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminOnly>
  );
}