/**
 * Patient Search and Management Page
 * 
 * Main page for searching and managing patients from connected EHR systems
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { PatientList } from '@/components/patients/PatientList';
import { PatientDetailView } from '@/components/patients/PatientDetailView';
import { usePatientSearch } from '@/lib/hooks/usePatientSearch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function PatientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const {
    patients,
    filters,
    sort,
    pagination,
    totalCount,
    totalPages,
    hasMore,
    isLoading,
    error,
    selectedPatients,
    savedSearches,
    searchHistory,
    search,
    updateFilters,
    clearFilters,
    updateSort,
    goToPage,
    changePageSize,
    selectPatient,
    deselectPatient,
    selectAll,
    deselectAll,
    togglePatientSelection,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    clearSearchHistory,
  } = usePatientSearch({
    initialPageSize: 20,
    autoSearch: false,
  });

  const handleViewDetails = (patientId: string) => {
    setSelectedPatientId(patientId);
    setDetailDialogOpen(true);
  };

  const handleSyncPatient = async (patientId: string) => {
    try {
      const response = await fetch(`/api/ehr/patients/${patientId}/sync`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync patient');
      }

      toast({
        title: 'Sync Started',
        description: 'Patient data synchronization has been initiated.',
      });

      // Refresh the patient list
      await search();
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync patient data',
        variant: 'destructive',
      });
    }
  };

  const handleBulkSync = async () => {
    try {
      const patientIds = Array.from(selectedPatients);
      
      const response = await fetch('/api/ehr/patients/bulk-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync patients');
      }

      const result = await response.json();

      toast({
        title: 'Bulk Sync Started',
        description: `Syncing ${patientIds.length} patients...`,
      });

      // Clear selection and refresh
      deselectAll();
      await search();
    } catch (error: any) {
      toast({
        title: 'Bulk Sync Failed',
        description: error.message || 'Failed to sync patients',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      const patientIds = selectedPatients.size > 0 
        ? Array.from(selectedPatients)
        : patients.map(p => p.id);

      // TODO: Implement export functionality
      toast({
        title: 'Export Started',
        description: `Exporting ${patientIds.length} patients...`,
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export patients',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Patient Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Search and manage patients from connected EHR systems
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => router.push('/settings/ehr')}>
            <Settings className="h-4 w-4 mr-2" />
            EHR Settings
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Search Component */}
      <PatientSearch
        filters={filters}
        onFiltersChange={updateFilters}
        onSearch={search}
        onClearFilters={clearFilters}
        isLoading={isLoading}
        savedSearches={savedSearches}
        searchHistory={searchHistory}
        onSaveSearch={saveSearch}
        onLoadSavedSearch={loadSavedSearch}
        onDeleteSavedSearch={deleteSavedSearch}
      />

      {/* Patient List */}
      <PatientList
        patients={patients}
        totalCount={totalCount}
        currentPage={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={totalPages}
        hasMore={hasMore}
        isLoading={isLoading}
        selectedPatients={selectedPatients}
        sort={sort}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
        onSortChange={updateSort}
        onSelectPatient={togglePatientSelection}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onSyncPatient={handleSyncPatient}
        onBulkSync={handleBulkSync}
        onViewDetails={handleViewDetails}
      />

      {/* Patient Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatientId && (
            <PatientDetailView
              patientId={selectedPatientId}
              onClose={() => setDetailDialogOpen(false)}
              onSync={handleSyncPatient}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}