'use client'

/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// ERROR BOUNDARY PROPS & STATE
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // For now, just log to console
    console.error('Error logged:', errorData);

    // In production, send to backend
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(err => console.error('Failed to log error:', err));
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/dashboard';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl w-full">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-bold text-center text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-center text-gray-800 mb-8">
              We're sorry for the inconvenience. An unexpected error has occurred.
            </p>

            {/* Error Details (Development Only) */}
            {this.props.showDetails && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2 mb-2">
                  <Bug className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900 mb-1">
                      Error Details
                    </h3>
                    <p className="text-sm text-red-800 font-mono mb-2">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <details className="text-xs text-red-700">
                        <summary className="cursor-pointer hover:text-red-900">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 p-2 bg-red-100 rounded overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>

              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-700">
                If this problem persists, please{' '}
                <a
                  href="/support"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  contact support
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// CONVENIENCE WRAPPER COMPONENTS
// ============================================================================

/**
 * Page-level error boundary
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        console.error('Page Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Component-level error boundary with minimal UI
 */
export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900 mb-1">
                Component Error
              </h3>
              <p className="text-sm text-red-800">
                This component failed to load. Please refresh the page.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Silent error boundary (logs but doesn't show UI)
 */
export function SilentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={null}
      onError={(error, errorInfo) => {
        console.error('Silent Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}