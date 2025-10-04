/**
 * Customer Quick Search API Endpoint (for autocomplete)
 * GET /api/customers/quick-search
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import CustomerSearchService from '@/lib/services/CustomerSearchService';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameter
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Quick search
    const results = await CustomerSearchService.quickSearch(query, limit);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Quick search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}