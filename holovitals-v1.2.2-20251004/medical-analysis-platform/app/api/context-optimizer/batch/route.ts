/**
 * Batch Context Optimizer API
 * 
 * Endpoint for optimizing multiple contexts in a single request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { contextOptimizer, OptimizationStrategy, ContentType } from '@/lib/services/ContextOptimizerService';

/**
 * POST /api/context-optimizer/batch
 * Batch optimize multiple contexts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requests } = body;

    // Validate requests array
    if (!Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json(
        { error: 'requests must be a non-empty array' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (requests.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 requests per batch' },
        { status: 400 }
      );
    }

    // Validate each request
    for (const req of requests) {
      if (!req.content || typeof req.content !== 'string') {
        return NextResponse.json(
          { error: 'Each request must have a content string' },
          { status: 400 }
        );
      }

      if (req.strategy && !Object.values(OptimizationStrategy).includes(req.strategy)) {
        return NextResponse.json(
          { error: 'Invalid optimization strategy in one or more requests' },
          { status: 400 }
        );
      }

      if (req.contentType && !Object.values(ContentType).includes(req.contentType)) {
        return NextResponse.json(
          { error: 'Invalid content type in one or more requests' },
          { status: 400 }
        );
      }
    }

    // Process batch
    const results = await contextOptimizer.batchOptimize(requests);

    // Calculate aggregate statistics
    const totalOriginalTokens = results.reduce((sum, r) => sum + r.originalTokens, 0);
    const totalOptimizedTokens = results.reduce((sum, r) => sum + r.optimizedTokens, 0);
    const totalReduction = ((totalOriginalTokens - totalOptimizedTokens) / totalOriginalTokens) * 100;
    const averageQuality = results.reduce((sum, r) => sum + r.metrics.qualityScore, 0) / results.length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          totalRequests: results.length,
          totalOriginalTokens,
          totalOptimizedTokens,
          totalTokensSaved: totalOriginalTokens - totalOptimizedTokens,
          averageReduction: Math.round(totalReduction * 100) / 100,
          averageQualityScore: Math.round(averageQuality * 100) / 100,
          estimatedCostSavings: Math.round(((totalOriginalTokens - totalOptimizedTokens) / 1000000) * 15 * 100) / 100
        }
      }
    });

  } catch (error: any) {
    console.error('Batch optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process batch optimization' },
      { status: 500 }
    );
  }
}