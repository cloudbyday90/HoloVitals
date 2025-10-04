/**
 * Custom Application Error Classes
 * Provides structured error handling across the application
 */

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION ERRORS
// ============================================================================

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, true, 'AUTH_ERROR', details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 403, true, 'AUTHORIZATION_ERROR', details);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired', details?: any) {
    super(message, 401, true, 'TOKEN_EXPIRED', details);
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid token', details?: any) {
    super(message, 401, true, 'INVALID_TOKEN', details);
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string = 'Invalid input provided', details?: any) {
    super(message, 400, true, 'INVALID_INPUT', details);
    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}

export class MissingFieldError extends AppError {
  constructor(field: string, details?: any) {
    super(`Required field missing: ${field}`, 400, true, 'MISSING_FIELD', {
      field,
      ...details,
    });
    Object.setPrototypeOf(this, MissingFieldError.prototype);
  }
}

// ============================================================================
// RESOURCE ERRORS
// ============================================================================

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, 404, true, 'NOT_FOUND', details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ResourceExistsError extends AppError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} already exists`, 409, true, 'RESOURCE_EXISTS', details);
    Object.setPrototypeOf(this, ResourceExistsError.prototype);
  }
}

export class ResourceLockedError extends AppError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} is locked`, 423, true, 'RESOURCE_LOCKED', details);
    Object.setPrototypeOf(this, ResourceLockedError.prototype);
  }
}

// ============================================================================
// DATABASE ERRORS
// ============================================================================

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, true, 'DATABASE_ERROR', details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message: string = 'Database connection failed', details?: any) {
    super(message, 503, true, 'DB_CONNECTION_ERROR', details);
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }
}

export class TransactionError extends AppError {
  constructor(message: string = 'Transaction failed', details?: any) {
    super(message, 500, true, 'TRANSACTION_ERROR', details);
    Object.setPrototypeOf(this, TransactionError.prototype);
  }
}

// ============================================================================
// EXTERNAL SERVICE ERRORS
// ============================================================================

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, details?: any) {
    super(
      message || `External service error: ${service}`,
      502,
      true,
      'EXTERNAL_SERVICE_ERROR',
      { service, ...details }
    );
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export class AIServiceError extends AppError {
  constructor(message: string = 'AI service error', details?: any) {
    super(message, 502, true, 'AI_SERVICE_ERROR', details);
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }
}

export class CloudProviderError extends AppError {
  constructor(provider: string, message?: string, details?: any) {
    super(
      message || `Cloud provider error: ${provider}`,
      502,
      true,
      'CLOUD_PROVIDER_ERROR',
      { provider, ...details }
    );
    Object.setPrototypeOf(this, CloudProviderError.prototype);
  }
}

// ============================================================================
// RATE LIMITING & QUOTA ERRORS
// ============================================================================

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 429, true, 'RATE_LIMIT_ERROR', details);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Quota exceeded', details?: any) {
    super(message, 429, true, 'QUOTA_EXCEEDED', details);
    Object.setPrototypeOf(this, QuotaExceededError.prototype);
  }
}

// ============================================================================
// FILE & UPLOAD ERRORS
// ============================================================================

export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed', details?: any) {
    super(message, 400, true, 'FILE_UPLOAD_ERROR', details);
    Object.setPrototypeOf(this, FileUploadError.prototype);
  }
}

export class FileSizeError extends AppError {
  constructor(maxSize: number, actualSize: number, details?: any) {
    super(
      `File size exceeds limit. Max: ${maxSize}MB, Actual: ${actualSize}MB`,
      413,
      true,
      'FILE_SIZE_ERROR',
      { maxSize, actualSize, ...details }
    );
    Object.setPrototypeOf(this, FileSizeError.prototype);
  }
}

export class FileTypeError extends AppError {
  constructor(allowedTypes: string[], actualType: string, details?: any) {
    super(
      `Invalid file type. Allowed: ${allowedTypes.join(', ')}, Received: ${actualType}`,
      415,
      true,
      'FILE_TYPE_ERROR',
      { allowedTypes, actualType, ...details }
    );
    Object.setPrototypeOf(this, FileTypeError.prototype);
  }
}

// ============================================================================
// BUSINESS LOGIC ERRORS
// ============================================================================

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, true, 'BUSINESS_LOGIC_ERROR', details);
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

export class InsufficientFundsError extends AppError {
  constructor(required: number, available: number, details?: any) {
    super(
      `Insufficient funds. Required: $${required}, Available: $${available}`,
      402,
      true,
      'INSUFFICIENT_FUNDS',
      { required, available, ...details }
    );
    Object.setPrototypeOf(this, InsufficientFundsError.prototype);
  }
}

export class ConsentRequiredError extends AppError {
  constructor(message: string = 'Patient consent required', details?: any) {
    super(message, 403, true, 'CONSENT_REQUIRED', details);
    Object.setPrototypeOf(this, ConsentRequiredError.prototype);
  }
}

// ============================================================================
// HIPAA COMPLIANCE ERRORS
// ============================================================================

export class HIPAAViolationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 403, true, 'HIPAA_VIOLATION', details);
    Object.setPrototypeOf(this, HIPAAViolationError.prototype);
  }
}

export class PHIAccessError extends AppError {
  constructor(message: string = 'Unauthorized PHI access', details?: any) {
    super(message, 403, true, 'PHI_ACCESS_ERROR', details);
    Object.setPrototypeOf(this, PHIAccessError.prototype);
  }
}

// ============================================================================
// SYSTEM ERRORS
// ============================================================================

export class SystemError extends AppError {
  constructor(message: string = 'System error occurred', details?: any) {
    super(message, 500, false, 'SYSTEM_ERROR', details);
    Object.setPrototypeOf(this, SystemError.prototype);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string = 'Configuration error', details?: any) {
    super(message, 500, false, 'CONFIGURATION_ERROR', details);
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 503, true, 'SERVICE_UNAVAILABLE', details);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Extract error details for logging
 */
export function getErrorDetails(error: Error) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.stack,
    };
  }

  return {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };
}

/**
 * Create user-friendly error message
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof AppError) {
    // Return the error message as-is for operational errors
    return error.message;
  }

  // Generic message for programming errors
  return 'An unexpected error occurred. Please try again later.';
}