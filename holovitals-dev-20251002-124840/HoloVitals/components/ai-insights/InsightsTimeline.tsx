'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Target, 
  Lightbulb,
  AlertCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import { InsightTimeline, TimelineInsight } from '@/lib/types/ai-insights';

interface InsightsTimelineProps {
  timeline: InsightTimeline;
  loading?: boolean;
}

export function InsightsTimeline({ timeline, loading = false }: InsightsTimelineProps) {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Health Insights Timeline</CardTitle>
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

  const { insights } = timeline;

  const getInsightIcon = (type: TimelineInsight['type']) => {
    switch (type) {
      case 'risk-detected':
        return <AlertTriangle className="h-5 w-5" />;
      case 'trend-identified':
        return <TrendingUp className="h-5 w-5" />;
      case 'anomaly-found':
        return <AlertCircle className="h-5 w-5" />;
      case 'goal-achieved':
        return <Target className="h-5 w-5" />;
      case 'recommendation-generated':
        return <Lightbulb className="h-5 w-5" />;
      case 'interaction-detected':
        return <Activity className="h-5 w-5" />;
      case 'lab-interpreted':
        return <FileText className="h-5 w-5" />;
      case 'health-score-updated':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: TimelineInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimelineColor = (severity: TimelineInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-orange-500';
      case 'success':
        return 'bg-green-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Health Insights Timeline</CardTitle>
        <CardDescription>
          Recent health events and insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No insights available yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Timeline items */}
            <div className="space-y-6">
              {insights.map((insight, index) => (
                <div key={insight.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full ${getSeverityColor(insight.severity)} border-2 flex items-center justify-center z-10`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    {index < insights.length - 1 && (
                      <div className={`absolute top-12 left-1/2 w-0.5 h-6 ${getTimelineColor(insight.severity)} transform -translate-x-1/2`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {insight.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(insight.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <Badge className={getSeverityColor(insight.severity)}>
                          {insight.severity}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{insight.description}</p>

                      {/* Action Taken */}
                      {insight.actionTaken && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Action Taken:</p>
                          <p className="text-xs text-gray-600">{insight.actionTaken}</p>
                        </div>
                      )}

                      {/* Outcome */}
                      {insight.outcome && (
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Outcome:</p>
                          <p className="text-xs text-gray-600">{insight.outcome}</p>
                        </div>
                      )}

                      {/* Additional Data */}
                      {insight.data && (
                        <div className="mt-2 pt-2 border-t">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                              {JSON.stringify(insight.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}