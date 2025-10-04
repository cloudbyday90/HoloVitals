/**
 * Security Middleware
 * 
 * Provides comprehensive security features including:
 * - Security headers
 * - Rate limiting
 * - IP filtering
 * - CSRF protection
 * - XSS protection
 */

import { Request, Response, NextFunction } from 'express';
import { securityService } from '../services/SecurityService';

// ============================================================================
// SECURITY HEADERS MIDDLEWARE
// ============================================================================

/**
 * Add security headers to all responses
 */
export function securityHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Strict-Transport-Security (HSTS)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Content-Security-Policy (CSP)
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    );

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    next();
  };
}

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(options: {
  maxAttempts: number;
  windowMinutes: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) {
  const {
    maxAttempts,
    windowMinutes,
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = keyGenerator(req);
    const action = `${req.method}:${req.path}`;

    try {
      const result = await securityService.checkRateLimit({
        identifier,
        action,
        maxAttempts,
        windowMinutes,
      });

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxAttempts.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.resetAt.toISOString(),
        });
      }

      // Reset rate limit on successful request if configured
      if (skipSuccessfulRequests) {
        res.on('finish', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            securityService.resetRateLimit(identifier, action);
          }
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Don't block request on rate limiting error
      next();
    }
  };
}

/**
 * Login rate limiting middleware
 */
export function loginRateLimitMiddleware() {
  return rateLimitMiddleware({
    maxAttempts: 5,
    windowMinutes: 15,
    keyGenerator: (req) => {
      // Use email/username if provided, otherwise IP
      const email = (req.body as any)?.email || (req.body as any)?.username;
      return email || req.ip || 'unknown';
    },
    skipSuccessfulRequests: true,
  });
}

/**
 * API rate limiting middleware
 */
export function apiRateLimitMiddleware() {
  return rateLimitMiddleware({
    maxAttempts: 100,
    windowMinutes: 15,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      const userId = (req as any).user?.id;
      return userId || req.ip || 'unknown';
    },
  });
}

// ============================================================================
// IP FILTERING MIDDLEWARE
// ============================================================================

/**
 * IP filtering middleware
 */
export function ipFilterMiddleware(options: {
  enforceWhitelist?: boolean;
  enforceBlacklist?: boolean;
}) {
  const { enforceWhitelist = false, enforceBlacklist = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const ipAddress = req.ip || 'unknown';

    try {
      // Check blacklist
      if (enforceBlacklist && securityService.isIPBlacklisted(ipAddress)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Your IP address has been blocked.',
        });
      }

      // Check whitelist
      if (enforceWhitelist && !securityService.isIPWhitelisted(ipAddress)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Your IP address is not authorized.',
        });
      }

      next();
    } catch (error) {
      console.error('IP filtering error:', error);
      // Don't block request on IP filtering error
      next();
    }
  };
}

// ============================================================================
// CSRF PROTECTION MIDDLEWARE
// ============================================================================

/**
 * CSRF token generation and validation
 */
export function csrfProtectionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF check for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Get CSRF token from header or body
    const token = req.headers['x-csrf-token'] || (req.body as any)?._csrf;
    const sessionToken = (req as any).session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid CSRF token',
        message: 'CSRF token validation failed.',
      });
    }

    next();
  };
}

/**
 * Generate CSRF token for session
 */
export function generateCSRFToken(req: Request): string {
  const token = require('crypto').randomBytes(32).toString('hex');
  if ((req as any).session) {
    (req as any).session.csrfToken = token;
  }
  return token;
}

// ============================================================================
// INPUT VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInputMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    next();
  };
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ============================================================================
// SQL INJECTION PROTECTION
// ============================================================================

/**
 * Detect and block SQL injection attempts
 */
export function sqlInjectionProtectionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const sqlPatterns = [
      /(\bOR\b|\bAND\b).*=.*\b/i,
      /UNION.*SELECT/i,
      /DROP.*TABLE/i,
      /INSERT.*INTO/i,
      /DELETE.*FROM/i,
      /UPDATE.*SET/i,
      /EXEC(\s|\+)+(s|x)p\w+/i,
    ];

    const checkString = JSON.stringify({
      query: req.query,
      body: req.body,
      params: req.params,
    });

    for (const pattern of sqlPatterns) {
      if (pattern.test(checkString)) {
        // Log security event
        securityService.createSecurityAlert({
          alertType: 'SQL_INJECTION_ATTEMPT',
          severity: 'HIGH',
          title: 'SQL Injection Attempt Detected',
          description: 'Potential SQL injection attempt blocked',
          ipAddress: req.ip,
          indicators: {
            path: req.path,
            method: req.method,
            pattern: pattern.toString(),
          },
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Request contains potentially malicious content.',
        });
      }
    }

    next();
  };
}

// ============================================================================
// SESSION VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate session and check for anomalies
 */
export function sessionValidationMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const sessionToken = req.headers['authorization']?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No session token provided.',
      });
    }

    try {
      const session = await securityService.validateSession(sessionToken);

      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired session.',
        });
      }

      // Check if IP address matches
      if (session.ipAddress !== req.ip) {
        await securityService.createSecurityAlert({
          alertType: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          title: 'IP Address Mismatch',
          description: 'Session accessed from different IP address',
          userId: session.userId,
          ipAddress: req.ip,
          indicators: {
            originalIP: session.ipAddress,
            currentIP: req.ip,
          },
        });
      }

      // Attach session to request
      (req as any).session = session;
      (req as any).user = { id: session.userId };

      next();
    } catch (error) {
      console.error('Session validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Session validation failed.',
      });
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  securityHeadersMiddleware,
  rateLimitMiddleware,
  loginRateLimitMiddleware,
  apiRateLimitMiddleware,
  ipFilterMiddleware,
  csrfProtectionMiddleware,
  generateCSRFToken,
  sanitizeInputMiddleware,
  sqlInjectionProtectionMiddleware,
  sessionValidationMiddleware,
};