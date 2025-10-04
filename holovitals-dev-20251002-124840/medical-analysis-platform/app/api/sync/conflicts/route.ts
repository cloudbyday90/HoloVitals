/**
 * Conflict Management API Endpoints
 * 
 * GET /api/sync/conflicts - List conflicts
 * POST /api/sync/conflicts/resolve - Resolve conflicts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { conflictResolutionService, ConflictResolutionStrategy } from '@/lib/services/sync/ConflictResolutionService';

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

    const searchParams = request.nextUrl.searchParams;
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');

    // Get pending conflicts
    const conflicts = await conflictResolutionService.getPendingConflicts(
      resourceType || undefined,
      resourceId || undefined
    );

    return NextResponse.json({
      success: true,
      conflicts,
      count: conflicts.length,
    });
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflicts', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conflictId, strategy, reason, customFunction, mergeOptions } = body;

    if (!conflictId || !strategy) {
      return NextResponse.json(
        { error: 'Missing required fields: conflictId, strategy' },
        { status: 400 }
      );
    }

    // Get the conflict
    const conflicts = await conflictResolutionService.getPendingConflicts();
    const conflict = conflicts.find(c => c.conflictId === conflictId);

    if (!conflict) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      );
    }

    // Resolve conflict
    const result = await conflictResolutionService.resolveConflict(
      conflict,
      strategy as ConflictResolutionStrategy,
      {
        userId: session.user.id || session.user.email || 'unknown',
        reason,
        customFunction,
        mergeOptions,
      }
    );

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return NextResponse.json(
      { error: 'Failed to resolve conflict', details: error.message },
      { status: 500 }
    );
  }
}