/**
 * Sync History API Endpoint
 * 
 * GET /api/ehr/sync/history
 * 
 * Returns paginated sync history with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sortBy = searchParams.get('sortBy') || 'startedAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    
    // Filters
    const status = searchParams.get('status')?.split(',');
    const provider = searchParams.get('provider')?.split(',');
    const syncType = searchParams.get('syncType')?.split(',');
    const dataType = searchParams.get('dataType')?.split(',');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const patientId = searchParams.get('patientId');

    // 3. Import Prisma client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // 4. Build where clause
      const where: any = {};

      if (status && status.length > 0) {
        where.status = { in: status };
      }

      if (provider && provider.length > 0) {
        where.ehrProvider = { in: provider };
      }

      if (syncType && syncType.length > 0) {
        where.syncType = { in: syncType };
      }

      if (dataType && dataType.length > 0) {
        where.dataTypes = { hasSome: dataType };
      }

      if (dateFrom || dateTo) {
        where.startedAt = {};
        if (dateFrom) {
          where.startedAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.startedAt.lte = new Date(dateTo);
        }
      }

      if (patientId) {
        where.patientId = patientId;
      }

      // 5. Get total count
      const total = await prisma.syncHistory.count({ where });

      // 6. Get paginated results
      const skip = (page - 1) * pageSize;
      const syncs = await prisma.syncHistory.findMany({
        where,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          initiatedByUser: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortDirection,
        },
        take: pageSize,
        skip,
      });

      // 7. Calculate pagination info
      const totalPages = Math.ceil(total / pageSize);
      const hasMore = page < totalPages;

      // 8. Format response
      const formattedSyncs = syncs.map((sync) => {
        const duration = sync.completedAt
          ? Math.floor((new Date(sync.completedAt).getTime() - new Date(sync.startedAt).getTime()) / 1000)
          : undefined;

        return {
          id: sync.id,
          patientId: sync.patientId,
          patientName: sync.patient
            ? `${sync.patient.firstName} ${sync.patient.lastName}`
            : undefined,
          ehrProvider: sync.ehrProvider,
          status: sync.status,
          syncType: sync.syncType,
          dataTypes: sync.dataTypes,
          startedAt: sync.startedAt.toISOString(),
          completedAt: sync.completedAt?.toISOString(),
          duration,
          recordsProcessed: sync.recordsProcessed,
          recordsSucceeded: sync.recordsSucceeded,
          recordsFailed: sync.recordsFailed,
          errors: sync.errors,
          initiatedBy: sync.initiatedByUser?.name || 'System',
        };
      });

      await prisma.$disconnect();

      // 9. Return results
      return NextResponse.json(
        {
          success: true,
          syncs: formattedSyncs,
          total,
          page,
          pageSize,
          totalPages,
          hasMore,
        },
        { status: 200 }
      );
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load sync history',
        message: error.message,
      },
      { status: 500 }
    );
  }
}