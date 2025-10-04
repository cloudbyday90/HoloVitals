/**
 * Error Export API
 * OWNER/ADMIN only - Export error logs as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Protect endpoint - ADMIN or higher
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '24h';

    // Convert range to hours
    let hours = 24;
    switch (range) {
      case '1h':
        hours = 1;
        break;
      case '24h':
        hours = 24;
        break;
      case '7d':
        hours = 24 * 7;
        break;
      case '30d':
        hours = 24 * 30;
        break;
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get error logs
    const errors = await prisma.errorLog.findMany({
      where: {
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Convert to CSV
    const headers = [
      'ID',
      'Timestamp',
      'Severity',
      'Message',
      'Code',
      'Status Code',
      'Endpoint',
      'Method',
      'User ID',
      'IP Address',
    ];

    const rows = errors.map(error => [
      error.id,
      error.timestamp.toISOString(),
      error.severity,
      `"${error.message.replace(/"/g, '""')}"`, // Escape quotes
      error.code || '',
      error.statusCode || '',
      error.endpoint || '',
      error.method || '',
      error.userId || '',
      error.ipAddress || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="error-logs-${new Date().toISOString()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export error logs:', error);
    return NextResponse.json(
      { error: 'Failed to export error logs' },
      { status: 500 }
    );
  }
}