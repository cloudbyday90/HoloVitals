/**
 * LOINC Code API Endpoints
 * 
 * Provides access to LOINC codes for medical standardization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMedicalStandardizationRepository } from '@/lib/services/MedicalStandardizationRepository';

const repository = getMedicalStandardizationRepository();

/**
 * GET /api/medical-standards/loinc
 * Search LOINC codes
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || undefined;
    const category = searchParams.get('category') || undefined;
    const componentType = searchParams.get('componentType') || undefined;
    const component = searchParams.get('component') || undefined;
    const system = searchParams.get('system') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await repository.searchLOINCCodes({
      query,
      category: category as any,
      componentType: componentType as any,
      component,
      system,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error searching LOINC codes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search LOINC codes',
      },
      { status: 500 }
    );
  }
}