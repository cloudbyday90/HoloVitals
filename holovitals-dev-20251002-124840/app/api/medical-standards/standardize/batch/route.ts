/**
 * Batch Lab Result Standardization API Endpoint
 * 
 * Standardize multiple lab results at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMedicalStandardizationRepository } from '@/lib/services/MedicalStandardizationRepository';

const repository = getMedicalStandardizationRepository();

/**
 * POST /api/medical-standards/standardize/batch
 * Standardize multiple lab results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results } = body;

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'results must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // Validate each result
    for (const result of results) {
      if (!result.loincNumber || result.value === undefined || !result.unit) {
        return NextResponse.json(
          {
            success: false,
            error: 'Each result must have loincNumber, value, and unit',
          },
          { status: 400 }
        );
      }
    }

    const standardized = await repository.batchStandardize(results);

    return NextResponse.json({
      success: true,
      data: {
        results: standardized,
        total: standardized.length,
        successful: standardized.length,
        failed: 0,
      },
    });
  } catch (error: any) {
    console.error('Error batch standardizing lab results:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to batch standardize lab results',
      },
      { status: 500 }
    );
  }
}