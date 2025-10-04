/**
 * Context Optimizer API
 * 
 * Endpoints for optimizing context to reduce token usage and costs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { contextOptimizer, OptimizationStrategy, ContentType } from '@/lib/services/ContextOptimizerService';

/**
 * POST /api/context-optimizer
 * Optimize context content
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      content,
      strategy,
      contentType,
      targetTokens,
      preserveKeywords,
      userId
    } = body;

    // Validate required fields
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate strategy if provided
    if (strategy && !Object.values(OptimizationStrategy).includes(strategy)) {
      return NextResponse.json(
        { error: 'Invalid optimization strategy' },
        { status: 400 }
      );
    }

    // Validate content type if provided
    if (contentType && !Object.values(ContentType).includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Optimize content
    const result = await contextOptimizer.optimize({
      content,
      strategy: strategy || OptimizationStrategy.BALANCED,
      contentType: contentType || ContentType.GENERAL,
      targetTokens,
      preserveKeywords: preserveKeywords || [],
      userId
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Context optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize context' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/context-optimizer?userId=xxx
 * Get optimization statistics for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const stats = await contextOptimizer.getOptimizationStats(userId);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Failed to get optimization stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get optimization stats' },
      { status: 500 }
    );
  }
}