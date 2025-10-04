import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, query, userId } = body;

    if (!documentId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId and query' },
        { status: 400 }
      );
    }

    // In production, get userId from session/auth
    const effectiveUserId = userId || 'demo-user';

    // Analyze with AI
    const response = await aiService.analyzeWithContext(
      query,
      documentId,
      effectiveUserId
    );

    return NextResponse.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}