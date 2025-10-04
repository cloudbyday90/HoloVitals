/**
 * Customer Card Component
 * 
 * Displays customer information in a card format for list views
 */

'use client';

import { useState } from 'react';
import { 
  User, 
  Calendar, 
  Hash, 
  Phone, 
  Mail, 
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Customer, SyncStatus } from '@/lib/types/customer';
import { cn } from '@/lib/utils';

interface PatientCardProps {
  customer: Customer;
  isSelected?: boolean;
  onSelect?: (customerId: string) => void;
  onSync?: (customerId: string) => void;
  onViewDetails?: (customerId: string) => void;
  showCheckbox?: boolean;
}

const syncStatusConfig: Record<SyncStatus, { 
  label: string; 
  icon: React.ReactNode; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
}> = {
  NEVER_SYNCED: {
    label: 'Never Synced',
    icon: <AlertCircle className="h-3 w-3" />,
    variant: 'outline',
    color: 'text-muted-foreground',
  },
  SYNCING: {
    label: 'Syncing',
    icon: <RefreshCw className="h-3 w-3 animate-spin" />,
    variant: 'secondary',
    color: 'text-blue-600',
  },
  SYNCED: {
    label: 'Synced',
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: 'default',
    color: 'text-green-600',
  },
  FAILED: {
    label: 'Failed',
    icon: <XCircle className="h-3 w-3" />,
    variant: 'destructive',
    color: 'text-red-600',
  },
  PARTIAL: {
    label: 'Partial',
    icon: <AlertCircle className="h-3 w-3" />,
    variant: 'secondary',
    color: 'text-yellow-600',
  },
};

export function CustomerCard({
  customer,
  isSelected = false,
  onSelect,
  onSync,
  onViewDetails,
  showCheckbox = true,
}: PatientCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncStatus = customer.syncStatus || 'NEVER_SYNCED';
  const statusConfig = syncStatusConfig[syncStatus];

  const handleSync = async () => {
    if (onSync && !isSyncing) {
      setIsSyncing(true);
      try {
        await onSync(customer.id);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-4 hover:shadow-md transition-shadow bg-card',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        {showCheckbox && onSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(customer.id)}
            className="mt-1"
          />
        )}

        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex-1 min-w-0">
          {/* Name and Status */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg font-semibold truncate">
                {customer.lastName}, {customer.firstName}
                {customer.middleName && ` ${customer.middleName}`}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusConfig.variant} className="text-xs">
                  <span className={cn('flex items-center gap-1', statusConfig.color)}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </Badge>
                {customer.provider && (
                  <Badge variant="outline" className="text-xs">
                    {customer.provider}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(customer.id)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View History</DropdownMenuItem>
                <DropdownMenuItem>Export Data</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Customer Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            {/* DOB and Age */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {formatDate(customer.dateOfBirth)} ({getAge(customer.dateOfBirth)} years)
              </span>
            </div>

            {/* MRN */}
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">MRN: {customer.mrn}</span>
            </div>

            {/* Phone */}
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{customer.phone}</span>
              </div>
            )}

            {/* Email */}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}

            {/* Address */}
            {customer.address && (
              <div className="flex items-center gap-2 md:col-span-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {[
                    customer.address.city,
                    customer.address.state,
                    customer.address.zipCode,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}

            {/* Last Synced */}
            {customer.lastSyncedAt && (
              <div className="flex items-center gap-2 md:col-span-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  Last synced: {formatDate(customer.lastSyncedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails?.(customer.id)}
          className="flex-1"
        >
          View Details
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing || syncStatus === 'SYNCING'}
          className="flex-1"
        >
          {isSyncing || syncStatus === 'SYNCING' ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}