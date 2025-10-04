/**
 * Active Syncs List Component
 * 
 * Displays currently running sync operations with progress
 */

'use client';

import { useState } from 'react';
import { 
  RefreshCw, 
  Clock, 
  User, 
  Database,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SyncOperation } from '@/lib/types/sync';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ActiveSyncsListProps {
  syncs: SyncOperation[];
  isLoading?: boolean;
  onCancelSync?: (syncId: string) => void;
  onViewDetails?: (syncId: string) => void;
}

export function ActiveSyncsList({
  syncs,
  isLoading,
  onCancelSync,
  onViewDetails,
}: ActiveSyncsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (syncId: string) => {
    if (onCancelSync) {
      setCancellingId(syncId);
      try {
        await onCancelSync(syncId);
      } finally {
        setCancellingId(null);
      }
    }
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Active Syncs
          </CardTitle>
          <CardDescription>Currently running synchronizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (syncs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Active Syncs
          </CardTitle>
          <CardDescription>Currently running synchronizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No active synchronizations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Active Syncs
          <Badge variant="secondary" className="ml-auto">
            {syncs.length}
          </Badge>
        </CardTitle>
        <CardDescription>Currently running synchronizations</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {syncs.map((sync) => (
              <div
                key={sync.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {sync.patientName || `Patient ${sync.patientId.slice(0, 8)}`}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {sync.ehrProvider}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Database className="h-3 w-3" />
                      <span>{sync.dataTypes.join(', ')}</span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails?.(sync.id)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCancel(sync.id)}
                        disabled={cancellingId === sync.id}
                        className="text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {cancellingId === sync.id ? 'Cancelling...' : 'Cancel Sync'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Progress: {sync.progress || 0}%
                    </span>
                    <span className="text-muted-foreground">
                      {sync.recordsProcessed} records
                    </span>
                  </div>
                  <Progress value={sync.progress || 0} className="h-2" />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(sync.startedAt)}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {sync.syncType}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}