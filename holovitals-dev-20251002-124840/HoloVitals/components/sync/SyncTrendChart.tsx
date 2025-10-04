/**
 * Sync Trend Chart Component
 * 
 * Displays sync trends over time using line chart
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncTrend } from '@/lib/types/sync';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SyncTrendChartProps {
  trends: SyncTrend[];
  isLoading?: boolean;
}

export function SyncTrendChart({ trends, isLoading }: SyncTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync Trends</CardTitle>
          <CardDescription>Synchronization activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync Trends</CardTitle>
          <CardDescription>Synchronization activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No trend data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend direction
  const firstWeek = trends[0];
  const lastWeek = trends[trends.length - 1];
  const trendDirection = lastWeek.totalSyncs > firstWeek.totalSyncs ? 'up' : 
                        lastWeek.totalSyncs < firstWeek.totalSyncs ? 'down' : 'stable';
  const trendPercentage = firstWeek.totalSyncs > 0 
    ? Math.abs(((lastWeek.totalSyncs - firstWeek.totalSyncs) / firstWeek.totalSyncs) * 100)
    : 0;

  // Find max value for scaling
  const maxValue = Math.max(...trends.map(t => t.totalSyncs));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sync Trends</CardTitle>
            <CardDescription>Synchronization activity over time</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {trendDirection === 'up' && (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">+{trendPercentage.toFixed(1)}%</span>
              </>
            )}
            {trendDirection === 'down' && (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">-{trendPercentage.toFixed(1)}%</span>
              </>
            )}
            {trendDirection === 'stable' && (
              <>
                <Minus className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600 font-medium">Stable</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple SVG Chart */}
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-[250px] relative">
            <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="0"
                  y1={250 - (percent * 2.5)}
                  x2="800"
                  y2={250 - (percent * 2.5)}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Success line */}
              <polyline
                points={trends.map((trend, i) => {
                  const x = (i / (trends.length - 1)) * 800;
                  const y = 250 - ((trend.successfulSyncs / maxValue) * 230);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Failed line */}
              <polyline
                points={trends.map((trend, i) => {
                  const x = (i / (trends.length - 1)) * 800;
                  const y = 250 - ((trend.failedSyncs / maxValue) * 230);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {trends.map((trend, i) => {
                const x = (i / (trends.length - 1)) * 800;
                const successY = 250 - ((trend.successfulSyncs / maxValue) * 230);
                const failedY = 250 - ((trend.failedSyncs / maxValue) * 230);
                return (
                  <g key={i}>
                    <circle cx={x} cy={successY} r="4" fill="#10b981" />
                    <circle cx={x} cy={failedY} r="4" fill="#ef4444" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {trends.map((trend, i) => {
              if (i % Math.ceil(trends.length / 7) === 0 || i === trends.length - 1) {
                return (
                  <span key={i}>
                    {new Date(trend.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                );
              }
              return null;
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <span className="text-sm text-muted-foreground">Successful</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600" />
              <span className="text-sm text-muted-foreground">Failed</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{trends.reduce((sum, t) => sum + t.totalSyncs, 0)}</p>
              <p className="text-xs text-muted-foreground">Total Syncs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {trends.reduce((sum, t) => sum + t.successfulSyncs, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {trends.reduce((sum, t) => sum + t.failedSyncs, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}