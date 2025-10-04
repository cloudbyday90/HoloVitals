/**
 * Health Check API
 * GET /api/monitoring/health
 * Public endpoint for health checks
 */

import { NextResponse } from 'next/server';
import { serverMonitoring } from '@/lib/services/ServerMonitoringService';

export async function GET() {
  try {
    const health = await serverMonitoring.getHealthSummary();

    return NextResponse.json({
      success: true,
      status: health.overall,
      timestamp: new Date().toISOString(),
      uptime: health.uptime,
      activeIssues: health.activeIssues,
    });
  } catch (error) {
    console.error('Error in health check:', error);
    return NextResponse.json(
      { 
        success: false,
        status: 'critical',
        error: 'Health check failed' 
      },
      { status: 500 }
    );
  }
}