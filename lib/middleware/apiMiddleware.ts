/**
 * API Middleware
 * 
 * Provides common middleware functions for API routes including:
 * - Authentication
 * - Rate limiting
 * - Error handling
 * - Request validation
 * - CORS
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLoggingService } from '@/lib/services/compliance/AuditLoggingService';

const auditService = new AuditLoggingService();

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }
  
  return session;
}

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = { maxRequests: 100, windowMs: 60000 }
): Promise<NextResponse | null> {
  // Get identifier (IP address or user ID)
  const identifier = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  // Clean up expired records
  if (record && now > record.resetAt) {
    rateLimitStore.delete(identifier);
  }
  
  // Check rate limit
  if (record && now <= record.resetAt) {
    if (record.count >= options.maxRequests) {
      // Log rate limit exceeded
      await auditService.log({
        eventType: 'RATE_LIMIT_EXCEEDED',
        category: 'SECURITY',
        outcome: 'FAILURE',
        description: `Rate limit exceeded for ${identifier}`,
        metadata: {
          identifier,
          count: record.count,
          maxRequests: options.maxRequests,
        },
      });
      
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((record.resetAt - now) / 1000).toString(),
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetAt).toISOString(),
          },
        }
      );
    }
    
    // Increment count
    record.count++;
  } else {
    // Create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
  }
  
  return null; // No rate limit error
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function handleApiError(error: ApiError) {
  console.error('API Error:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    },
    { status: statusCode }
  );
}

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

export function corsHeaders(origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const isAllowed = allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin));
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// ============================================================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================================================

export async function validateRequest<T>(
  request: NextRequest,
  schema: any
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json();
    const validationResult = schema.safeParse(body);
    
    if (!validationResult.success) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Invalid request data',
            details: validationResult.error.errors,
          },
          { status: 400 }
        ),
      };
    }
    
    return { data: validationResult.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      ),
    };
  }
}

// ============================================================================
// COMBINED MIDDLEWARE WRAPPER
// ============================================================================

interface MiddlewareOptions {
  requireAuth?: boolean;
  rateLimit?: RateLimitOptions;
  cors?: boolean;
}

export function withMiddleware(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest, context?: any) => {
    try {
      // CORS
      if (options.cors) {
        if (request.method === 'OPTIONS') {
          return new NextResponse(null, {
            status: 204,
            headers: corsHeaders(request.headers.get('origin') || undefined),
          });
        }
      }
      
      // Rate limiting
      if (options.rateLimit) {
        const rateLimitError = await rateLimit(request, options.rateLimit);
        if (rateLimitError) return rateLimitError;
      }
      
      // Authentication
      if (options.requireAuth) {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
          return authResult;
        }
      }
      
      // Execute handler
      const response = await handler(request, context);
      
      // Add CORS headers to response
      if (options.cors) {
        const headers = corsHeaders(request.headers.get('origin') || undefined);
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    } catch (error) {
      return handleApiError(error as ApiError);
    }
  };
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

export async function checkPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  // TODO: Implement proper permission checking
  // For now, return true
  return true;
}

export async function requirePermission(
  userId: string,
  permission: string
): Promise<NextResponse | null> {
  const hasPermission = await checkPermission(userId, permission);
  
  if (!hasPermission) {
    await auditService.log({
      userId,
      eventType: 'PERMISSION_DENIED',
      category: 'SECURITY',
      outcome: 'FAILURE',
      description: `Permission denied: ${permission}`,
      metadata: {
        permission,
      },
    });
    
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
      },
      { status: 403 }
    );
  }
  
  return null;
}