/**
 * Allscripts Enhanced Sync API
 * POST /api/ehr/allscripts/enhanced-sync - Perform enhanced sync with all Allscripts-specific resources
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { FHIRClient } from '@/lib/fhir/FHIRClient';
import { AllscriptsEnhancedService } from '@/lib/services/AllscriptsEnhancedService';

const prisma = new PrismaClient();

/**
 * POST /api/ehr/allscripts/enhanced-sync
 * Perform enhanced sync with all Allscripts-specific resources
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connectionId' },
        { status: 400 }
      );
    }

    // Verify connection belongs to user
    const connection = await prisma.eHRConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Verify connection is to Allscripts
    if (connection.provider !== 'ALLSCRIPTS') {
      return NextResponse.json(
        { error: 'Enhanced sync is only supported for Allscripts connections' },
        { status: 400 }
      );
    }

    // Verify connection is active
    if (connection.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Connection is not active' },
        { status: 400 }
      );
    }

    // Initialize Allscripts service
    const fhirClient = new FHIRClient(
      connection.fhirBaseUrl,
      connection.accessToken || ''
    );
    const allscriptsService = new AllscriptsEnhancedService(fhirClient);

    // Perform enhanced sync
    const startTime = Date.now();
    const results = await allscriptsService.performEnhancedSync(connectionId);
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update last sync time
    await prisma.eHRConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        nextSyncAt: new Date(Date.now() + connection.syncFrequency * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Enhanced sync completed successfully',
      results: {
        standardResources: results.standardResources,
        diagnosticReports: results.diagnosticReports,
        carePlans: results.carePlans,
        encounters: results.encounters,
        goals: results.goals,
        serviceRequests: results.serviceRequests,
        totalResources: 
          results.standardResources + 
          results.diagnosticReports + 
          results.carePlans + 
          results.encounters + 
          results.goals + 
          results.serviceRequests,
        duration,
      },
    });
  } catch (error) {
    console.error('Error performing enhanced sync:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform enhanced sync' },
      { status: 500 }
    );
  }
}