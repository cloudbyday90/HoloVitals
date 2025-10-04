/**
 * Error Logging API Endpoint
 * Receives client-side errors and logs them
 */

import { NextRequest, NextResponse } from 'next/server';
import { errorLogger } from '@/lib/errors/ErrorLogger';
import { AppError } from '@/lib/errors/AppError';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      message,
      stack,
      componentStack,
      digest,
      timestamp,
      url,
      userAgent,
    } = body;

    // Create error object
    const error = new AppError(
      message || 'Client-side error',
      500,
      true,
      'CLIENT_ERROR',
      {
        stack,
        componentStack,
        digest,
        url,
        userAgent,
      }
    );

    // Get user context from headers
    const userId = req.headers.get('x-user-id') || undefined;
    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || undefined;

    // Log the error
    await errorLogger.logError(error, {
      userId,
      endpoint: url,
      method: 'CLIENT',
      userAgent,
      ipAddress,
    });

    return NextResponse.json(
      { success: true, message: 'Error logged successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to log client error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to log error' },
      { status: 500 }
    );
  }
}