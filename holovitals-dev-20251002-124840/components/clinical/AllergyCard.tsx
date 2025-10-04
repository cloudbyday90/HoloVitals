'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Allergy, AllergySeverity } from '@/lib/types/clinical-data';
import { AlertTriangle, Calendar } from 'lucide-react';

interface AllergyCardProps {
  allergy: Allergy;
  onClick?: () => void;
}

export function AllergyCard({ allergy, onClick }: AllergyCardProps) {
  const getSeverityColor = (severity: AllergySeverity) => {
    switch (severity) {
      case AllergySeverity.MILD:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case AllergySeverity.MODERATE:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case AllergySeverity.SEVERE:
      case AllergySeverity.LIFE_THREATENING:
        return 'bg-red-100 text-red-800 border-red-200';
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

  const isHighSeverity = 
    allergy.severity === AllergySeverity.SEVERE || 
    allergy.severity === AllergySeverity.LIFE_THREATENING;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isHighSeverity ? 'border-l-4 border-l-red-500' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${isHighSeverity ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <AlertTriangle className={`h-5 w-5 ${isHighSeverity ? 'text-red-600' : 'text-yellow-600'}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">{allergy.allergen}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {allergy.type.toLowerCase()} allergy
              </p>
            </div>
          </div>
          <Badge variant="outline" className={getSeverityColor(allergy.severity)}>
            {allergy.severity}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Reactions */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Reactions</p>
            <div className="flex flex-wrap gap-1">
              {allergy.reaction.map((reaction, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {reaction}
                </Badge>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Category</p>
            <p className="text-sm font-medium capitalize">{allergy.category}</p>
          </div>

          {/* Diagnosed Date */}
          {allergy.diagnosedDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
              <Calendar className="h-4 w-4" />
              <span>Diagnosed {formatDate(allergy.diagnosedDate)}</span>
            </div>
          )}

          {/* Verification Status */}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant="outline" className="capitalize">
              {allergy.verificationStatus.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>

          {/* Notes */}
          {allergy.notes && (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              {allergy.notes}
            </p>
          )}

          {/* Warning for high severity */}
          {isHighSeverity && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  {allergy.severity === AllergySeverity.LIFE_THREATENING 
                    ? 'Life-Threatening Allergy' 
                    : 'Severe Allergy'}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Avoid exposure and inform all healthcare providers
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}