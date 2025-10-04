/**
 * EHR Disconnect API Endpoint
 * 
 * DELETE /api/ehr/disconnect
 * 
 * Disconnects from an EHR system for a customer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UnifiedEHRService } from '@/lib/services/ehr/UnifiedEHRService';
import { AuditLoggingService } from '@/lib/services/compliance/AuditLoggingService';
import { z } from 'zod';

const auditService = new AuditLoggingService();

// Request validation schema
const disconnectSchema = z.object({
  customerId: z.string().uuid(),
});

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = disconnectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { customerId } = validationResult.data;

    // 3. Initialize EHR service
    const ehrService = new UnifiedEHRService();

    // 4. Get connection status before disconnecting
    const connectionStatus = await ehrService.getConnectionStatus(customerId);

    // 5. Disconnect
    await ehrService.disconnect(customerId);

    // 6. Log disconnection
    await auditService.log({
      userId: session.user.id,
      eventType: 'EHR_CONNECTION_DISCONNECTED',
      category: 'INTEGRATION',
      outcome: 'SUCCESS',
      description: `Disconnected from EHR for customer ${customerId}`,
      metadata: {
        customerId,
        provider: connectionStatus.provider,
      },
    });

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Successfully disconnected from EHR',
        data: {
          customerId,
          disconnectedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Log error
    await auditService.log({
      userId: (await getServerSession(authOptions))?.user?.id,
      eventType: 'EHR_CONNECTION_DISCONNECTED',
      category: 'INTEGRATION',
      outcome: 'FAILURE',
      description: `Failed to disconnect from EHR: ${error.message}`,
      metadata: {
        error: error.message,
      },
    });

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect from EHR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}