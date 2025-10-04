/**
 * Medication Interactions API Endpoint
 * GET /api/ai-insights/medication-interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import MedicationInteractionService from '@/lib/services/ai/MedicationInteractionService';

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

    // Analyze medication interactions
    const analysis = await MedicationInteractionService.analyzeMedicationInteractions(customerId);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Medication interactions API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    const { medication1, medication2 } = body;

    if (!medication1 || !medication2) {
      return NextResponse.json(
        { error: 'Both medications are required' },
        { status: 400 }
      );
    }

    // Check specific interaction
    const interaction = await MedicationInteractionService.checkSpecificInteraction(
      medication1,
      medication2
    );

    return NextResponse.json({
      success: true,
      data: interaction,
    });
  } catch (error) {
    console.error('Check interaction API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}