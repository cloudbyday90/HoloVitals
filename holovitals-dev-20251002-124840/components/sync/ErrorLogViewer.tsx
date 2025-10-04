/**
 * Error Log Viewer Component
 * 
 * Displays sync errors with filtering and resolution tracking
 */

'use client';

import { useState } from 'react';
import {
  AlertCircle,
  XCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  Search,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SyncError } from '@/lib/types/sync';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ErrorLogViewerProps {
  errors: SyncError[];
  isLoading?: boolean;
  onMarkResolved?: (errorId: string, resolution: string) => void;
  onViewSync?: (syncId: string) => void;
}

const severityConfig = {
  LOW: {
    icon: <Info className="h-4 w-4" />,
    label: 'Low',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  MEDIUM: {
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  HIGH: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'High',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  CRITICAL: {
    icon: <XCircle className="h-4 w-4" />,
    label: 'Critical',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

export function ErrorLogViewer({
  errors,
  isLoading,
  onMarkResolved,
  onViewSync,
}: ErrorLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [showResolved, setShowResolved] = useState(false);

  const filteredErrors = errors.filter((error) => {
    if (!showResolved && error.resolved) return false;
    if (severityFilter && error.severity !== severityFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        error.errorMessage.toLowerCase().includes(search) ||
        error.errorType.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const unresolvedCount = errors.filter((e) => !e.resolved).length;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Log
          </CardTitle>
          <CardDescription>Sync errors and issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Log
              {unresolvedCount > 0 && (
                <Badge variant="destructive">{unresolvedCount}</Badge>
              )}
            </CardTitle>
            <CardDescription>Sync errors and issues</CardDescription>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All severities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant={showResolved ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? 'Hide' : 'Show'} Resolved
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredErrors.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <p className="text-sm text-muted-foreground">
              {errors.length === 0
                ? 'No errors to display'
                : 'No errors match your filters'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {filteredErrors.map((error, index) => {
                const config = severityConfig[error.severity];
                return (
                  <div key={error.id}>
                    <div
                      className={cn(
                        'border rounded-lg p-4 space-y-3',
                        config.borderColor,
                        config.bgColor
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={config.color}>{config.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={cn('text-xs', config.color)}
                              >
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {error.errorType}
                              </span>
                              {error.resolved && (
                                <Badge variant="default" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium break-words">
                              {error.errorMessage}
                            </p>
                            {error.dataType && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Data Type: {error.dataType}
                              </p>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewSync?.(error.syncId)}>
                              View Sync
                            </DropdownMenuItem>
                            {!error.resolved && onMarkResolved && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const resolution = prompt('Enter resolution notes:');
                                  if (resolution) {
                                    onMarkResolved(error.id, resolution);
                                  }
                                }}
                              >
                                Mark as Resolved
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Resolution */}
                      {error.resolved && error.resolution && (
                        <div className="bg-white/50 rounded p-2 text-xs">
                          <p className="font-medium mb-1">Resolution:</p>
                          <p className="text-muted-foreground">{error.resolution}</p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDateTime(error.timestamp)}</span>
                        {error.recordId && (
                          <span className="font-mono">Record: {error.recordId.slice(0, 8)}</span>
                        )}
                      </div>
                    </div>
                    {index < filteredErrors.length - 1 && <Separator className="my-4" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}