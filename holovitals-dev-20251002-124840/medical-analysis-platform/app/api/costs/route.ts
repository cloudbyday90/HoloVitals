/**
 * Cost API Endpoints
 * Protected - OWNER only
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectCostEndpoint } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

// ============================================================================
// GET - Get cost summary
// ============================================================================

export async function GET(req: NextRequest) {
  // Protect endpoint - OWNER only
  const user = await protectCostEndpoint(req);
  if (user instanceof NextResponse) {
    return user; // Return error response
  }

  try {
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get cost data from different services
    const [chatbotCosts, optimizerCosts, queueCosts, instanceCosts] = await Promise.all([
      // Chatbot costs
      prisma.conversation.aggregate({
        where: {
          createdAt: { gte: startDate },
        },
        _sum: {
          totalCost: true,
          totalTokens: true,
        },
        _count: true,
      }),

      // Optimizer costs (savings)
      prisma.contextOptimization.aggregate({
        where: {
          createdAt: { gte: startDate },
        },
        _sum: {
          costSavings: true,
          tokensReduced: true,
        },
        _count: true,
      }),

      // Queue costs (from analysis tasks)
      prisma.analysisTask.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
        _count: true,
      }),

      // Instance costs
      prisma.cloudInstance.aggregate({
        where: {
          createdAt: { gte: startDate },
        },
        _sum: {
          totalCost: true,
        },
        _count: true,
      }),
    ]);

    // Calculate totals
    const totalCosts = {
      chatbot: chatbotCosts._sum.totalCost || 0,
      optimizer: 0, // Optimizer saves money, doesn't cost
      queue: (queueCosts._count || 0) * 0.05, // Estimated $0.05 per task
      instances: instanceCosts._sum.totalCost || 0,
    };

    const totalSavings = {
      optimizer: optimizerCosts._sum.costSavings || 0,
      instances: 0, // Calculate based on ephemeral vs always-on
    };

    // Calculate instance savings (90% vs always-on)
    const instanceHours = instanceCosts._count || 0;
    const alwaysOnCost = instanceHours * 24 * 1.5; // $1.50/hour always-on
    const actualCost = totalCosts.instances;
    totalSavings.instances = Math.max(0, alwaysOnCost - actualCost);

    const response = {
      timeRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      costs: {
        chatbot: totalCosts.chatbot,
        optimizer: totalCosts.optimizer,
        queue: totalCosts.queue,
        instances: totalCosts.instances,
        total: Object.values(totalCosts).reduce((a, b) => a + b, 0),
      },
      savings: {
        optimizer: totalSavings.optimizer,
        instances: totalSavings.instances,
        total: Object.values(totalSavings).reduce((a, b) => a + b, 0),
      },
      metrics: {
        totalConversations: chatbotCosts._count,
        totalTokens: chatbotCosts._sum.totalTokens || 0,
        tokensReduced: optimizerCosts._sum.tokensReduced || 0,
        optimizationsPerformed: optimizerCosts._count,
        tasksCompleted: queueCosts._count,
        instancesProvisioned: instanceCosts._count,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching cost summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost summary' },
      { status: 500 }
    );
  }
}