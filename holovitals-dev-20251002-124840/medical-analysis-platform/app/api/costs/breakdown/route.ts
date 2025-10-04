/**
 * Cost Breakdown API
 * Protected - OWNER only
 * Returns detailed cost breakdown by service
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectCostEndpoint } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Protect endpoint - OWNER only
  const user = await protectCostEndpoint(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let days: number;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        days = 7;
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        days = 30;
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        days = 90;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        days = 7;
    }

    // Get daily breakdown
    const dailyBreakdown = [];
    
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const [chatbot, optimizer, queue, instances] = await Promise.all([
        prisma.conversation.aggregate({
          where: {
            createdAt: { gte: dayStart, lt: dayEnd },
          },
          _sum: { totalCost: true },
        }),
        prisma.contextOptimization.aggregate({
          where: {
            createdAt: { gte: dayStart, lt: dayEnd },
          },
          _count: true,
        }),
        prisma.analysisTask.aggregate({
          where: {
            createdAt: { gte: dayStart, lt: dayEnd },
            status: 'COMPLETED',
          },
          _count: true,
        }),
        prisma.cloudInstance.aggregate({
          where: {
            createdAt: { gte: dayStart, lt: dayEnd },
          },
          _sum: { totalCost: true },
        }),
      ]);

      dailyBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        chatbot: chatbot._sum.totalCost || 0,
        optimizer: optimizer._count * 0.001, // $0.001 per optimization
        queue: queue._count * 0.05, // $0.05 per task
        instances: instances._sum.totalCost || 0,
      });
    }

    return NextResponse.json({
      timeRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      breakdown: dailyBreakdown,
    });
  } catch (error) {
    console.error('Error fetching cost breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost breakdown' },
      { status: 500 }
    );
  }
}