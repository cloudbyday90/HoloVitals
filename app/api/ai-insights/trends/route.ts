/**
 * Trend Analysis API Endpoint
 * GET /api/ai-insights/trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import TrendAnalysisService from '@/lib/services/ai/TrendAnalysisService';
import { TimeFrame } from '@/lib/types/ai-insights';

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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const metric = searchParams.get('metric');
    const timeframe = (searchParams.get('timeframe') || '90-days') as TimeFrame;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    let trends;

    if (metric) {
      // Analyze specific metric
      trends = await TrendAnalysisService.analyzeTrend(patientId, metric, timeframe);
    } else {
      // Get all trending metrics
      trends = await TrendAnalysisService.getTrendingMetrics(patientId, timeframe);
    }

    return NextResponse.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Trend analysis API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}