/**
 * Customer Right to Amend API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { customerRights } from '@/lib/services/CustomerRightsService';

/**
 * POST /api/customer-rights/amendment
 * Request amendment to PHI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      recordId,
      recordType,
      currentValue,
      proposedValue,
      reason,
    } = body;

    if (!customerId || !recordId || !recordType || !currentValue || !proposedValue || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required',
        },
        { status: 400 }
      );
    }

    const requestId = await customerRights.requestAmendment({
      customerId,
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