/**
 * Analysis Queue Task API
 * 
 * Endpoints for managing individual tasks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { analysisQueue } from '@/lib/services/AnalysisQueueService';

/**
 * GET /api/analysis-queue/[taskId]
 * Get task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    const task = await analysisQueue.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task
    });

  } catch (error: any) {
    console.error('Failed to get task:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analysis-queue/[taskId]?userId=xxx
 * Cancel a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const cancelled = await analysisQueue.cancelTask(taskId, userId);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Task not found or cannot be cancelled' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task cancelled successfully'
    });

  } catch (error: any) {
    console.error('Failed to cancel task:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel task' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/analysis-queue/[taskId]/progress
 * Update task progress
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const body = await request.json();
    const { progress } = body;

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'progress must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    await analysisQueue.updateTaskProgress(taskId, progress);

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully'
    });

  } catch (error: any) {
    console.error('Failed to update progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update progress' },
      { status: 500 }
    );
  }
}