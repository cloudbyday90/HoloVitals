/**
 * Global Error Handler
 * Handles errors in API routes and returns appropriate responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError, getUserFriendlyMessage } from './AppError';
import { errorLogger } from './ErrorLogger';
import { Prisma } from '@prisma/client';

// ============================================================================
// ERROR RESPONSE INTERFACE
// ============================================================================

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

export async function handleError(
  error: Error,
  req?: NextRequest,
  context?: {
    userId?: string;
    requestId?: string;
  }
): Promise<NextResponse<ErrorResponse>> {
  // Extract request context
  const endpoint = req?.nextUrl.pathname;
  const method = req?.method;
  const userAgent = req?.headers.get('user-agent') || undefined;
  const ipAddress = req?.ip || req?.headers.get('x-forwarded-for') || undefined;

  // Log the error
  await errorLogger.logError(error, {
    userId: context?.userId,
    requestId: context?.requestId,
    endpoint,
    method,
    userAgent,
    ipAddress,
  });

  // Handle different error types
  if (error instanceof AppError) {
    return handleAppError(error, context?.requestId);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, context?.requestId);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return handlePrismaValidationError(error, context?.requestId);
  }

  // Handle unknown errors
  return handleUnknownError(error, context?.requestId);
}

// ============================================================================
// SPECIFIC ERROR HANDLERS
// ============================================================================

/**
 * Handle AppError instances
 */
function handleAppError(
  error: AppError,
  requestId?: string
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: error.timestamp.toISOString(),
      requestId,
    },
  };

  return NextResponse.json(response, { status: error.statusCode });
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  requestId?: string
): NextResponse<ErrorResponse> {
  let message = 'Database operation failed';
  let statusCode = 500;
  let code = 'DATABASE_ERROR';

  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      message = 'A record with this value already exists';
      statusCode = 409;
      code = 'DUPLICATE_RECORD';
      break;

    case 'P2025':
      // Record not found
      message = 'Record not found';
      statusCode = 404;
      code = 'NOT_FOUND';
      break;

    case 'P2003':
      // Foreign key constraint violation
      message = 'Related record not found';
      statusCode = 400;
      code = 'FOREIGN_KEY_VIOLATION';
      break;

    case 'P2014':
      // Required relation violation
      message = 'Required relation missing';
      statusCode = 400;
      code = 'RELATION_VIOLATION';
      break;

    case 'P2021':
      // Table does not exist
      message = 'Database table not found';
      statusCode = 500;
      code = 'TABLE_NOT_FOUND';
      break;

    case 'P2024':
      // Connection timeout
      message = 'Database connection timeout';
      statusCode = 503;
      code = 'DB_TIMEOUT';
      break;
  }

  const response: ErrorResponse = {
    error: {
      message,
      code,
      statusCode,
      details: {
        prismaCode: error.code,
        meta: error.meta,
      },
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle Prisma validation errors
 */
function handlePrismaValidationError(
  error: Prisma.PrismaClientValidationError,
  requestId?: string
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    error: {
      message: 'Invalid data provided',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: {
        validationError: error.message,
      },
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return NextResponse.json(response, { status: 400 });
}

/**
 * Handle unknown errors
 */
function handleUnknownError(
  error: Error,
  requestId?: string
): NextResponse<ErrorResponse> {
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response: ErrorResponse = {
    error: {
      message: isDevelopment
        ? error.message
        : 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      details: isDevelopment
        ? {
            name: error.name,
            stack: error.stack,
          }
        : undefined,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return NextResponse.json(response, { status: 500 });
}

// ============================================================================
// ERROR HANDLER WRAPPER FOR API ROUTES
// ============================================================================

/**
 * Wraps an API route handler with error handling
 */
export function withErrorHandler<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      // Generate request ID
      const requestId = req.headers.get('x-request-id') || generateRequestId();

      // Extract user ID from request headers (set by auth middleware)
      const userId = req.headers.get('x-user-id') || undefined;

      return handleError(error as Error, req, { userId, requestId });
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create error response for client
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    error: {
      message,
      code,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Check if error should be retried
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof AppError) {
    // Retry on service unavailable, timeout, rate limit
    return (
      error.statusCode === 503 ||
      error.statusCode === 504 ||
      error.statusCode === 429 ||
      error.code === 'DB_TIMEOUT' ||
      error.code === 'EXTERNAL_SERVICE_ERROR'
    );
  }

  return false;
}

/**
 * Get retry delay based on attempt number
 */
export function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attempt), 16000);
}