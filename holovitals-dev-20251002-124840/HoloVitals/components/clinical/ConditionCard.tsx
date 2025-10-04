'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Condition, ClinicalStatus, ConditionSeverity } from '@/lib/types/clinical-data';
import { Activity, Calendar, User } from 'lucide-react';

interface ConditionCardProps {
  condition: Condition;
  onClick?: () => void;
}

export function ConditionCard({ condition, onClick }: ConditionCardProps) {
  const getStatusColor = (status: ClinicalStatus) => {
    switch (status) {
      case ClinicalStatus.ACTIVE:
      case ClinicalStatus.RECURRENCE:
      case ClinicalStatus.RELAPSE:
        return 'bg-red-100 text-red-800 border-red-200';
      case ClinicalStatus.REMISSION:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ClinicalStatus.INACTIVE:
      case ClinicalStatus.RESOLVED:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity?: ConditionSeverity) => {
    if (!severity) return 'bg-gray-100 text-gray-800';
    
    switch (severity) {
      case ConditionSeverity.MILD:
        return 'bg-blue-100 text-blue-800';
      case ConditionSeverity.MODERATE:
        return 'bg-yellow-100 text-yellow-800';
      case ConditionSeverity.SEVERE:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isActive = condition.clinicalStatus === ClinicalStatus.ACTIVE;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'border-l-4 border-l-red-500' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-red-100' : 'bg-blue-100'}`}>
              <Activity className={`h-5 w-5 ${isActive ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">{condition.condition}</CardTitle>
              {condition.icd10Code && (
                <p className="text-sm text-muted-foreground mt-1">
                  ICD-10: {condition.icd10Code}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(condition.clinicalStatus)}>
            {condition.clinicalStatus}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Severity */}
          {condition.severity && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Severity</p>
              <Badge variant="secondary" className={getSeverityColor(condition.severity)}>
                {condition.severity}
              </Badge>
            </div>
          )}

          {/* Category */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Category</p>
            <p className="text-sm font-medium capitalize">{condition.category}</p>
          </div>

          {/* Date Range */}
          <div className="space-y-2 pt-2 border-t">
            {condition.onsetDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Onset: {formatDate(condition.onsetDate)}</span>
              </div>
            )}
            {condition.abatementDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Resolved: {formatDate(condition.abatementDate)}</span>
              </div>
            )}
          </div>

          {/* Diagnosed By */}
          {condition.diagnosedBy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Diagnosed by {condition.diagnosedBy}</span>
            </div>
          )}

          {/* Verification Status */}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Verification:</span>
            <Badge variant="outline" className="capitalize">
              {condition.verificationStatus.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>

          {/* SNOMED Code */}
          {condition.snomedCode && (
            <div className="text-sm">
              <span className="text-muted-foreground">SNOMED: </span>
              <span className="font-mono text-xs">{condition.snomedCode}</span>
            </div>
          )}

          {/* Notes */}
          {condition.notes && (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              {condition.notes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}