/**
 * Patient Search Component
 * 
 * Advanced search interface with filters for finding patients
 */

'use client';

import { useState } from 'react';
import { Search, Filter, X, Save, History, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PatientSearchFilters, SavedSearch, SearchHistory } from '@/lib/types/patient';

interface PatientSearchProps {
  filters: PatientSearchFilters;
  onFiltersChange: (filters: Partial<PatientSearchFilters>) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  savedSearches?: SavedSearch[];
  searchHistory?: SearchHistory[];
  onSaveSearch?: (name: string) => void;
  onLoadSavedSearch?: (searchId: string) => void;
  onDeleteSavedSearch?: (searchId: string) => void;
}

export function PatientSearch({
  filters,
  onFiltersChange,
  onSearch,
  onClearFilters,
  isLoading = false,
  savedSearches = [],
  searchHistory = [],
  onSaveSearch,
  onLoadSavedSearch,
  onDeleteSavedSearch,
}: PatientSearchProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined && value !== '');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim());
      setSaveSearchName('');
      setSaveDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Search Bar */}
      <form onSubmit={handleQuickSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, MRN, or date of birth..."
            value={filters.firstName || filters.lastName || filters.mrn || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Try to determine what type of search this is
              if (/^\d+$/.test(value)) {
                onFiltersChange({ mrn: value, firstName: undefined, lastName: undefined });
              } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                onFiltersChange({ dateOfBirth: value });
              } else {
                onFiltersChange({ firstName: value, mrn: undefined });
              }
            }}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {Object.values(filters).filter(v => v).length}
            </span>
          )}
        </Button>

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Saved
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Saved Searches</h4>
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => onLoadSavedSearch?.(search.id)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{search.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Used {search.useCount} times
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSavedSearch?.(search.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <History className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recent Searches</h4>
                {searchHistory.slice(0, 5).map((history) => (
                  <div
                    key={history.id}
                    className="p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => onFiltersChange(history.criteria)}
                  >
                    <p className="text-sm">
                      {Object.entries(history.criteria)
                        .filter(([_, value]) => value)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {history.resultsCount} results • {new Date(history.searchedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </form>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Advanced Filters</h3>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
              {onSaveSearch && hasActiveFilters && (
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Search
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Search</DialogTitle>
                      <DialogDescription>
                        Give this search a name so you can quickly access it later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="search-name">Search Name</Label>
                        <Input
                          id="search-name"
                          placeholder="e.g., Diabetic Patients"
                          value={saveSearchName}
                          onChange={(e) => setSaveSearchName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={filters.firstName || ''}
                onChange={(e) => onFiltersChange({ firstName: e.target.value })}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={filters.lastName || ''}
                onChange={(e) => onFiltersChange({ lastName: e.target.value })}
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={filters.dateOfBirth || ''}
                onChange={(e) => onFiltersChange({ dateOfBirth: e.target.value })}
              />
            </div>

            {/* MRN */}
            <div className="space-y-2">
              <Label htmlFor="mrn">Medical Record Number</Label>
              <Input
                id="mrn"
                placeholder="Enter MRN"
                value={filters.mrn || ''}
                onChange={(e) => onFiltersChange({ mrn: e.target.value })}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={filters.gender || ''}
                onValueChange={(value) => onFiltersChange({ gender: value })}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sync Status */}
            <div className="space-y-2">
              <Label htmlFor="syncStatus">Sync Status</Label>
              <Select
                value={filters.syncStatus || ''}
                onValueChange={(value) => onFiltersChange({ syncStatus: value as any })}
              >
                <SelectTrigger id="syncStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="NEVER_SYNCED">Never Synced</SelectItem>
                  <SelectItem value="SYNCED">Synced</SelectItem>
                  <SelectItem value="SYNCING">Syncing</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">EHR Provider</Label>
              <Select
                value={filters.provider || ''}
                onValueChange={(value) => onFiltersChange({ provider: value })}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
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
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClearFilters}>
              Clear Filters
            </Button>
            <Button onClick={onSearch} disabled={isLoading}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}