/**
 * Personalized Recommendations API Endpoint
 * GET /api/ai-insights/recommendations
 * PATCH /api/ai-insights/recommendations (update status)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import PersonalizedRecommendationsService from '@/lib/services/ai/PersonalizedRecommendationsService';

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

    // Generate recommendations
    const recommendations = await PersonalizedRecommendationsService.generateRecommendations(customerId);

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const body = await request.json();
    const { recommendationId, status, notes } = body;

    if (!recommendationId || !status) {
      return NextResponse.json(
        { error: 'Recommendation ID and status are required' },
        { status: 400 }
      );
    }

    // Update recommendation status
    await PersonalizedRecommendationsService.updateRecommendationStatus(
      recommendationId,
      status,
      notes
    );

    return NextResponse.json({
      success: true,
      message: 'Recommendation status updated successfully',
    });
  } catch (error) {
    console.error('Update recommendation API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}