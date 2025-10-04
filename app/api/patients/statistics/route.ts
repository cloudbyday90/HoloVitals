/**
 * Patient Statistics API Endpoint
 * GET /api/patients/statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import PatientSearchService from '@/lib/services/PatientSearchService';

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

    // Get statistics
    const statistics = await PatientSearchService.getPatientStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Patient statistics API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}