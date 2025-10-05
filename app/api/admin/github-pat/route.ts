/**
 * GitHub PAT Configuration API
 * GET /api/admin/github-pat - Get all GitHub PAT configurations
 * POST /api/admin/github-pat - Save new GitHub PAT
 * PUT /api/admin/github-pat - Update GitHub PAT
 * DELETE /api/admin/github-pat - Delete GitHub PAT
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import GitHubConfigurationService from '@/lib/services/GitHubConfigurationService';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const githubConfigService = new GitHubConfigurationService();

/**
 * GET - Get all GitHub PAT configurations
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get all configurations (tokens are masked)
    const configs = await githubConfigService.getAllConfigurations();

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error: any) {
    console.error('Error fetching GitHub PAT configurations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch GitHub PAT configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save new GitHub PAT
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { personalAccessToken, tokenName, expiresAt } = body;

    if (!personalAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Personal Access Token is required' },
        { status: 400 }
      );
    }

    // Validate PAT format
    const validation = githubConfigService.validatePATFormat(personalAccessToken);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Test PAT
    const testResult = await githubConfigService.testPAT(personalAccessToken);
    if (!testResult.success) {
      return NextResponse.json(
        { success: false, error: `GitHub PAT test failed: ${testResult.error}` },
        { status: 400 }
      );
    }

    // Save PAT
    const userId = (session.user as any).id;
    const config = await githubConfigService.savePAT(
      {
        personalAccessToken,
        tokenName,
        scopes: testResult.scopes?.join(', '),
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        tokenName: config.tokenName,
        scopes: config.scopes,
        expiresAt: config.expiresAt,
        isActive: config.isActive,
        createdAt: config.createdAt,
      },
      message: 'GitHub PAT saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving GitHub PAT:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save GitHub PAT' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update GitHub PAT
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, personalAccessToken, tokenName, expiresAt, activate } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // If activating a PAT
    if (activate) {
      const config = await githubConfigService.activatePAT(id, userId);
      return NextResponse.json({
        success: true,
        data: {
          id: config.id,
          isActive: config.isActive,
        },
        message: 'GitHub PAT activated successfully',
      });
    }

    // If updating PAT
    if (personalAccessToken) {
      // Validate PAT format
      const validation = githubConfigService.validatePATFormat(personalAccessToken);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      // Test PAT
      const testResult = await githubConfigService.testPAT(personalAccessToken);
      if (!testResult.success) {
        return NextResponse.json(
          { success: false, error: `GitHub PAT test failed: ${testResult.error}` },
          { status: 400 }
        );
      }
    }

    // Update PAT
    const config = await githubConfigService.updatePAT(
      id,
      {
        personalAccessToken,
        tokenName,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        tokenName: config.tokenName,
        scopes: config.scopes,
        expiresAt: config.expiresAt,
        isActive: config.isActive,
        updatedAt: config.updatedAt,
      },
      message: 'GitHub PAT updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating GitHub PAT:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update GitHub PAT' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete GitHub PAT
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    await githubConfigService.deletePAT(id);

    return NextResponse.json({
      success: true,
      message: 'GitHub PAT deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting GitHub PAT:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete GitHub PAT' },
      { status: 500 }
    );
  }
}