/**
 * Customer Types and Interfaces
 * 
 * Shared types for customer search and management components
 */

export interface Customer {
  id: string;
  ehrId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  lastSyncedAt?: string;
  syncStatus?: SyncStatus;
  provider?: string;
}

export type SyncStatus = 
  | 'NEVER_SYNCED'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED'
  | 'PARTIAL';

export interface PatientSearchCriteria {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  mrn?: string;
  gender?: string;
}

export interface PatientSearchFilters extends PatientSearchCriteria {
  syncStatus?: SyncStatus;
  provider?: string;
  lastSyncedAfter?: string;
  lastSyncedBefore?: string;
}

export interface CustomerSearchResult {
  customers: Customer[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PatientSyncHistory {
  id: string;
  customerId: string;
  syncedAt: string;
  status: SyncStatus;
  recordsSynced: number;
  errors?: string[];
  duration?: number;
  syncedBy: string;
}

export interface PatientSyncRequest {
  customerId: string;
  syncTypes?: Array<'demographics' | 'encounters' | 'medications' | 'labs' | 'allergies' | 'vitals'>;
  force?: boolean;
}

export interface PatientSyncResponse {
  success: boolean;
  message: string;
  data?: {
    customerId: string;
    syncedAt: string;
    recordsSynced: number;
    status: SyncStatus;
  };
  error?: string;
}

export interface BulkSyncRequest {
  customerIds: string[];
  syncTypes?: Array<'demographics' | 'encounters' | 'medications' | 'labs' | 'allergies' | 'vitals'>;
  force?: boolean;
}

export interface BulkSyncResponse {
  success: boolean;
  message: string;
  data?: {
    totalPatients: number;
    successCount: number;
    failureCount: number;
    results: Array<{
      customerId: string;
      status: 'success' | 'failed';
      error?: string;
    }>;
  };
  error?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: PatientSearchFilters;
  createdAt: string;
  lastUsedAt?: string;
  useCount: number;
}

export interface SearchHistory {
  id: string;
  criteria: PatientSearchFilters;
  resultsCount: number;
  searchedAt: string;
}

// Sort options
export type PatientSortField = 
  | 'lastName'
  | 'firstName'
  | 'dateOfBirth'
  | 'mrn'
  | 'lastSyncedAt';

export type SortDirection = 'asc' | 'desc';

export interface PatientSortOptions {
  field: PatientSortField;
  direction: SortDirection;
}

// Pagination
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Complete search request
export interface PatientSearchRequest {
  criteria: PatientSearchFilters;
  sort?: PatientSortOptions;
  pagination?: PaginationOptions;
}