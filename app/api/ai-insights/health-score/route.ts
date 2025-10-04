/**
 * Health Score API Endpoint
 * GET /api/ai-insights/health-score
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import AIHealthInsightsService from '@/lib/services/ai/AIHealthInsightsService';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customer ID from query params
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Generate comprehensive insights (health score included)
    const insights = await AIHealthInsightsService.generateComprehensiveInsights({
      customerId,
      includeRiskAssessment: false,
      includeTrendAnalysis: false,
      includeMedicationInteraction: false,
      includeLabInterpretation: false,
      includeRecommendations: false,
    });

    if (!insights.success) {
      return NextResponse.json(
        { error: insights.error || 'Failed to generate health score' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: insights.data.healthScore,
      metadata: insights.metadata,
    });
  } catch (error) {
    console.error('Health score API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}