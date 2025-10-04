/**
 * Audit Logging Middleware
 * 
 * Automatically logs all HTTP requests and responses for HIPAA compliance.
 * Captures PHI access, authentication events, and security incidents.
 */

import { Request, Response, NextFunction } from 'express';
import { auditLogging } from '../services/AuditLoggingService';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface AuditMiddlewareOptions {
  excludePaths?: string[];
  excludePatterns?: RegExp[];
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  sensitiveFields?: string[];
  phiRoutes?: string[];
}

// ============================================================================
// AUDIT MIDDLEWARE
// ============================================================================

/**
 * Create audit logging middleware
 */
export function createAuditMiddleware(options: AuditMiddlewareOptions = {}) {
  const {
    excludePaths = ['/health', '/metrics', '/favicon.ico'],
    excludePatterns = [],
    logRequestBody = true,
    logResponseBody = false,
    sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'ssn', 'creditCard'],
    phiRoutes = ['/api/patients', '/api/lab-results', '/api/medical-records'],
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (shouldExclude(req.path, excludePaths, excludePatterns)) {
      return next();
    }

    const startTime = Date.now();
    const requestId = generateRequestId();

    // Store request ID for correlation
    (req as any).requestId = requestId;

    // Extract audit context
    const context = auditLogging.extractContext(req);

    // Determine if this is a PHI-related route
    const isPHIRoute = phiRoutes.some(route => req.path.startsWith(route));

    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody: any;

    // Override response methods to capture response
    res.send = function (body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.json = function (body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Log request on response finish
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      try {
        // Determine event type based on request
        const eventType = determineEventType(req, statusCode);
        const eventCategory = determineEventCategory(req);

        // Sanitize request body
        const sanitizedRequestBody = logRequestBody
          ? sanitizeData(req.body, sensitiveFields)
          : undefined;

        // Sanitize response body
        const sanitizedResponseBody = logResponseBody
          ? sanitizeData(responseBody, sensitiveFields)
          : undefined;

        // Determine outcome
        const outcome = determineOutcome(statusCode);

        // Determine risk level
        const riskLevel = determineRiskLevel(req, statusCode, isPHIRoute);

        // Extract patient ID if present
        const patientId = extractPatientId(req);

        // Log the request
        await auditLogging.log({
          context,
          eventType,
          eventCategory,
          action: `${req.method} ${req.path}`,
          resourceType: extractResourceType(req),
          resourceId: extractResourceId(req),
          outcome,
          phiAccessed: isPHIRoute,
          patientId,
          accessReason: extractAccessReason(req),
          dataAccessed: isPHIRoute ? extractDataAccessed(req) : undefined,
          requestDetails: {
            requestId,
            method: req.method,
            path: req.path,
            body: sanitizedRequestBody,
            responseCode: statusCode,
          },
          riskLevel,
          metadata: {
            duration,
            query: req.query,
            params: req.params,
          },
          tags: generateTags(req, isPHIRoute),
        });

        // Check for suspicious activity
        if (shouldCreateSecurityAlert(req, statusCode)) {
          await createSecurityAlert(context, req, statusCode);
        }
      } catch (error) {
        console.error('Audit logging failed:', error);
        // Don't throw - audit logging should not break application flow
      }
    });

    next();
  };
}

/**
 * Middleware specifically for PHI access logging
 */
export function phiAccessMiddleware(options: {
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'PRINT';
  extractPatientId: (req: Request) => string;
  extractDataAccessed: (req: Request) => string[];
  extractAccessReason?: (req: Request) => string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context = auditLogging.extractContext(req);

    // Log PHI access on response finish
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const patientId = options.extractPatientId(req);
          const dataAccessed = options.extractDataAccessed(req);
          const accessReason = options.extractAccessReason
            ? options.extractAccessReason(req)
            : 'Treatment';

          await auditLogging.logPHIAccess(context, {
            patientId,
            dataAccessed,
            accessReason,
            action: options.action,
          });
        } catch (error) {
          console.error('PHI access logging failed:', error);
        }
      }
    });

    next();
  };
}

/**
 * Middleware for authentication event logging
 */
