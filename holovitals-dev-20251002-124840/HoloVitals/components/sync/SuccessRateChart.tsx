/**
 * Success Rate Chart Component
 * 
 * Displays success/failure distribution in donut chart format
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncStatistics } from '@/lib/types/sync';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface SuccessRateChartProps {
  statistics: SyncStatistics | null;
  isLoading?: boolean;
}

export function SuccessRateChart({ statistics, isLoading }: SuccessRateChartProps) {
  if (isLoading || !statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Success Rate</CardTitle>
          <CardDescription>Sync outcome distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = statistics.totalSyncs;
  const successful = statistics.successfulSyncs;
  const failed = statistics.failedSyncs;
  const partial = statistics.partialSyncs;

  const successPercentage = total > 0 ? (successful / total) * 100 : 0;
  const failedPercentage = total > 0 ? (failed / total) * 100 : 0;
  const partialPercentage = total > 0 ? (partial / total) * 100 : 0;

  // Calculate donut chart segments
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  const strokeWidth = 20;

  const circumference = 2 * Math.PI * radius;
  const successOffset = 0;
  const failedOffset = (successPercentage / 100) * circumference;
  const partialOffset = ((successPercentage + failedPercentage) / 100) * circumference;

  const successLength = (successPercentage / 100) * circumference;
  const failedLength = (failedPercentage / 100) * circumference;
  const partialLength = (partialPercentage / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Success Rate</CardTitle>
        <CardDescription>Sync outcome distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-6">
          {/* Donut Chart */}
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth={strokeWidth}
              />

              {/* Success segment */}
              {successPercentage > 0 && (
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${successLength} ${circumference}`}
                  strokeDashoffset={-successOffset}
                  transform={`rotate(-90 ${centerX} ${centerY})`}
                  strokeLinecap="round"
                />
              )}

              {/* Failed segment */}
              {failedPercentage > 0 && (
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${failedLength} ${circumference}`}
                  strokeDashoffset={-failedOffset}
                  transform={`rotate(-90 ${centerX} ${centerY})`}
                  strokeLinecap="round"
                />
              )}

              {/* Partial segment */}
              {partialPercentage > 0 && (
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${partialLength} ${circumference}`}
                  strokeDashoffset={-partialOffset}
                  transform={`rotate(-90 ${centerX} ${centerY})`}
                  strokeLinecap="round"
                />
              )}

              {/* Center text */}
              <text
                x={centerX}
                y={centerY - 10}
                textAnchor="middle"
                className="text-3xl font-bold fill-current"
              >
                {statistics.successRate.toFixed(1)}%
              </text>
              <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                Success Rate
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Successful</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{successful}</p>
                <p className="text-xs text-muted-foreground">{successPercentage.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{failed}</p>
                <p className="text-xs text-muted-foreground">{failedPercentage.toFixed(1)}%</p>
              </div>
            </div>

            {partial > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Partial</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">{partial}</p>
                  <p className="text-xs text-muted-foreground">{partialPercentage.toFixed(1)}%</p>
                </div>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="w-full pt-4 border-t text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total Syncs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}