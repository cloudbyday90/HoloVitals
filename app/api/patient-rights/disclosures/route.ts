/**
 * Customer Right to Accounting of Disclosures API Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { customerRights } from '@/lib/services/CustomerRightsService';

/**
 * GET /api/customer-rights/disclosures
 * Request accounting of disclosures
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!customerId || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer ID, start date, and end date are required',
        },
        { status: 400 }
      );
    }

    const disclosures = await customerRights.requestDisclosureAccounting({
      customerId,
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