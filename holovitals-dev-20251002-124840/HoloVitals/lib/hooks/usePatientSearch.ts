/**
 * Patient Search Hook
 * 
 * Custom hook for managing patient search state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Patient,
  PatientSearchFilters,
  PatientSearchResult,
  PatientSortOptions,
  PaginationOptions,
  SavedSearch,
  SearchHistory,
} from '@/lib/types/patient';

interface UsePatientSearchOptions {
  initialFilters?: PatientSearchFilters;
  initialSort?: PatientSortOptions;
  initialPageSize?: number;
  autoSearch?: boolean;
}

interface UsePatientSearchReturn {
  // State
  patients: Patient[];
  filters: PatientSearchFilters;
  sort: PatientSortOptions;
  pagination: PaginationOptions;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  selectedPatients: Set<string>;
  savedSearches: SavedSearch[];
  searchHistory: SearchHistory[];
  
  // Actions
  search: () => Promise<void>;
  updateFilters: (filters: Partial<PatientSearchFilters>) => void;
  clearFilters: () => void;
  updateSort: (sort: PatientSortOptions) => void;
  goToPage: (page: number) => void;
  changePageSize: (pageSize: number) => void;
  selectPatient: (patientId: string) => void;
  deselectPatient: (patientId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  togglePatientSelection: (patientId: string) => void;
  saveSearch: (name: string) => Promise<void>;
  loadSavedSearch: (searchId: string) => void;
  deleteSavedSearch: (searchId: string) => Promise<void>;
  clearSearchHistory: () => void;
}

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT: PatientSortOptions = {
  field: 'lastName',
  direction: 'asc',
};

export function usePatientSearch(
  options: UsePatientSearchOptions = {}
): UsePatientSearchReturn {
  const {
    initialFilters = {},
    initialSort = DEFAULT_SORT,
    initialPageSize = DEFAULT_PAGE_SIZE,
    autoSearch = false,
  } = options;

  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filters, setFilters] = useState<PatientSearchFilters>(initialFilters);
  const [sort, setSort] = useState<PatientSortOptions>(initialSort);
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: initialPageSize,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // Search function
  const search = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      
      // Add filters
      if (filters.firstName) params.append('firstName', filters.firstName);
      if (filters.lastName) params.append('lastName', filters.lastName);
      if (filters.dateOfBirth) params.append('dateOfBirth', filters.dateOfBirth);
      if (filters.mrn) params.append('mrn', filters.mrn);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.syncStatus) params.append('syncStatus', filters.syncStatus);
      if (filters.provider) params.append('provider', filters.provider);
      
      // Add sort
      params.append('sortField', sort.field);
      params.append('sortDirection', sort.direction);
      
      // Add pagination
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());

      // Make API call
      const response = await fetch(`/api/ehr/patients/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to search patients');
      }

      const result: PatientSearchResult = await response.json();

      // Update state
      setPatients(result.patients);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
      setHasMore(result.hasMore);

      // Add to search history
      const historyEntry: SearchHistory = {
        id: Date.now().toString(),
        criteria: filters,
        resultsCount: result.count,
        searchedAt: new Date().toISOString(),
      };
      setSearchHistory((prev) => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

    } catch (err: any) {
      setError(err.message || 'An error occurred while searching');
      setPatients([]);
      setTotalCount(0);
      setTotalPages(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sort, pagination]);

  // Auto-search on mount if enabled
  useEffect(() => {
    if (autoSearch) {
      search();
    }
  }, [autoSearch]); // Only run on mount

  // Filter actions
  const updateFilters = useCallback((newFilters: Partial<PatientSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Sort actions
  const updateSort = useCallback((newSort: PatientSortOptions) => {
    setSort(newSort);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Pagination actions
  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const changePageSize = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize });
  }, []);

  // Selection actions
  const selectPatient = useCallback((patientId: string) => {
    setSelectedPatients((prev) => new Set(prev).add(patientId));
  }, []);

  const deselectPatient = useCallback((patientId: string) => {
    setSelectedPatients((prev) => {
      const newSet = new Set(prev);
      newSet.delete(patientId);
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPatients(new Set(patients.map((p) => p.id)));
  }, [patients]);

  const deselectAll = useCallback(() => {
    setSelectedPatients(new Set());
  }, []);

  const togglePatientSelection = useCallback((patientId: string) => {
    setSelectedPatients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  }, []);

  // Saved search actions
  const saveSearch = useCallback(async (name: string) => {
    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      criteria: filters,
      createdAt: new Date().toISOString(),
      useCount: 0,
    };
    setSavedSearches((prev) => [savedSearch, ...prev]);
    
    // TODO: Persist to backend
  }, [filters]);

  const loadSavedSearch = useCallback((searchId: string) => {
    const saved = savedSearches.find((s) => s.id === searchId);
    if (saved) {
      setFilters(saved.criteria);
      setPagination((prev) => ({ ...prev, page: 1 }));
      
      // Update use count
      setSavedSearches((prev) =>
        prev.map((s) =>
          s.id === searchId
            ? { ...s, useCount: s.useCount + 1, lastUsedAt: new Date().toISOString() }
            : s
        )
      );
    }
  }, [savedSearches]);

  const deleteSavedSearch = useCallback(async (searchId: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
    // TODO: Delete from backend
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    // State
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
    
    // Actions
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
  };
}