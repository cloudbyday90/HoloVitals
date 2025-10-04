/**
 * Analysis Queue API
 * 
 * Endpoints for managing analysis tasks in the queue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { analysisQueue, TaskPriority, TaskType, TaskStatus } from '@/lib/services/AnalysisQueueService';

/**
 * POST /api/analysis-queue
 * Submit a new analysis task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      type,
      priority,
      data,
      metadata
    } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!type || !Object.values(TaskType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid task type' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !Object.values(TaskPriority).includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      );
    }

    // Submit task
    const task = await analysisQueue.submitTask({
      userId,
      type,
      priority: priority || TaskPriority.NORMAL,
      data,
      metadata
    });

    return NextResponse.json({
      success: true,
      data: task
    });

  } catch (error: any) {
    console.error('Failed to submit task:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit task' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analysis-queue?userId=xxx&status=xxx&type=xxx
 * Get tasks for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(TaskStatus).includes(status as TaskStatus)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (type && !Object.values(TaskType).includes(type as TaskType)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    const tasks = await analysisQueue.getUserTasks(userId, {
      status: status as TaskStatus | undefined,
      type: type as TaskType | undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    return NextResponse.json({
      success: true,
      data: tasks
    });

  } catch (error: any) {
    console.error('Failed to get tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tasks' },
      { status: 500 }
    );
  }
}