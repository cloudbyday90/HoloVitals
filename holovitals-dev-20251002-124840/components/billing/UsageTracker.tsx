'use client';

import React from 'react';
import { Users, HardDrive, Sparkles, Link } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UsageMetric {
  label: string;
  current: number;
  limit: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

interface UsageTrackerProps {
  usage: {
    patients: number;
    storage: number;
    aiInsights: number;
    ehrConnections: number;
  };
  limits: {
    patients: number;
    storage: number;
    aiInsights: number;
    ehrConnections: number;
  };
}

export function UsageTracker({ usage, limits }: UsageTrackerProps) {
  const metrics: UsageMetric[] = [
    {
      label: 'Patients',
      current: usage.patients,
      limit: limits.patients,
      unit: 'patients',
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-500',
    },
    {
      label: 'Storage',
      current: usage.storage,
      limit: limits.storage,
      unit: 'GB',
      icon: <HardDrive className="h-5 w-5" />,
      color: 'text-green-500',
    },
    {
      label: 'AI Insights',
      current: usage.aiInsights,
      limit: limits.aiInsights,
      unit: 'insights',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'text-purple-500',
    },
    {
      label: 'EHR Connections',
      current: usage.ehrConnections,
      limit: limits.ehrConnections,
      unit: 'connections',
      icon: <Link className="h-5 w-5" />,
      color: 'text-orange-500',
    },
  ];

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'normal';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const percentage = getUsagePercentage(metric.current, metric.limit);
        const status = getUsageStatus(percentage);
        const isUnlimited = metric.limit === -1;

        return (
          <Card key={metric.label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={cn('p-2 rounded-lg bg-muted', metric.color)}>
                  {metric.icon}
                </div>
                {status === 'critical' && (
                  <Badge variant="destructive" className="text-xs">
                    Limit Reached
                  </Badge>
                )}
                {status === 'warning' && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                    Near Limit
                  </Badge>
                )}
              </div>
              <CardTitle className="text-sm font-medium mt-3">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{metric.current.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">
                    {isUnlimited ? 'Unlimited' : `/ ${metric.limit.toLocaleString()}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <>
                    <Progress
                      value={percentage}
                      className={cn(
                        'h-2',
                        status === 'critical' && '[&>div]:bg-destructive',
                        status === 'warning' && '[&>div]:bg-yellow-500'
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% used
                    </p>
                  </>
                )}
                {isUnlimited && (
                  <p className="text-xs text-muted-foreground">No limits on this plan</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}