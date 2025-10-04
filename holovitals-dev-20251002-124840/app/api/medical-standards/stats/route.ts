/**
 * Medical Standardization Statistics API Endpoint
 * 
 * Get statistics about the LOINC database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMedicalStandardizationRepository } from '@/lib/services/MedicalStandardizationRepository';

const repository = getMedicalStandardizationRepository();

/**
 * GET /api/medical-standards/stats
 * Get LOINC database statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await repository.getStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error getting statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get statistics',
      },
      { status: 500 }
    );
  }
}