export function authenticationMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context = auditLogging.extractContext(req);

    res.on('finish', async () => {
      try {
        const path = req.path.toLowerCase();
        let eventType: any;

        if (path.includes('/login')) {
          eventType = res.statusCode === 200 ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE';
        } else if (path.includes('/logout')) {
          eventType = 'LOGOUT';
        } else if (path.includes('/password/change')) {
          eventType = 'PASSWORD_CHANGE';
        } else if (path.includes('/password/reset')) {
          eventType = 'PASSWORD_RESET';
        } else {
          return; // Not an authentication endpoint
        }

        await auditLogging.logAuthentication(context, eventType, {
          reason: res.statusCode !== 200 ? 'Authentication failed' : undefined,
          mfaUsed: (req.body as any)?.mfaToken !== undefined,
        });
      } catch (error) {
        console.error('Authentication logging failed:', error);
      }
    });

    next();
  };
}

/**
 * Middleware for data modification logging
 */
export function dataModificationMiddleware(options: {
  resourceType: string;
  extractResourceId: (req: Request) => string;
  extractResourceName?: (req: Request) => string;
  extractChanges?: (req: Request) => any;
  phiInvolved?: boolean;
  extractPatientId?: (req: Request) => string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context = auditLogging.extractContext(req);

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          let action: 'CREATE' | 'UPDATE' | 'DELETE';

          if (req.method === 'POST') action = 'CREATE';
          else if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
          else if (req.method === 'DELETE') action = 'DELETE';
          else return; // Not a modification operation

          const resourceId = options.extractResourceId(req);
          const resourceName = options.extractResourceName
            ? options.extractResourceName(req)
            : undefined;
          const changes = options.extractChanges
            ? options.extractChanges(req)
            : req.body;
          const patientId = options.extractPatientId
            ? options.extractPatientId(req)
            : undefined;

          await auditLogging.logDataModification(context, {
            action,
            resourceType: options.resourceType,
            resourceId,
            resourceName,
            changes,
            phiInvolved: options.phiInvolved,
            patientId,
          });
        } catch (error) {
          console.error('Data modification logging failed:', error);
        }
      }
    });

    next();
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if path should be excluded from audit logging
 */
function shouldExclude(
  path: string,
  excludePaths: string[],
  excludePatterns: RegExp[]
): boolean {
  if (excludePaths.includes(path)) return true;
  return excludePatterns.some(pattern => pattern.test(path));
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize sensitive data
 */
function sanitizeData(data: any, sensitiveFields: string[]): any {
  if (!data) return data;
  if (typeof data !== 'object') return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key], sensitiveFields);
    }
  }

  return sanitized;
}

/**
 * Determine event type based on request
 */
function determineEventType(req: Request, statusCode: number): string {
  const method = req.method;
  const path = req.path.toLowerCase();

  // Authentication events
  if (path.includes('/login')) {
    return statusCode === 200 ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE';
  }
  if (path.includes('/logout')) return 'LOGOUT';

  // Data access events
  if (method === 'GET') return 'RECORD_ACCESSED';
  if (method === 'POST') return 'PHI_CREATED';
  if (method === 'PUT' || method === 'PATCH') return 'PHI_UPDATED';
  if (method === 'DELETE') return 'PHI_DELETED';

  return 'RECORD_ACCESSED';
}

/**
 * Determine event category
 */
function determineEventCategory(req: Request): string {
  const path = req.path.toLowerCase();

  if (path.includes('/login') || path.includes('/logout') || path.includes('/auth')) {
    return 'AUTHENTICATION';
  }
  if (path.includes('/admin') || path.includes('/config')) {
    return 'ADMINISTRATIVE';
  }
  if (req.method === 'GET') {
    return 'DATA_ACCESS';
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return 'DATA_MODIFICATION';
  }

  return 'SYSTEM';
}

/**
 * Determine outcome based on status code
 */
function determineOutcome(statusCode: number): 'SUCCESS' | 'FAILURE' | 'DENIED' | 'ERROR' {
  if (statusCode >= 200 && statusCode < 300) return 'SUCCESS';
  if (statusCode === 401 || statusCode === 403) return 'DENIED';
  if (statusCode >= 400 && statusCode < 500) return 'FAILURE';
  if (statusCode >= 500) return 'ERROR';
  return 'SUCCESS';
}

/**
 * Determine risk level
 */
function determineRiskLevel(
  req: Request,
  statusCode: number,
  isPHIRoute: boolean
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  // Failed authentication attempts
  if (req.path.includes('/login') && statusCode !== 200) return 'MEDIUM';

  // Unauthorized access attempts
  if (statusCode === 401 || statusCode === 403) return 'MEDIUM';

  // PHI deletion or export
  if (isPHIRoute && (req.method === 'DELETE' || req.path.includes('/export'))) {
    return 'HIGH';
  }

  // PHI access
  if (isPHIRoute) return 'MEDIUM';

  // Server errors
  if (statusCode >= 500) return 'HIGH';

  return 'LOW';
}

