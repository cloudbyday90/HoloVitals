/**
 * Customer Search and Management Page
 * 
 * Main page for searching and managing customers from connected EHR systems
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerSearch } from '@/components/customers/CustomerSearch';
import { CustomerList } from '@/components/customers/CustomerList';
import { CustomerDetailView } from '@/components/customers/CustomerDetailView';
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
    customers,
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

  const handleViewDetails = (customerId: string) => {
    setSelectedPatientId(customerId);
    setDetailDialogOpen(true);
  };

  const handleSyncPatient = async (customerId: string) => {
    try {
      const response = await fetch(`/api/ehr/customers/${customerId}/sync`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync customer');
      }

      toast({
        title: 'Sync Started',
        description: 'Customer data synchronization has been initiated.',
      });

      // Refresh the customer list
      await search();
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync customer data',
        variant: 'destructive',
      });
    }
  };

  const handleBulkSync = async () => {
    try {
      const customerIds = Array.from(selectedPatients);
      
      const response = await fetch('/api/ehr/customers/bulk-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync customers');
      }

      const result = await response.json();

      toast({
        title: 'Bulk Sync Started',
        description: `Syncing ${customerIds.length} customers...`,
      });

      // Clear selection and refresh
      deselectAll();
      await search();
    } catch (error: any) {
      toast({
        title: 'Bulk Sync Failed',
        description: error.message || 'Failed to sync customers',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      const customerIds = selectedPatients.size > 0 
        ? Array.from(selectedPatients)
        : customers.map(p => p.id);

      // TODO: Implement export functionality
      toast({
        title: 'Export Started',
        description: `Exporting ${customerIds.length} customers...`,
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export customers',
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
            Customer Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Search and manage customers from connected EHR systems
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
      <CustomerSearch
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

      {/* Customer List */}
      <CustomerList
        customers={customers}
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

      {/* Customer Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedPatientId && (
            <CustomerDetailView
              customerId={selectedPatientId}
              onClose={() => setDetailDialogOpen(false)}
              onSync={handleSyncPatient}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}