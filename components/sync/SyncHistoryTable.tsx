/**
 * Sync History Table Component
 * 
 * Displays sync history with filtering and sorting
 */

'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SyncOperation, SyncStatus, SyncFilters } from '@/lib/types/sync';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SyncHistoryTableProps {
  syncs: SyncOperation[];
  filters: SyncFilters;
  isLoading?: boolean;
  onFiltersChange: (filters: Partial<SyncFilters>) => void;
  onClearFilters: () => void;
  onRetrySync?: (syncId: string) => void;
  onViewDetails?: (syncId: string) => void;
  onExport?: () => void;
}

const statusConfig: Record<SyncStatus, {
  icon: React.ReactNode;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
}> = {
  PENDING: {
    icon: <Clock className="h-3 w-3" />,
    label: 'Pending',
    variant: 'outline',
    color: 'text-gray-600',
  },
  IN_PROGRESS: {
    icon: <RefreshCw className="h-3 w-3 animate-spin" />,
    label: 'In Progress',
    variant: 'secondary',
    color: 'text-blue-600',
  },
  COMPLETED: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Completed',
    variant: 'default',
    color: 'text-green-600',
  },
  FAILED: {
    icon: <XCircle className="h-3 w-3" />,
    label: 'Failed',
    variant: 'destructive',
    color: 'text-red-600',
  },
  PARTIAL: {
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Partial',
    variant: 'secondary',
    color: 'text-yellow-600',
  },
  CANCELLED: {
    icon: <XCircle className="h-3 w-3" />,
    label: 'Cancelled',
    variant: 'outline',
    color: 'text-gray-600',
  },
};

export function SyncHistoryTable({
  syncs,
  filters,
  isLoading,
  onFiltersChange,
  onClearFilters,
  onRetrySync,
  onViewDetails,
  onExport,
}: SyncHistoryTableProps) {
  const [showFilters, setShowFilters] = useState(false);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && (Array.isArray(value) ? value.length > 0 : value !== '')
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Complete history of synchronization operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Complete history of synchronization operations</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length}
                </Badge>
              )}
            </Button>
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status?.[0] || ''}
                onValueChange={(value) =>
                  onFiltersChange({ status: value ? [value as SyncStatus] : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select
                value={filters.provider?.[0] || ''}
                onValueChange={(value) =>
                  onFiltersChange({ provider: value ? [value] : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All providers</SelectItem>
                  <SelectItem value="EPIC">Epic</SelectItem>
                  <SelectItem value="CERNER">Cerner</SelectItem>
                  <SelectItem value="MEDITECH">MEDITECH</SelectItem>
                  <SelectItem value="ATHENAHEALTH">athenahealth</SelectItem>
                  <SelectItem value="ECLINICALWORKS">eClinicalWorks</SelectItem>
                  <SelectItem value="ALLSCRIPTS">Allscripts</SelectItem>
                  <SelectItem value="NEXTGEN">NextGen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Customer ID</label>
              <Input
                placeholder="Search by customer ID"
                value={filters.customerId || ''}
                onChange={(e) => onFiltersChange({ customerId: e.target.value || undefined })}
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {syncs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? 'No syncs match your filters' : 'No sync history available'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncs.map((sync) => {
                  const config = statusConfig[sync.status];
                  return (
                    <TableRow key={sync.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {sync.customerName || `Customer ${sync.customerId.slice(0, 8)}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sync.syncType}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sync.ehrProvider}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1">
                          <span className={config.color}>{config.icon}</span>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{sync.recordsProcessed} total</div>
                          {sync.recordsFailed > 0 && (
                            <div className="text-xs text-red-600">
                              {sync.recordsFailed} failed
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDuration(sync.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDateTime(sync.startedAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
                            {sync.status === 'FAILED' && onRetrySync && (
                              <DropdownMenuItem onClick={() => onRetrySync(sync.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry Sync
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}