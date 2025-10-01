/**
 * Generate Comprehensive AI Insights API Endpoint
 * POST /api/ai-insights/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import AIHealthInsightsService from '@/lib/services/ai/AIHealthInsightsService';
import { GenerateInsightsRequest } from '@/lib/types/ai-insights';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: GenerateInsightsRequest = await request.json();
    const { patientId } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Generate comprehensive insights
    const insights = await AIHealthInsightsService.generateComprehensiveInsights(body);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Generate insights API error:', error);
    return NextResponse.json(
      {
        success: false,
        data: {},
        metadata: {
          generatedAt: new Date(),
          processingTime: 0,
          dataPoints: 0,
          confidence: 0,
        },
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}