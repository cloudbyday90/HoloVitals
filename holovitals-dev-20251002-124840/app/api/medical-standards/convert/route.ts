/**
 * Unit Conversion API Endpoint
 * 
 * Convert between different units for lab results
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMedicalStandardizationRepository } from '@/lib/services/MedicalStandardizationRepository';

const repository = getMedicalStandardizationRepository();

/**
 * POST /api/medical-standards/convert
 * Convert units for a lab result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loincNumber, value, fromUnit, toUnit } = body;

    if (!loincNumber || value === undefined || !fromUnit || !toUnit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: loincNumber, value, fromUnit, toUnit',
        },
        { status: 400 }
      );
    }

    const result = await repository.convertUnit(
      loincNumber,
      Number(value),
      fromUnit,
      toUnit
    );

    return NextResponse.json({
      success: true,
      data: {
        originalValue: value,
        originalUnit: fromUnit,
        convertedValue: result.value,
        convertedUnit: result.unit,
      },
    });
  } catch (error: any) {
    console.error('Error converting units:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to convert units',
      },
      { status: 500 }
    );
  }
}