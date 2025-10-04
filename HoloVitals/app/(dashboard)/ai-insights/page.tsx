'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';
import { HealthScoreCard } from '@/components/ai-insights/HealthScoreCard';
import { RiskAssessmentCard } from '@/components/ai-insights/RiskAssessmentCard';
import { TrendChart } from '@/components/ai-insights/TrendChart';
import { RecommendationsPanel } from '@/components/ai-insights/RecommendationsPanel';
import { MedicationInteractionsCard } from '@/components/ai-insights/MedicationInteractionsCard';
import { InsightsTimeline } from '@/components/ai-insights/InsightsTimeline';
import { GenerateInsightsResponse } from '@/lib/types/ai-insights';

export default function AIInsightsDashboard() {
  const { data: session } = useSession();
  const [insights, setInsights] = useState<GenerateInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  useEffect(() => {
    // In production, get customer ID from session or route params
    // For now, using a placeholder
    if (session?.user) {
      setSelectedPatientId('customer-123');
      loadInsights('customer-123');
    }
  }, [session]);

  const loadInsights = async (customerId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          includeRiskAssessment: true,
          includeTrendAnalysis: true,
          includeMedicationInteraction: true,
          includeLabInterpretation: true,
          includeRecommendations: true,
          timeframe: '90-days',
        }),
      });

      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedPatientId) {
      setGenerating(true);
      await loadInsights(selectedPatientId);
      setGenerating(false);
    }
  };

  const handleUpdateRecommendationStatus = async (
    recommendationId: string,
    status: string
  ) => {
    try {
      await fetch('/api/ai-insights/recommendations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendationId,
          status,
        }),
      });
      // Refresh insights after update
      if (selectedPatientId) {
        await loadInsights(selectedPatientId);
      }
    } catch (error) {
      console.error('Failed to update recommendation status:', error);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please sign in to view AI insights</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            AI Health Insights
          </h1>
          <p className="text-gray-600 mt-1">
            Personalized health analysis powered by artificial intelligence
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={generating}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Processing Info */}
      {insights?.metadata && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                <strong>Generated:</strong> {new Date(insights.metadata.generatedAt).toLocaleString()}
              </span>
              <span className="text-gray-700">
                <strong>Processing Time:</strong> {(insights.metadata.processingTime / 1000).toFixed(2)}s
              </span>
              <span className="text-gray-700">
                <strong>Data Points:</strong> {insights.metadata.dataPoints}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">
                <strong>Confidence:</strong>
              </span>
              <div className="flex items-center gap-1">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${insights.metadata.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {insights.metadata.confidence.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Score */}
            {insights?.data.healthScore && (
              <HealthScoreCard
                healthScore={insights.data.healthScore}
                loading={loading}
              />
            )}

            {/* Risk Assessment Summary */}
            {insights?.data.riskAssessment && (
              <RiskAssessmentCard
                riskAssessment={insights.data.riskAssessment}
                loading={loading}
              />
            )}
          </div>

          {/* Trending Metrics */}
          {insights?.data.trends && insights.data.trends.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Trending Health Metrics
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {insights.data.trends.slice(0, 4).map((trend, index) => (
                  <TrendChart key={index} trend={trend} loading={loading} />
                ))}
              </div>
            </div>
          )}

          {/* Priority Recommendations */}
          {insights?.data.recommendations && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Priority Actions
              </h2>
              <div className="grid gap-4">
                {insights.data.recommendations.priorityActions.slice(0, 3).map((action) => (
                  <div key={action.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risks" className="space-y-6">
          {insights?.data.riskAssessment && (
            <RiskAssessmentCard
              riskAssessment={insights.data.riskAssessment}
              loading={loading}
            />
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {insights?.data.trends && insights.data.trends.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.data.trends.map((trend, index) => (
                <TrendChart key={index} trend={trend} loading={loading} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No trending metrics available</p>
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {insights?.data.recommendations && (
            <RecommendationsPanel
              recommendations={insights.data.recommendations}
              loading={loading}
              onUpdateStatus={handleUpdateRecommendationStatus}
            />
          )}
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-6">
          {insights?.data.medicationInteractions && (
            <MedicationInteractionsCard
              analysis={insights.data.medicationInteractions}
              loading={loading}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Error State */}
      {insights?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <strong>Error:</strong> {insights.error}
          </p>
        </div>
      )}
    </div>
  );
}