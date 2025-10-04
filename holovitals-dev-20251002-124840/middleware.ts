/**
 * Next.js Middleware
 * Global middleware for route protection and access control
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ============================================================================
// PROTECTED ROUTES CONFIGURATION
// ============================================================================

const PROTECTED_ROUTES = {
  // Financial routes (OWNER only)
  OWNER_ONLY: [
    '/dashboard/costs',
    '/dashboard/financials',
    '/api/costs',
    '/api/financials',
  ],
  
  // Administrative routes (OWNER/ADMIN)
  ADMIN_ONLY: [
    '/dashboard/admin',
    '/dashboard/users',
    '/api/admin',
  ],
  
  // Instance management (OWNER/ADMIN)
  INSTANCE_MANAGEMENT: [
    '/dashboard/instances',
    '/api/instances',
  ],
  
  // Queue management (OWNER/ADMIN)
  QUEUE_MANAGEMENT: [
    '/dashboard/queue',
    '/api/queue',
  ],
  
  // General authenticated routes
  AUTHENTICATED: [
    '/dashboard',
    '/api/documents',
    '/api/chat',
  ],
};

// ============================================================================
// MIDDLEWARE FUNCTION
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get user session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if user is authenticated
  if (!token) {
    // Redirect to login for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Return 401 for API routes
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }
  }

  const userRole = token?.role as string;

  // Check OWNER-only routes
  if (isOwnerOnlyRoute(pathname)) {
    if (userRole !== 'OWNER') {
      return handleUnauthorizedAccess(request, pathname, 'OWNER', userRole);
    }
  }

  // Check ADMIN-only routes
  if (isAdminOnlyRoute(pathname)) {
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      return handleUnauthorizedAccess(request, pathname, 'ADMIN', userRole);
    }
  }

  // Check instance management routes
  if (isInstanceManagementRoute(pathname)) {
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      return handleUnauthorizedAccess(request, pathname, 'ADMIN', userRole);
    }
  }

  // Check queue management routes
  if (isQueueManagementRoute(pathname)) {
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      return handleUnauthorizedAccess(request, pathname, 'ADMIN', userRole);
    }
  }

  // Add user context to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', token?.sub || '');
  requestHeaders.set('x-user-role', userRole || '');
  requestHeaders.set('x-user-email', token?.email || '');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// ============================================================================
// ROUTE CHECKING FUNCTIONS
// ============================================================================

function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/public',
  ];

  return publicRoutes.some(route => pathname.startsWith(route));
}

function isOwnerOnlyRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.OWNER_ONLY.some(route => pathname.startsWith(route));
}

function isAdminOnlyRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.ADMIN_ONLY.some(route => pathname.startsWith(route));
}

function isInstanceManagementRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.INSTANCE_MANAGEMENT.some(route => pathname.startsWith(route));
}

function isQueueManagementRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.QUEUE_MANAGEMENT.some(route => pathname.startsWith(route));
}

// ============================================================================
// UNAUTHORIZED ACCESS HANDLER
// ============================================================================

function handleUnauthorizedAccess(
  request: NextRequest,
  pathname: string,
  requiredRole: string,
  userRole: string
): NextResponse {
  // For dashboard routes, redirect to access denied page
  if (pathname.startsWith('/dashboard')) {
    const url = new URL('/dashboard/access-denied', request.url);
    url.searchParams.set('required', requiredRole);
    url.searchParams.set('current', userRole);
    url.searchParams.set('path', pathname);
    return NextResponse.redirect(url);
  }

  // For API routes, return 403 Forbidden
  if (pathname.startsWith('/api')) {
    return NextResponse.json(
      {
        error: 'Forbidden - Insufficient permissions',
        required: requiredRole,
        current: userRole,
        message: `This endpoint requires ${requiredRole} role. Your current role is ${userRole}.`,
      },
      { status: 403 }
    );
  }

  // Default: redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};