/**
 * Instance Detail API Routes
 * 
 * Endpoints:
 * - GET /api/instances/:id - Get instance details
 * - DELETE /api/instances/:id - Terminate instance
 */

import { NextRequest, NextResponse } from 'next/server';
import InstanceProvisionerService from '@/lib/services/InstanceProvisionerService';

const service = InstanceProvisionerService.getInstance();

/**
 * GET /api/instances/:id
 * Get instance details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instanceId = params.id;

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Instance ID is required' },
        { status: 400 }
      );
    }

    const instance = await service.getInstance(instanceId);

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      instance
    });
  } catch (error) {
    console.error('Error getting instance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get instance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/instances/:id
 * Terminate an instance
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instanceId = params.id;

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Instance ID is required' },
        { status: 400 }
      );
    }

    await service.terminateInstance(instanceId);

    return NextResponse.json({
      success: true,
      message: 'Instance terminated successfully'
    });
  } catch (error) {
    console.error('Error terminating instance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to terminate instance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}