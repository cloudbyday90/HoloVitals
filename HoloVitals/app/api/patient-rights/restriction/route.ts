/**
 * Customer Right to Restrict Uses and Disclosures API Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { customerRights } from '@/lib/services/CustomerRightsService';

/**
 * POST /api/customer-rights/restriction
 * Request restriction on uses and disclosures
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      restrictionType,
      dataType,
      recipient,
      reason,
    } = body;

    if (!customerId || !restrictionType || !dataType || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer ID, restriction type, data type, and reason are required',
        },
        { status: 400 }
      );
    }

    const requestId = await customerRights.requestRestriction({
      customerId,
      restrictionType,
      dataType,
      recipient,
      reason,
    });

    return NextResponse.json({
      success: true,
      data: { requestId },
      message: 'Restriction request submitted successfully. You will receive a response within 30 days.',
    });
  } catch (error) {
    console.error('Failed to create restriction request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create restriction request',
      },
      { status: 500 }
    );
  }
}