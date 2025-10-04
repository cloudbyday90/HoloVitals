/**
 * Patient Right to Amend API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { customerRights } from '@/lib/services/PatientRightsService';

/**
 * POST /api/patient-rights/amendment
 * Request amendment to PHI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      recordId,
      recordType,
      currentValue,
      proposedValue,
      reason,
    } = body;

    if (!patientId || !recordId || !recordType || !currentValue || !proposedValue || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required',
        },
        { status: 400 }
      );
    }

    const requestId = await customerRights.requestAmendment({
      patientId,
      recordId,
      recordType,
      currentValue,
      proposedValue,
      reason,
    });

    return NextResponse.json({
      success: true,
      data: { requestId },
      message: 'Amendment request submitted successfully. You will receive a response within 60 days.',
    });
  } catch (error) {
    console.error('Failed to create amendment request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create amendment request',
      },
      { status: 500 }
    );
  }
}