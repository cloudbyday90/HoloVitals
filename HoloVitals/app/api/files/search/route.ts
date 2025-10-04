/**
 * File Search API Endpoint
 * 
 * Search secure files
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureFileStorage } from '@/lib/services/SecureFileStorageService';

/**
 * GET /api/files/search
 * Search files
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const options = {
      customerId: searchParams.get('customerId') || undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      uploadedBy: searchParams.get('uploadedBy') || undefined,
      startDate: searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!) 
        : undefined,
      endDate: searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate')!) 
        : undefined,
      limit: searchParams.get('limit') 
        ? parseInt(searchParams.get('limit')!) 
        : 50,
      offset: searchParams.get('offset') 
        ? parseInt(searchParams.get('offset')!) 
        : 0,
    };

    const result = await secureFileStorage.searchFiles(options);

    return NextResponse.json({
      success: true,
      data: result.files,
      pagination: {
        total: result.total,
        limit: options.limit,
        offset: options.offset,
        hasMore: result.total > (options.offset + options.limit),
      },
    });
  } catch (error) {
    console.error('Failed to search files:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search files',
      },
      { status: 500 }
    );
  }
}