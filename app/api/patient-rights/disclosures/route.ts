/**
 * Patient Right to Accounting of Disclosures API Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { patientRights } from '@/lib/services/PatientRightsService';

/**
 * GET /api/patient-rights/disclosures
 * Request accounting of disclosures
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!patientId || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient ID, start date, and end date are required',
        },
        { status: 400 }
      );
    }

    const disclosures = await patientRights.requestDisclosureAccounting({
      patientId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    return NextResponse.json({
      success: true,
      data: disclosures,
      message: `Found ${disclosures.length} disclosures in the specified period.`,
    });
  } catch (error) {
    console.error('Failed to get disclosure accounting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get disclosure accounting',
      },
      { status: 500 }
    );
  }
}