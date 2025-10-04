/**
 * Error Utility Functions
 * Helper functions for error handling
 */

import { AppError } from '../errors/AppError';
import { error as toastError } from '@/hooks/useToast';

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Handle API errors and show toast notifications
 */
export async function handleApiError(error: any): Promise<void> {
  if (error instanceof AppError) {
    toastError(error.message, error.details?.message);
  } else if (error.response) {
    // HTTP error response
    const data = await error.response.json().catch(() => ({}));
    toastError(
      data.error?.message || 'An error occurred',
      data.error?.details?.message
    );
  } else if (error.message) {
    toastError('Error', error.message);
  } else {
    toastError('Error', 'An unexpected error occurred');
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Safe async function wrapper
 */
export function safeAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R | null> {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Safe async error:', error);
      handleApiError(error);
      return null;
    }
  };
}

/**
 * Validate response status
 */
export function validateResponse(response: Response): void {
  if (!response.ok) {
    throw new AppError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      true,
      'HTTP_ERROR'
    );
  }
}

/**
 * Parse error from fetch response
 */
export async function parseErrorResponse(response: Response): Promise<AppError> {
  try {
    const data = await response.json();
    return new AppError(
      data.error?.message || 'Request failed',
      response.status,
      true,
      data.error?.code,
      data.error?.details
    );
  } catch {
    return new AppError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      true,
      'HTTP_ERROR'
    );
  }
}

/**
 * Create error from unknown type
 */
export function createError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }

  return new Error('An unknown error occurred');
}

/**
 * Check if error is network error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError')
  );
}

/**
 * Check if error is timeout error
 */
export function isTimeoutError(error: Error): boolean {
  return (
    error.message.includes('timeout') ||
    error.message.includes('timed out') ||
    (error instanceof AppError && error.code === 'TIMEOUT_ERROR')
  );
}

/**
 * Format error for display
 */
export function formatErrorMessage(error: Error): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again.';
  }

  return error.message || 'An unexpected error occurred';
}

/**
 * Get error severity
 */
export function getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) return 'critical';
    if (error.statusCode === 403 || error.code === 'HIPAA_VIOLATION') return 'high';
    if (error.statusCode === 400 || error.statusCode === 404) return 'medium';
    return 'low';
  }

  return 'critical';
}

// ============================================================================
// FORM ERROR UTILITIES
// ============================================================================

/**
 * Extract field errors from validation error
 */
export function extractFieldErrors(error: AppError): Record<string, string> {
  if (error.code !== 'VALIDATION_ERROR' || !error.details) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  if (Array.isArray(error.details.errors)) {
    error.details.errors.forEach((err: any) => {
      if (err.field && err.message) {
        fieldErrors[err.field] = err.message;
      }
    });
  }

  return fieldErrors;
}

/**
 * Create validation error from field errors
 */
export function createValidationError(
  fieldErrors: Record<string, string>
): AppError {
  const errors = Object.entries(fieldErrors).map(([field, message]) => ({
    field,
    message,
  }));

  return new AppError(
    'Validation failed',
    400,
    true,
    'VALIDATION_ERROR',
    { errors }
  );
}

// ============================================================================
// ASYNC ERROR BOUNDARY
// ============================================================================

/**
 * Wrap async function with error boundary
 */
export function withErrorBoundary<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  onError?: (error: Error) => void
): (...args: T) => Promise<R | undefined> {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = createError(error);
      console.error('Error boundary caught:', err);
      
      if (onError) {
        onError(err);
      } else {
        handleApiError(err);
      }
      
      return undefined;
    }
  };
}