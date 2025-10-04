/**
 * Master Error Codes API
 * GET /api/admin/errors/master-codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { MASTER_ERROR_CODES, ErrorCodeClassifier } from '@/lib/errors/MasterErrorCodes';
import { prisma } from '@/lib/prisma';

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

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const masterCode = searchParams.get('masterCode');
    const category = searchParams.get('category');
    const timeRange = parseInt(searchParams.get('timeRange') || '24');

    // If specific master code requested
    if (masterCode) {
      const definition = MASTER_ERROR_CODES[masterCode];
      if (!definition) {
        return NextResponse.json(
          { error: 'Master code not found' },
          { status: 404 }
        );
      }

      // Get error statistics for this master code
      const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);
      const errors = await prisma.errorLog.findMany({
        where: {
          masterCode,
          timestamp: { gte: since },
        },
        select: {
          code: true,
          message: true,
          occurrenceCount: true,
          firstSeen: true,
          lastSeen: true,
          severity: true,
        },
        orderBy: {
          occurrenceCount: 'desc',
        },
      });

      const totalOccurrences = errors.reduce((sum, e) => sum + (e.occurrenceCount || 1), 0);

      return NextResponse.json({
        masterCode: definition.code,
        category: definition.category,
        description: definition.description,
        severity: definition.severity,
        resolutionGuide: definition.resolutionGuide,
        subCodes: definition.subCodes,
        statistics: {
          totalErrors: errors.length,
          totalOccurrences,
          errors: errors.map(e => ({
            code: e.code,
            message: e.message,
            occurrences: e.occurrenceCount || 1,
            firstSeen: e.firstSeen,
            lastSeen: e.lastSeen,
            severity: e.severity,
          })),
        },
      });
    }

    // Get all master codes
    let masterCodes = Object.entries(MASTER_ERROR_CODES);

    // Filter by category if specified
    if (category) {
      masterCodes = masterCodes.filter(([_, def]) => def.category === category);
    }

    // Get error counts for each master code
    const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);
    const errorCounts = await prisma.errorLog.groupBy({
      by: ['masterCode'],
      where: {
        masterCode: { not: null },
        timestamp: { gte: since },
      },
      _count: {
        id: true,
      },
      _sum: {
        occurrenceCount: true,
      },
    });

    const countMap = new Map(
      errorCounts.map(e => [
        e.masterCode!,
        {
          count: e._count.id,
          occurrences: e._sum.occurrenceCount || 0,
        },
      ])
    );

    const result = masterCodes.map(([code, definition]) => {
      const stats = countMap.get(code) || { count: 0, occurrences: 0 };
      return {
        code: definition.code,
        category: definition.category,
        description: definition.description,
        severity: definition.severity,
        subCodesCount: definition.subCodes.length,
        errorCount: stats.count,
        totalOccurrences: stats.occurrences,
      };
    });

    // Sort by total occurrences (descending)
    result.sort((a, b) => b.totalOccurrences - a.totalOccurrences);

    return NextResponse.json({
      masterCodes: result,
      total: result.length,
      timeRange,
    });
  } catch (error) {
    console.error('Error fetching master error codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master error codes' },
      { status: 500 }
    );
  }
}