/**
 * Extract patient ID from request
 */
function extractPatientId(req: Request): string | undefined {
  return req.params.patientId || req.query.patientId as string || (req.body as any)?.patientId;
}

/**
 * Extract resource type from request
 */
function extractResourceType(req: Request): string | undefined {
  const path = req.path.split('/').filter(Boolean);
  if (path.length >= 2 && path[0] === 'api') {
    return path[1].toUpperCase();
  }
  return undefined;
}

/**
 * Extract resource ID from request
 */
function extractResourceId(req: Request): string | undefined {
  const path = req.path.split('/').filter(Boolean);
  if (path.length >= 3 && path[0] === 'api') {
    return path[2];
  }
  return undefined;
}

/**
 * Extract access reason from request
 */
function extractAccessReason(req: Request): string | undefined {
  return (req.headers['x-access-reason'] as string) || 'Treatment';
}

/**
 * Extract data accessed from request
 */
function extractDataAccessed(req: Request): string[] | undefined {
  const fields = req.query.fields as string;
  if (fields) {
    return fields.split(',');
  }
  return undefined;
}

/**
 * Generate tags for audit log
 */
function generateTags(req: Request, isPHIRoute: boolean): string[] {
  const tags: string[] = [];

  if (isPHIRoute) tags.push('phi');
  if (req.path.includes('/admin')) tags.push('admin');
  if (req.path.includes('/api')) tags.push('api');
  if (req.method === 'DELETE') tags.push('deletion');
  if (req.path.includes('/export')) tags.push('export');

  return tags;
}

/**
 * Check if security alert should be created
 */
function shouldCreateSecurityAlert(req: Request, statusCode: number): boolean {
  // Multiple failed login attempts
  if (req.path.includes('/login') && statusCode === 401) return true;

  // Unauthorized access attempts
  if (statusCode === 403) return true;

  // SQL injection attempts
  if (containsSQLInjectionPattern(req)) return true;

  // XSS attempts
  if (containsXSSPattern(req)) return true;

  return false;
}

/**
 * Check for SQL injection patterns
 */
function containsSQLInjectionPattern(req: Request): boolean {
  const patterns = [
    /(\bOR\b|\bAND\b).*=.*\b/i,
    /UNION.*SELECT/i,
    /DROP.*TABLE/i,
    /INSERT.*INTO/i,
    /DELETE.*FROM/i,
  ];

  const checkString = JSON.stringify(req.query) + JSON.stringify(req.body);
  return patterns.some(pattern => pattern.test(checkString));
}

/**
 * Check for XSS patterns
 */
function containsXSSPattern(req: Request): boolean {
  const patterns = [
    /<script[^>]*>.*<\/script>/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
  ];

  const checkString = JSON.stringify(req.query) + JSON.stringify(req.body);
  return patterns.some(pattern => pattern.test(checkString));
}

/**
 * Create security alert
 */
async function createSecurityAlert(
  context: any,
  req: Request,
  statusCode: number
): Promise<void> {
  try {
    let alertType = 'SUSPICIOUS_ACTIVITY';
    let description = 'Suspicious activity detected';

    if (req.path.includes('/login') && statusCode === 401) {
      alertType = 'FAILED_LOGIN_ATTEMPTS';
      description = 'Failed login attempt detected';
    } else if (statusCode === 403) {
      alertType = 'UNAUTHORIZED_ACCESS_ATTEMPT';
      description = 'Unauthorized access attempt detected';
    } else if (containsSQLInjectionPattern(req)) {
      alertType = 'SQL_INJECTION_ATTEMPT';
      description = 'Potential SQL injection attempt detected';
    } else if (containsXSSPattern(req)) {
      alertType = 'XSS_ATTEMPT';
      description = 'Potential XSS attempt detected';
    }

    await auditLogging.logSecurityEvent(context, {
      eventType: alertType,
      severity: statusCode === 403 || alertType.includes('INJECTION') ? 'HIGH' : 'MEDIUM',
      description,
      indicators: {
        path: req.path,
        method: req.method,
        statusCode,
        query: req.query,
        body: req.body,
      },
    });
  } catch (error) {
    console.error('Failed to create security alert:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createAuditMiddleware,
  phiAccessMiddleware,
  authenticationMiddleware,
  dataModificationMiddleware,
};