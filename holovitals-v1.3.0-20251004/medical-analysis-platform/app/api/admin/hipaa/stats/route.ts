/**
 * HIPAA Statistics API
 * GET /api/admin/hipaa/stats - Get HIPAA incident statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { hipaaIncidentService } from '@/lib/compliance/HIPAAIncidentService';

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
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - HIPAA Compliance access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '720'); // Default 30 days

    // Get statistics
    const stats = await hipaaIncidentService.getIncidentStats(timeRange);

    return NextResponse.json({
      timeRange,
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching HIPAA statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HIPAA statistics' },
      { status: 500 }
    );
  }
}