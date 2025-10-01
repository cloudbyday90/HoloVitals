'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MedicationCard } from '@/components/clinical/MedicationCard';
import { Medication, MedicationStatus } from '@/lib/types/clinical-data';
import { Search, Download, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MedicationsPage() {
  const { data: session } = useSession();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchMedications();
  }, [statusFilter]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/clinical/medications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMedications(data.medications || []);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedications = medications.filter((med) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      med.name.toLowerCase().includes(query) ||
      med.genericName?.toLowerCase().includes(query) ||
      med.purpose?.toLowerCase().includes(query)
    );
  });

  const activeMedications = filteredMedications.filter(
    (med) => med.status === MedicationStatus.ACTIVE
  );
  const inactiveMedications = filteredMedications.filter(
    (med) => med.status !== MedicationStatus.ACTIVE
  );

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export medications');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medications</h1>
          <p className="text-muted-foreground mt-2">
            Manage your current and past medications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeMedications.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({inactiveMedications.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({filteredMedications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeMedications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeMedications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onClick={() => {
                    console.log('View medication:', medication.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold mb-2">No active medications</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  You don't have any active medications at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveMedications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveMedications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onClick={() => {
                    console.log('View medication:', medication.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold mb-2">No inactive medications</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  You don't have any inactive medications.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredMedications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMedications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onClick={() => {
                    console.log('View medication:', medication.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold mb-2">No medications found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Connect your EHR to sync your medication data.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}