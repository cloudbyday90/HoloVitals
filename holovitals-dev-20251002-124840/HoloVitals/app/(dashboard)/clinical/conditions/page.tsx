'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConditionCard } from '@/components/clinical/ConditionCard';
import { Condition } from '@/lib/types/clinical-data';
import { Search, Download, Plus, Activity } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ConditionsPage() {
  const { data: session } = useSession();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchConditions();
  }, [statusFilter]);

  const fetchConditions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/clinical/conditions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setConditions(data.conditions || []);
      }
    } catch (error) {
      console.error('Error fetching conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConditions = conditions.filter((condition) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      condition.condition.toLowerCase().includes(query) ||
      condition.icd10Code?.toLowerCase().includes(query) ||
      condition.category.toLowerCase().includes(query)
    );
  });

  const activeConditions = filteredConditions.filter(
    (c) => c.clinicalStatus === 'ACTIVE'
  );
  const inactiveConditions = filteredConditions.filter(
    (c) => c.clinicalStatus !== 'ACTIVE'
  );

  const handleExport = () => {
    console.log('Export conditions');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conditions & Diagnoses</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your health conditions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
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
                placeholder="Search conditions..."
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
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="REMISSION">Remission</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeConditions.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({inactiveConditions.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({filteredConditions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeConditions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeConditions.map((condition) => (
                <ConditionCard
                  key={condition.id}
                  condition={condition}
                  onClick={() => {
                    console.log('View condition:', condition.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold mb-2">No active conditions</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  You don't have any active conditions at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveConditions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveConditions.map((condition) => (
                <ConditionCard
                  key={condition.id}
                  condition={condition}
                  onClick={() => {
                    console.log('View condition:', condition.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold mb-2">No inactive conditions</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  You don't have any inactive conditions.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredConditions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredConditions.map((condition) => (
                <ConditionCard
                  key={condition.id}
                  condition={condition}
                  onClick={() => {
                    console.log('View condition:', condition.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conditions found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Connect your EHR to sync your condition data.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}