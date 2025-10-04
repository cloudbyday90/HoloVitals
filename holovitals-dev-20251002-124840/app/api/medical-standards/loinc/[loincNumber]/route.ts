/**
 * LOINC Code Detail API Endpoint
 * 
 * Get details for a specific LOINC code
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMedicalStandardizationRepository } from '@/lib/services/MedicalStandardizationRepository';

const repository = getMedicalStandardizationRepository();

/**
 * GET /api/medical-standards/loinc/:loincNumber
 * Get LOINC code details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { loincNumber: string } }
) {
  try {
    const loincCode = await repository.getLOINCCode(params.loincNumber);

    if (!loincCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'LOINC code not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: loincCode,
    });
  } catch (error: any) {
    console.error('Error getting LOINC code:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get LOINC code',
      },
      { status: 500 }
    );
  }
}