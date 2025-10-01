/**
 * EHR Sync API
 * 
 * POST /api/ehr/sync - Trigger manual sync
 * GET /api/ehr/sync - Get sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { EHRSyncService } from '@/lib/services/EHRSyncService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      connectionId,
      syncType = 'incremental',
      resourceTypes,
      downloadDocuments = true,
    } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing required field: connectionId' },
        { status: 400 }
      );
    }

    // Start sync
    const syncId = await EHRSyncService.startSync({
      connectionId,
      syncType,
      resourceTypes,
      downloadDocuments,
    });

    return NextResponse.json({
      success: true,
      syncId,
      message: 'Sync started successfully',
    });
  } catch (error: any) {
    console.error('Start sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start sync' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const syncId = searchParams.get('syncId');
    const connectionId = searchParams.get('connectionId');

    if (syncId) {
      // Get specific sync status
      const sync = await EHRSyncService.getSyncStatus(syncId);
      
      if (!sync) {
        return NextResponse.json(
          { error: 'Sync not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        sync,
      });
    } else if (connectionId) {
      // Get sync history for connection
      const history = await EHRSyncService.getSyncHistory(connectionId);

      return NextResponse.json({
        success: true,
        history,
        total: history.length,
      });
    } else {
      return NextResponse.json(
        { error: 'Missing syncId or connectionId parameter' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get sync status' },
      { status: 500 }
    );
  }
}