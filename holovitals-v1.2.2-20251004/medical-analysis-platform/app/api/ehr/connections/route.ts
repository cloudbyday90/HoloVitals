/**
 * EHR Connections Management API
 * 
 * GET /api/ehr/connections - List user's connections
 * DELETE /api/ehr/connections - Disconnect connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { EHRConnectionService } from '@/lib/services/EHRConnectionService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const connections = await EHRConnectionService.getUserConnections(userId);

    return NextResponse.json({
      success: true,
      connections,
      total: connections.length,
    });
  } catch (error: any) {
    console.error('Get connections error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get connections' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connectionId parameter' },
        { status: 400 }
      );
    }

    const connection = await EHRConnectionService.disconnectConnection(connectionId);

    return NextResponse.json({
      success: true,
      connection,
      message: 'Connection disconnected successfully',
    });
  } catch (error: any) {
    console.error('Disconnect connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect connection' },
      { status: 500 }
    );
  }
}