/**
 * Lab Result Standardization API Endpoint
 * 
 * Standardize lab results using LOINC codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMedicalStandardizationRepository } from '@/lib/services/MedicalStandardizationRepository';

const repository = getMedicalStandardizationRepository();

/**
 * POST /api/medical-standards/standardize
 * Standardize a single lab result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loincNumber, value, unit, customerAge, customerGender, condition } = body;

    if (!loincNumber || value === undefined || !unit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: loincNumber, value, unit',
        },
        { status: 400 }
      );
    }

    const result = await repository.standardizeLabResult({
      loincNumber,
      value,
      unit,
      customerAge,
      customerGender,
      condition,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error standardizing lab result:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to standardize lab result',
      },
      { status: 500 }
    );
  }
}