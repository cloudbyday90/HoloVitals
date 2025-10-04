/**
 * Risk Assessment API Endpoint
 * GET /api/ai-insights/risk-assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import HealthRiskAssessmentService from '@/lib/services/ai/HealthRiskAssessmentService';

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

    // Generate risk assessment
    const riskAssessment = await HealthRiskAssessmentService.generateRiskAssessment(customerId);

    return NextResponse.json({
      success: true,
      data: riskAssessment,
    });
  } catch (error) {
    console.error('Risk assessment API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}