'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Medication, MedicationStatus } from '@/lib/types/clinical-data';
import { Pill, Calendar, User, AlertTriangle } from 'lucide-react';

interface MedicationCardProps {
  medication: Medication;
  onClick?: () => void;
}

export function MedicationCard({ medication, onClick }: MedicationCardProps) {
  const getStatusColor = (status: MedicationStatus) => {
    switch (status) {
      case MedicationStatus.ACTIVE:
        return 'bg-green-100 text-green-800 border-green-200';
      case MedicationStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case MedicationStatus.DISCONTINUED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case MedicationStatus.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const hasInteractions = medication.interactions && medication.interactions.length > 0;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        hasInteractions ? 'border-l-4 border-l-orange-500' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pill className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">{medication.name}</CardTitle>
              {medication.genericName && medication.genericName !== medication.name && (
                <p className="text-sm text-muted-foreground mt-1">
                  {medication.genericName}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(medication.status)}>
            {medication.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Dosage and Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dosage</p>
              <p className="text-sm font-medium">{medication.dosage}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Frequency</p>
              <p className="text-sm font-medium">{medication.frequency}</p>
            </div>
          </div>

          {/* Route */}
          {medication.route && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Route</p>
              <p className="text-sm font-medium capitalize">{medication.route}</p>
            </div>
          )}

          {/* Purpose */}
          {medication.purpose && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Purpose</p>
              <p className="text-sm">{medication.purpose}</p>
            </div>
          )}

          {/* Date Range */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(medication.startDate)}
              {medication.endDate && ` - ${formatDate(medication.endDate)}`}
            </span>
          </div>

          {/* Prescriber */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Prescribed by {medication.prescribedBy}</span>
          </div>

          {/* Interactions Warning */}
          {hasInteractions && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  {medication.interactions!.length} Drug Interaction{medication.interactions!.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Click to view details
                </p>
              </div>
            </div>
          )}

          {/* Refills */}
          {medication.refillsRemaining !== undefined && (
            <div className="text-sm">
              <span className="text-muted-foreground">Refills remaining: </span>
              <span className="font-medium">{medication.refillsRemaining}</span>
            </div>
          )}

          {/* Instructions */}
          {medication.instructions && (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              {medication.instructions}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}