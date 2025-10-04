/**
 * HIPAA Incidents API
 * GET /api/admin/hipaa/incidents - List incidents
 * POST /api/admin/hipaa/incidents - Create incident
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { hipaaIncidentService, HIPAAIncidentSeverity, HIPAAViolationCategory, HIPAAIncidentStatus } from '@/lib/compliance/HIPAAIncidentService';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has HIPAA compliance access
    // TODO: Add proper permission check
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - HIPAA Compliance access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as HIPAAIncidentStatus | undefined;
    const severity = searchParams.get('severity') as HIPAAIncidentSeverity | undefined;
    const category = searchParams.get('category') as HIPAAViolationCategory | undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const phiExposed = searchParams.get('phiExposed') === 'true' ? true : 
                       searchParams.get('phiExposed') === 'false' ? false : undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Date range
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    // Get incidents
    const result = await hipaaIncidentService.getIncidents({
      status,
      severity,
      category,
      assignedTo,
      phiExposed,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching HIPAA incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HIPAA incidents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has HIPAA compliance access
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - HIPAA Compliance access required' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();

    // Create incident
    const incident = await hipaaIncidentService.createIncident({
      timestamp: new Date(),
      severity: body.severity,
      category: body.category,
      description: body.description,
      phiExposed: body.phiExposed || false,
      phiType: body.phiType,
      numberOfRecordsAffected: body.numberOfRecordsAffected,
      patientIds: body.patientIds,
      userId: body.userId,
      userRole: body.userRole,
      ipAddress: body.ipAddress,
      endpoint: body.endpoint,
      action: body.action,
      stackTrace: body.stackTrace,
      status: body.status || HIPAAIncidentStatus.NEW,
      assignedTo: body.assignedTo,
      investigationNotes: body.investigationNotes,
      resolutionNotes: body.resolutionNotes,
      reportedToOCR: body.reportedToOCR || false,
      reportedDate: body.reportedDate ? new Date(body.reportedDate) : undefined,
      breachNotificationSent: body.breachNotificationSent || false,
      breachNotificationDate: body.breachNotificationDate ? new Date(body.breachNotificationDate) : undefined,
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Error creating HIPAA incident:', error);
    return NextResponse.json(
      { error: 'Failed to create HIPAA incident' },
      { status: 500 }
    );
  }
}