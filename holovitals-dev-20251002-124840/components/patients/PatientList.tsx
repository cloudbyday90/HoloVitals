/**
 * Patient List Component
 * 
 * Displays a list of patients with pagination and sorting
 */

'use client';

import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PatientCard } from './PatientCard';
import { Patient, PatientSortOptions, PatientSortField, SortDirection } from '@/lib/types/patient';
import { Skeleton } from '@/components/ui/skeleton';

interface PatientListProps {
  patients: Patient[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  isLoading?: boolean;
  selectedPatients: Set<string>;
  sort: PatientSortOptions;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sort: PatientSortOptions) => void;
  onSelectPatient: (patientId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSyncPatient: (patientId: string) => void;
  onBulkSync?: () => void;
  onViewDetails: (patientId: string) => void;
}

const sortFieldLabels: Record<PatientSortField, string> = {
  lastName: 'Last Name',
  firstName: 'First Name',
  dateOfBirth: 'Date of Birth',
  mrn: 'MRN',
  lastSyncedAt: 'Last Synced',
};

export function PatientList({
  patients,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  hasMore,
  isLoading = false,
  selectedPatients,
  sort,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSelectPatient,
  onSelectAll,
  onDeselectAll,
  onSyncPatient,
  onBulkSync,
  onViewDetails,
}: PatientListProps) {
  const allSelected = patients.length > 0 && patients.every((p) => selectedPatients.has(p.id));
  const someSelected = patients.some((p) => selectedPatients.has(p.id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleSortFieldChange = (field: PatientSortField) => {
    if (sort.field === field) {
      // Toggle direction
      onSortChange({
        field,
        direction: sort.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      // New field, default to ascending
      onSortChange({ field, direction: 'asc' });
    }
  };

  const getSortIcon = (field: PatientSortField) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sort.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Select All */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedPatients.size > 0 ? (
                <span className="font-medium text-foreground">
                  {selectedPatients.size} selected
                </span>
              ) : (
                'Select all'
              )}
            </span>
          </div>

          {/* Bulk Actions */}
          {selectedPatients.size > 0 && onBulkSync && (
            <Button variant="outline" size="sm" onClick={onBulkSync}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Selected ({selectedPatients.size})
            </Button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select
            value={sort.field}
            onValueChange={(value) => handleSortFieldChange(value as PatientSortField)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortFieldLabels).map(([field, label]) => (
                <SelectItem key={field} value={field}>
                  <div className="flex items-center gap-2">
                    {label}
                    {sort.field === field && getSortIcon(field as PatientSortField)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onSortChange({
                ...sort,
                direction: sort.direction === 'asc' ? 'desc' : 'asc',
              })
            }
          >
            {getSortIcon(sort.field)}
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          Showing {startIndex}-{endIndex} of {totalCount} patients
        </span>
      </div>

      {/* Patient List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No patients found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              isSelected={selectedPatients.has(patient.id)}
              onSelect={onSelectPatient}
              onSync={onSyncPatient}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasMore || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}