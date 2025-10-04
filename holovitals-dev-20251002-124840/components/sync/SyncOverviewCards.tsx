/**
 * Sync Overview Cards Component
 * 
 * Displays key sync statistics in card format
 */

'use client';

import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncStatistics } from '@/lib/types/sync';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SyncOverviewCardsProps {
  statistics: SyncStatistics | null;
  isLoading?: boolean;
}

export function SyncOverviewCards({ statistics, isLoading }: SyncOverviewCardsProps) {
  if (isLoading || !statistics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Syncs',
      value: statistics.totalSyncs.toLocaleString(),
      description: 'All time synchronizations',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Success Rate',
      value: `${statistics.successRate.toFixed(1)}%`,
      description: `${statistics.successfulSyncs} successful`,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: statistics.successRate >= 95 ? 'up' : statistics.successRate >= 80 ? 'stable' : 'down',
    },
    {
      title: 'Active Syncs',
      value: statistics.activeSyncs.toLocaleString(),
      description: 'Currently in progress',
      icon: RefreshCw,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      animate: statistics.activeSyncs > 0,
    },
    {
      title: 'Failed Syncs',
      value: statistics.failedSyncs.toLocaleString(),
      description: statistics.failedSyncs > 0 ? 'Require attention' : 'No failures',
      icon: statistics.failedSyncs > 0 ? XCircle : CheckCircle2,
      color: statistics.failedSyncs > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: statistics.failedSyncs > 0 ? 'bg-red-50' : 'bg-green-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={cn('p-2 rounded-full', card.bgColor)}>
                <Icon 
                  className={cn(
                    'h-4 w-4',
                    card.color,
                    card.animate && 'animate-spin'
                  )} 
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{card.value}</div>
                {card.trend && (
                  <div className={cn(
                    'flex items-center text-xs',
                    card.trend === 'up' && 'text-green-600',
                    card.trend === 'down' && 'text-red-600',
                    card.trend === 'stable' && 'text-gray-600'
                  )}>
                    {card.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {card.trend === 'down' && <AlertCircle className="h-3 w-3 mr-1" />}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}