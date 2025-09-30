/**
 * Instance Provisioner API Routes
 * 
 * Endpoints:
 * - POST /api/instances - Provision new instance
 * - GET /api/instances - List instances
 * - GET /api/instances/stats - Get statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import InstanceProvisionerService, {
  CloudProvider,
  InstanceType,
  InstanceStatus,
  ProvisionRequest
} from '@/lib/services/InstanceProvisionerService';

const service = InstanceProvisionerService.getInstance();

/**
 * POST /api/instances
 * Provision a new cloud instance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!body.taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    if (!body.config) {
      return NextResponse.json(
        { error: 'config is required' },
        { status: 400 }
      );
    }

    // Validate config
    const { provider, instanceType, region, diskSizeGB, autoTerminateMinutes } = body.config;

    if (!Object.values(CloudProvider).includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    if (!Object.values(InstanceType).includes(instanceType)) {
      return NextResponse.json(
        { error: 'Invalid instance type' },
        { status: 400 }
      );
    }

    if (!region) {
      return NextResponse.json(
        { error: 'region is required' },
        { status: 400 }
      );
    }

    if (!diskSizeGB || diskSizeGB < 30) {
      return NextResponse.json(
        { error: 'diskSizeGB must be at least 30' },
        { status: 400 }
      );
    }

    if (!autoTerminateMinutes || autoTerminateMinutes < 5) {
      return NextResponse.json(
        { error: 'autoTerminateMinutes must be at least 5' },
        { status: 400 }
      );
    }

    // Create provision request
    const provisionRequest: ProvisionRequest = {
      userId: body.userId,
      taskId: body.taskId,
      config: {
        provider,
        instanceType,
        region,
        diskSizeGB,
        autoTerminateMinutes,
        tags: body.config.tags
      },
      purpose: body.purpose || 'AI Analysis'
    };

    // Provision instance
    const instance = await service.provisionInstance(provisionRequest);

    return NextResponse.json({
      success: true,
      instance
    });
  } catch (error) {
    console.error('Error provisioning instance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to provision instance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/instances
 * List instances for a user
 * 
 * Query params:
 * - userId: User ID (required)
 * - status: Filter by status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as InstanceStatus | null;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(InstanceStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const instances = await service.listInstances(userId, status || undefined);

    return NextResponse.json({
      success: true,
      instances,
      count: instances.length
    });
  } catch (error) {
    console.error('Error listing instances:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list instances',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}