'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LabResult, LabInterpretation } from '@/lib/types/clinical-data';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface LabResultCardProps {
  result: LabResult;
  showTrend?: boolean;
  onClick?: () => void;
}

export function LabResultCard({ result, showTrend = false, onClick }: LabResultCardProps) {
  const getInterpretationColor = (interpretation: LabInterpretation) => {
    switch (interpretation) {
      case LabInterpretation.NORMAL:
        return 'bg-green-100 text-green-800 border-green-200';
      case LabInterpretation.LOW:
      case LabInterpretation.HIGH:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case LabInterpretation.CRITICAL_LOW:
      case LabInterpretation.CRITICAL_HIGH:
      case LabInterpretation.ABNORMAL:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInterpretationIcon = (interpretation: LabInterpretation) => {
    switch (interpretation) {
      case LabInterpretation.HIGH:
      case LabInterpretation.CRITICAL_HIGH:
        return <TrendingUp className="h-4 w-4" />;
      case LabInterpretation.LOW:
      case LabInterpretation.CRITICAL_LOW:
        return <TrendingDown className="h-4 w-4" />;
      case LabInterpretation.ABNORMAL:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isInRange = result.interpretation === LabInterpretation.NORMAL;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        !isInRange ? 'border-l-4 border-l-yellow-500' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">{result.testName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              LOINC: {result.loincCode}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`${getInterpretationColor(result.interpretation)} flex items-center gap-1`}
          >
            {getInterpretationIcon(result.interpretation)}
            {result.interpretation}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Value and Unit */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{result.value}</span>
            <span className="text-sm text-muted-foreground">{result.unit}</span>
          </div>

          {/* Reference Range */}
          {result.referenceRange && (
            <div className="text-sm">
              <span className="text-muted-foreground">Reference Range: </span>
              <span className="font-medium">
                {result.referenceRange.text ||
                  `${result.referenceRange.low} - ${result.referenceRange.high} ${result.unit}`}
              </span>
            </div>
          )}

          {/* Date and Provider */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
            <span>{formatDate(result.performedDate)}</span>
            <span>{result.orderingProvider}</span>
          </div>

          {/* Flags */}
          {result.flags && result.flags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {result.flags.map((flag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {flag}
                </Badge>
              ))}
            </div>
          )}

          {/* Notes */}
          {result.notes && (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              {result.notes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}