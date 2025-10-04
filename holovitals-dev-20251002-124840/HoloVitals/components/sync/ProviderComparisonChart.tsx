/**
 * Provider Comparison Chart Component
 * 
 * Displays provider statistics in bar chart format
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProviderStatistics } from '@/lib/types/sync';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, Clock } from 'lucide-react';

interface ProviderComparisonChartProps {
  providers: ProviderStatistics[];
  isLoading?: boolean;
}

export function ProviderComparisonChart({ providers, isLoading }: ProviderComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider Comparison</CardTitle>
          <CardDescription>Performance by EHR provider</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (providers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider Comparison</CardTitle>
          <CardDescription>Performance by EHR provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No provider data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort providers by total syncs
  const sortedProviders = [...providers].sort((a, b) => b.totalSyncs - a.totalSyncs);
  const maxSyncs = Math.max(...sortedProviders.map(p => p.totalSyncs));

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'bg-green-500';
    if (rate >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Comparison</CardTitle>
        <CardDescription>Performance by EHR provider</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedProviders.map((provider) => {
            const barWidth = (provider.totalSyncs / maxSyncs) * 100;
            const successRateColor = getSuccessRateColor(provider.successRate);

            return (
              <div key={provider.provider} className="space-y-2">
                {/* Provider Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.provider}</span>
                    <Badge variant="outline" className="text-xs">
                      {provider.activeConnections} active
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>{provider.totalSyncs}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{provider.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(provider.averageDuration)}</span>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  >
                    <div className="flex items-center justify-end h-full pr-2">
                      <span className="text-xs font-medium text-primary-foreground">
                        {provider.totalSyncs}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Success Rate Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20">Success Rate</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${successRateColor} transition-all duration-500`}
                      style={{ width: `${provider.successRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-12 text-right">
                    {provider.successRate.toFixed(1)}%
                  </span>
                </div>

                {/* Last Sync */}
                {provider.lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {new Date(provider.lastSyncAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{providers.length}</p>
            <p className="text-xs text-muted-foreground">Providers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {providers.reduce((sum, p) => sum + p.activeConnections, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Active Connections</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {(providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Success Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}