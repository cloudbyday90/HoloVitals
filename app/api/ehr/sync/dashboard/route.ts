/**
 * Sync Dashboard API Endpoint
 * 
 * GET /api/ehr/sync/dashboard
 * 
 * Returns comprehensive dashboard metrics for sync monitoring
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

    // 2. Import Prisma client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // 3. Get date ranges
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 4. Get overall statistics
      const totalSyncs = await prisma.syncHistory.count();
      const successfulSyncs = await prisma.syncHistory.count({
        where: { status: 'COMPLETED' },
      });
      const failedSyncs = await prisma.syncHistory.count({
        where: { status: 'FAILED' },
      });
      const partialSyncs = await prisma.syncHistory.count({
        where: { status: 'PARTIAL' },
      });
      const activeSyncs = await prisma.syncHistory.count({
        where: { status: 'IN_PROGRESS' },
      });

      const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

      // 5. Get average duration
      const completedSyncs = await prisma.syncHistory.findMany({
        where: {
          status: { in: ['COMPLETED', 'PARTIAL'] },
          completedAt: { not: null },
        },
        select: {
          startedAt: true,
          completedAt: true,
        },
      });

      const averageDuration = completedSyncs.length > 0
        ? completedSyncs.reduce((sum, sync) => {
            const duration = sync.completedAt
              ? (new Date(sync.completedAt).getTime() - new Date(sync.startedAt).getTime()) / 1000
              : 0;
            return sum + duration;
          }, 0) / completedSyncs.length
        : 0;

      // 6. Get total records processed
      const recordsAgg = await prisma.syncHistory.aggregate({
        _sum: {
          recordsProcessed: true,
        },
      });

      // 7. Get last sync time
      const lastSync = await prisma.syncHistory.findFirst({
        orderBy: { startedAt: 'desc' },
        select: { startedAt: true },
      });

      // 8. Get active syncs with details
      const activeSyncsData = await prisma.syncHistory.findMany({
        where: { status: 'IN_PROGRESS' },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });

      // 9. Get recent errors
      const recentErrors = await prisma.syncError.findMany({
        where: {
          timestamp: { gte: last7Days },
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
      });

      // 10. Get provider statistics
      const providers = await prisma.ehrConnection.findMany({
        select: { provider: true },
        distinct: ['provider'],
      });

      const providerStats = await Promise.all(
        providers.map(async (p) => {
          const providerSyncs = await prisma.syncHistory.count({
            where: { ehrProvider: p.provider },
          });
          const providerSuccess = await prisma.syncHistory.count({
            where: {
              ehrProvider: p.provider,
              status: 'COMPLETED',
            },
          });
          const providerConnections = await prisma.ehrConnection.count({
            where: {
              provider: p.provider,
              status: 'ACTIVE',
            },
          });
          const lastProviderSync = await prisma.syncHistory.findFirst({
            where: { ehrProvider: p.provider },
            orderBy: { startedAt: 'desc' },
            select: { startedAt: true },
          });

          const providerCompletedSyncs = await prisma.syncHistory.findMany({
            where: {
              ehrProvider: p.provider,
              status: { in: ['COMPLETED', 'PARTIAL'] },
              completedAt: { not: null },
            },
            select: {
              startedAt: true,
              completedAt: true,
            },
          });

          const providerAvgDuration = providerCompletedSyncs.length > 0
            ? providerCompletedSyncs.reduce((sum, sync) => {
                const duration = sync.completedAt
                  ? (new Date(sync.completedAt).getTime() - new Date(sync.startedAt).getTime()) / 1000
                  : 0;
                return sum + duration;
              }, 0) / providerCompletedSyncs.length
            : 0;

          return {
            provider: p.provider,
            totalSyncs: providerSyncs,
            successRate: providerSyncs > 0 ? (providerSuccess / providerSyncs) * 100 : 0,
            averageDuration: Math.round(providerAvgDuration),
            lastSyncAt: lastProviderSync?.startedAt.toISOString(),
            activeConnections: providerConnections,
          };
        })
      );

      // 11. Get trends (last 30 days)
      const trends = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

        const dayTotal = await prisma.syncHistory.count({
          where: {
            startedAt: {
              gte: date,
              lt: nextDate,
            },
          },
        });

        const daySuccess = await prisma.syncHistory.count({
          where: {
            startedAt: {
              gte: date,
              lt: nextDate,
            },
            status: 'COMPLETED',
          },
        });

        const dayFailed = await prisma.syncHistory.count({
          where: {
            startedAt: {
              gte: date,
              lt: nextDate,
            },
            status: 'FAILED',
          },
        });

        const dayCompletedSyncs = await prisma.syncHistory.findMany({
          where: {
            startedAt: {
              gte: date,
              lt: nextDate,
            },
            status: { in: ['COMPLETED', 'PARTIAL'] },
            completedAt: { not: null },
          },
          select: {
            startedAt: true,
            completedAt: true,
          },
        });

        const dayAvgDuration = dayCompletedSyncs.length > 0
          ? dayCompletedSyncs.reduce((sum, sync) => {
              const duration = sync.completedAt
                ? (new Date(sync.completedAt).getTime() - new Date(sync.startedAt).getTime()) / 1000
                : 0;
              return sum + duration;
            }, 0) / dayCompletedSyncs.length
          : 0;

        trends.push({
          date: date.toISOString().split('T')[0],
          totalSyncs: dayTotal,
          successfulSyncs: daySuccess,
          failedSyncs: dayFailed,
          averageDuration: Math.round(dayAvgDuration),
        });
      }

      // 12. Build response
      const dashboardData = {
        overview: {
          totalSyncs,
          successfulSyncs,
          failedSyncs,
          partialSyncs,
          activeSyncs,
          successRate: Math.round(successRate * 10) / 10,
          averageDuration: Math.round(averageDuration),
          totalRecordsProcessed: recordsAgg._sum.recordsProcessed || 0,
          lastSyncAt: lastSync?.startedAt.toISOString(),
        },
        activeSyncs: activeSyncsData.map((sync) => ({
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
          recordsProcessed: sync.recordsProcessed,
          progress: sync.progress,
        })),
        recentErrors: recentErrors.map((error) => ({
          id: error.id,
          syncId: error.syncId,
          errorType: error.errorType,
          errorMessage: error.errorMessage,
          dataType: error.dataType,
          recordId: error.recordId,
          timestamp: error.timestamp.toISOString(),
          severity: error.severity,
          resolved: error.resolved,
          resolution: error.resolution,
        })),
        providerStats,
        trends,
        queue: {
          items: [],
          totalItems: 0,
          processingCapacity: 10,
          averageWaitTime: 0,
        },
      };

      await prisma.$disconnect();

      // 13. Return dashboard data
      return NextResponse.json(
        {
          success: true,
          data: dashboardData,
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
        error: 'Failed to load dashboard metrics',
        message: error.message,
      },
      { status: 500 }
    );
  }
}