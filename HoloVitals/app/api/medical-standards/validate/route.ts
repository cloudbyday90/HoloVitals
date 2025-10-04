/**
 * Lab Result Validation API Endpoint
 * 
 * Validate lab results against LOINC standards
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMedicalStandardizationRepository } from '@/lib/services/MedicalStandardizationRepository';

const repository = getMedicalStandardizationRepository();

/**
 * POST /api/medical-standards/validate
 * Validate a lab result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loincNumber, testName, value, unit, customerAge, customerGender } = body;

    if (!loincNumber && !testName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either loincNumber or testName must be provided',
        },
        { status: 400 }
      );
    }

    if (value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'value is required',
        },
        { status: 400 }
      );
    }

    const result = await repository.validateLabResult({
      loincNumber,
      testName,
      value,
      unit,
      customerAge,
      customerGender,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error validating lab result:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to validate lab result',
      },
      { status: 500 }
    );
  }
}