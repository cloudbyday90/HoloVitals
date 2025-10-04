'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { RiskAssessment, HealthRisk } from '@/lib/types/ai-insights';

interface RiskAssessmentCardProps {
  riskAssessment: RiskAssessment;
  loading?: boolean;
  onViewDetails?: (risk: HealthRisk) => void;
}

export function RiskAssessmentCard({ riskAssessment, loading = false, onViewDetails }: RiskAssessmentCardProps) {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Health Risk Assessment</CardTitle>
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

  const { overallRisk, risks, preventiveActions, nextAssessmentDate } = riskAssessment;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskBadgeVariant = (level: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (level) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Health Risk Assessment</CardTitle>
            <CardDescription>
              Next assessment: {new Date(nextAssessmentDate).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge variant={getRiskBadgeVariant(overallRisk)} className="text-sm">
            {overallRisk.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk Summary */}
        <div className={`p-4 rounded-lg border ${getRiskColor(overallRisk)}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Overall Risk Level: {overallRisk.toUpperCase()}</h3>
              <p className="text-sm">
                {risks.length} health risk{risks.length !== 1 ? 's' : ''} identified requiring attention
              </p>
            </div>
          </div>
        </div>

        {/* Individual Risks */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Identified Health Risks</h3>
          {risks.length === 0 ? (
            <p className="text-sm text-gray-600">No significant health risks identified</p>
          ) : (
            risks.map((risk) => (
              <div
                key={risk.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{risk.condition}</h4>
                      <Badge variant={getRiskBadgeVariant(risk.riskLevel)} className="text-xs">
                        {risk.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {risk.probability}% probability over {risk.timeframe}
                    </p>
                  </div>
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(risk)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Risk Factors */}
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-gray-700">Key Risk Factors:</p>
                  <div className="flex flex-wrap gap-1">
                    {risk.riskFactors.slice(0, 3).map((factor, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {factor.name}
                      </Badge>
                    ))}
                    {risk.riskFactors.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{risk.riskFactors.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Mitigation Strategies */}
                {risk.mitigationStrategies.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Recommended Actions:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {risk.mitigationStrategies.slice(0, 2).map((strategy, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Preventive Actions */}
        {preventiveActions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Preventive Actions</h3>
            <div className="space-y-2">
              {preventiveActions.slice(0, 5).map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{action.title}</h4>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(action.priority)}`}>
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{action.description}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Estimated impact: {action.estimatedImpact.toFixed(0)}% risk reduction
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Note */}
        <div className="text-xs text-gray-500 italic border-t pt-3">
          Risk assessments are based on evidence-based guidelines and clinical research. 
          Consult with your healthcare provider for personalized medical advice.
        </div>
      </CardContent>
    </Card>
  );
}