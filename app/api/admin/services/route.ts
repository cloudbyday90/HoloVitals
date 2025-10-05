/**
 * Service Configuration API
 * GET /api/admin/services - Get all service configurations
 * POST /api/admin/services - Update service configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ServiceConfigurationService from '@/lib/services/ServiceConfigurationService';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const serviceConfigService = new ServiceConfigurationService();

/**
 * GET - Get all service configurations
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

    // Get all service configurations
    const configs = await serviceConfigService.getAllServiceConfigs();

    // Mask sensitive data in configurations
    const maskedConfigs = configs.map(config => ({
      ...config,
      configuration: config.configuration ? {
        ...config.configuration as any,
        apiKey: config.configuration && (config.configuration as any).apiKey 
          ? '***' + (config.configuration as any).apiKey.slice(-4) 
          : undefined,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: maskedConfigs,
    });
  } catch (error: any) {
    console.error('Error fetching service configurations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch service configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST - Update service configuration
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
    const { serviceName, enabled, configuration } = body;

    if (!serviceName) {
      return NextResponse.json(
        { success: false, error: 'Service name is required' },
        { status: 400 }
      );
    }

    // Validate configuration based on service type
    if (serviceName === 'openai' && enabled && configuration) {
      const validation = serviceConfigService.validateOpenAIConfig(configuration);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      // Test OpenAI connection
      const testResult = await serviceConfigService.testOpenAIConnection(configuration.apiKey);
      if (!testResult.success) {
        return NextResponse.json(
          { success: false, error: `OpenAI connection test failed: ${testResult.error}` },
          { status: 400 }
        );
      }
    }

    // Update service configuration
    const userId = (session.user as any).id;
    const updatedConfig = await serviceConfigService.updateServiceConfig(
      serviceName,
      enabled,
      configuration,
      userId
    );

    // Mask sensitive data
    const maskedConfig = {
      ...updatedConfig,
      configuration: updatedConfig.configuration ? {
        ...updatedConfig.configuration as any,
        apiKey: updatedConfig.configuration && (updatedConfig.configuration as any).apiKey 
          ? '***' + (updatedConfig.configuration as any).apiKey.slice(-4) 
          : undefined,
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: maskedConfig,
      message: `Service ${serviceName} ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error: any) {
    console.error('Error updating service configuration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update service configuration' },
      { status: 500 }
    );
  }
}