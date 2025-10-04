/**
 * EHR Resources API
 * 
 * GET /api/ehr/resources - Get synced FHIR resources
 */

import { NextRequest, NextResponse } from 'next/server';
import { EHRSyncService } from '@/lib/services/EHRSyncService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const resourceType = searchParams.get('resourceType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connectionId parameter' },
        { status: 400 }
      );
    }

    const result = await EHRSyncService.getSyncedResources(
      connectionId,
      resourceType,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      resources: result.resources,
      total: result.total,
      limit,
      offset,
      hasMore: offset + limit < result.total,
    });
  } catch (error: any) {
    console.error('Get resources error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get resources' },
      { status: 500 }
    );
  }
}