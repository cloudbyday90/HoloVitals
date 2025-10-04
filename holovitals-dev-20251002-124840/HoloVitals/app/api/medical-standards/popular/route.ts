/**
 * Popular LOINC Codes API Endpoint
 * 
 * Get popular LOINC codes by category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMedicalStandardizationRepository, LOINCCategory } from '@/lib/services/MedicalStandardizationRepository';

const repository = getMedicalStandardizationRepository();

/**
 * GET /api/medical-standards/popular
 * Get popular LOINC codes
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as LOINCCategory || LOINCCategory.LABORATORY;
    const limit = parseInt(searchParams.get('limit') || '20');

    const codes = await repository.getPopularCodes(category, limit);

    return NextResponse.json({
      success: true,
      data: {
        category,
        codes,
        total: codes.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting popular codes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get popular codes',
      },
      { status: 500 }
    );
  }
}