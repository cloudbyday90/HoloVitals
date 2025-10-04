/**
 * Patient Right to Access API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { patientRights } from '@/lib/services/PatientRightsService';

/**
 * POST /api/patient-rights/access
 * Request access to PHI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      requestType,
      specificRecords,
      startDate,
      endDate,
      deliveryMethod,
      deliveryAddress,
    } = body;

    if (!patientId || !requestType || !deliveryMethod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient ID, request type, and delivery method are required',
        },
        { status: 400 }
      );
    }

    const requestId = await patientRights.requestAccess({
      patientId,
      requestType,
      specificRecords,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      deliveryMethod,
      deliveryAddress,
    });

    return NextResponse.json({
      success: true,
      data: { requestId },
      message: 'Access request submitted successfully. You will receive your records within 30 days.',
    });
  } catch (error) {
    console.error('Failed to create access request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create access request',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/patient-rights/access
 * Get access requests for patient
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient ID is required',
        },
        { status: 400 }
      );
    }

    const requests = await patientRights.getAccessRequests(patientId);

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Failed to get access requests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get access requests',
      },
      { status: 500 }
    );
  }
}