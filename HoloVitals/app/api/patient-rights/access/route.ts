/**
 * Customer Right to Access API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { customerRights } from '@/lib/services/CustomerRightsService';

/**
 * POST /api/customer-rights/access
 * Request access to PHI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      requestType,
      specificRecords,
      startDate,
      endDate,
      deliveryMethod,
      deliveryAddress,
    } = body;

    if (!customerId || !requestType || !deliveryMethod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer ID, request type, and delivery method are required',
        },
        { status: 400 }
      );
    }

    const requestId = await customerRights.requestAccess({
      customerId,
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
 * GET /api/customer-rights/access
 * Get access requests for customer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer ID is required',
        },
        { status: 400 }
      );
    }

    const requests = await customerRights.getAccessRequests(customerId);

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