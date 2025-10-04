'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info, Pill } from 'lucide-react';
import { MedicationInteractionAnalysis } from '@/lib/types/ai-insights';

interface MedicationInteractionsCardProps {
  analysis: MedicationInteractionAnalysis;
  loading?: boolean;
}

export function MedicationInteractionsCard({ analysis, loading = false }: MedicationInteractionsCardProps) {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Medication Interactions</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { medications, interactions, warnings, recommendations, overallSafety } = analysis;

  const getSafetyColor = (safety: string) => {
    switch (safety) {
      case 'safe':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'caution':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSafetyIcon = () => {
    switch (overallSafety) {
      case 'safe':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'caution':
        return <Info className="h-5 w-5 text-yellow-600" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityVariant = (severity: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'contraindicated':
      case 'major':
      case 'critical':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Medication Safety Analysis</CardTitle>
            <CardDescription>
              {medications.length} active medication{medications.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Badge className={getSafetyColor(overallSafety)}>
            {overallSafety.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Safety Status */}
        <Alert className={getSafetyColor(overallSafety)}>
          <div className="flex items-start gap-3">
            {getSafetyIcon()}
            <div className="flex-1">
              <AlertTitle>Overall Safety: {overallSafety.toUpperCase()}</AlertTitle>
              <AlertDescription>
                {interactions.length === 0 && warnings.length === 0
                  ? 'No significant drug interactions or warnings detected.'
                  : `${interactions.length} interaction${interactions.length !== 1 ? 's' : ''} and ${warnings.length} warning${warnings.length !== 1 ? 's' : ''} identified.`}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Active Medications */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Active Medications
          </h3>
          <div className="grid gap-2">
            {medications.map((med) => (
              <div key={med.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h4 className="font-medium text-gray-900">{med.name}</h4>
                    {med.genericName !== med.name && (
                      <p className="text-xs text-gray-600">{med.genericName}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {med.dosage}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                  <span>📅 {med.frequency}</span>
                  <span>👨‍⚕️ {med.prescriber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drug Interactions */}
        {interactions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Drug Interactions</h3>
            <div className="space-y-3">
              {interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="border rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {interaction.medications.join(' + ')}
                        </h4>
                        <Badge variant={getSeverityVariant(interaction.severity)}>
                          {interaction.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{interaction.description}</p>
                    </div>
                  </div>

                  {/* Clinical Effects */}
                  {interaction.clinicalEffects.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Clinical Effects:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {interaction.clinicalEffects.map((effect, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{effect}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Management */}
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Management:</p>
                    <p className="text-xs text-gray-600">{interaction.management}</p>
                  </div>

                  {/* Evidence */}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {interaction.evidenceLevel} evidence
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {interaction.type.replace(/-/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Medication Warnings</h3>
            <div className="space-y-2">
              {warnings.map((warning) => (
                <Alert
                  key={warning.id}
                  variant={warning.severity === 'critical' || warning.severity === 'high' ? 'destructive' : 'default'}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    {warning.medication}
                    <Badge variant={getSeverityVariant(warning.severity)} className="text-xs">
                      {warning.severity}
                    </Badge>
                    {warning.urgent && (
                      <Badge variant="destructive" className="text-xs">
                        URGENT
                      </Badge>
                    )}
                  </AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">{warning.message}</p>
                    <p className="text-sm font-medium">Action: {warning.action}</p>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Recommendations</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* No Issues Message */}
        {interactions.length === 0 && warnings.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Medication Issues Detected
            </h3>
            <p className="text-sm text-gray-600">
              Your current medications appear to be safe when taken together.
              Continue taking them as prescribed.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 italic border-t pt-3">
          This analysis is based on known drug interactions and should not replace professional medical advice. 
          Always consult your healthcare provider before making changes to your medications.
        </div>
      </CardContent>
    </Card>
  );
}