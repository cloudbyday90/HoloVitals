/**
 * HIPAA Incident Details API
 * GET /api/admin/hipaa/incidents/:incidentId - Get incident details
 * PATCH /api/admin/hipaa/incidents/:incidentId - Update incident
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { hipaaIncidentService } from '@/lib/compliance/HIPAAIncidentService';

export async function GET(
  request: NextRequest,
  { params }: { params: { incidentId: string } }
) {
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

    // Get incident
    const incident = await hipaaIncidentService.getIncident(params.incidentId);

    if (!incident) {
      return NextResponse.json(
        { error: 'HIPAA incident not found' },
        { status: 404 }
      );
    }

    // Get audit log
    const auditLog = await hipaaIncidentService.getIncidentAuditLog(params.incidentId);

    return NextResponse.json({
      incident,
      auditLog,
    });
  } catch (error) {
    console.error('Error fetching HIPAA incident:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HIPAA incident' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { incidentId: string } }
) {
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

    // Update incident
    const incident = await hipaaIncidentService.updateIncident(
      params.incidentId,
      body.updates,
      session.user.id,
      body.notes
    );

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error updating HIPAA incident:', error);
    return NextResponse.json(
      { error: 'Failed to update HIPAA incident' },
      { status: 500 }
    );
  }
}