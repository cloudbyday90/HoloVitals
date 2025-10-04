'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AllergyCard } from '@/components/clinical/AllergyCard';
import { Allergy } from '@/lib/types/clinical-data';
import { Download, Plus, AlertCircle } from 'lucide-react';

export default function AllergiesPage() {
  const { data: session } = useSession();
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllergies();
  }, []);

  const fetchAllergies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clinical/allergies');
      if (response.ok) {
        const data = await response.json();
        setAllergies(data.allergies || []);
      }
    } catch (error) {
      console.error('Error fetching allergies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log('Export allergies');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Allergies</h1>
          <p className="text-muted-foreground mt-2">
            Manage your allergy information
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Allergy
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      {allergies.some(a => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING') && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Critical Allergies</h3>
              <p className="text-sm text-red-700 mt-1">
                You have severe or life-threatening allergies. Always inform healthcare providers before any treatment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allergies Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : allergies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allergies.map((allergy) => (
            <AllergyCard
              key={allergy.id}
              allergy={allergy}
              onClick={() => {
                console.log('View allergy:', allergy.id);
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No allergies recorded</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              You don't have any allergies on record. Connect your EHR to sync your allergy information.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Allergy
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}