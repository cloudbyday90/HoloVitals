/**
 * Error Screen Component
 * 
 * Displays error message when EHR connection fails
 */

'use client';

import { EHRProvider } from '@/lib/types/ehr';
import { EHR_PROVIDERS } from '@/lib/constants/ehr-providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, RefreshCw, ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react';

interface ErrorScreenProps {
  provider: EHRProvider;
  error: string;
  onRetry: () => void;
  onBack: () => void;
}

export function ErrorScreen({ provider, error, onRetry, onBack }: ErrorScreenProps) {
  const providerInfo = EHR_PROVIDERS[provider];

  // Common error messages and solutions
  const errorSolutions: Record<string, { title: string; solutions: string[] }> = {
    authentication: {
      title: 'Authentication Failed',
      solutions: [
        'Verify your Client ID and Client Secret are correct',
        'Check if your credentials have expired',
        'Ensure your application is registered with the provider',
        'Confirm your OAuth scopes are properly configured',
      ],
    },
    network: {
      title: 'Network Connection Error',
      solutions: [
        'Check your internet connection',
        'Verify the Base URL is correct',
        'Ensure the EHR system is accessible',
        'Check if there are any firewall restrictions',
      ],
    },
    permission: {
      title: 'Permission Denied',
      solutions: [
        'Verify your account has the necessary permissions',
        'Check if your API access is enabled',
        'Confirm your application has been approved',
        'Contact your EHR administrator for access',
      ],
    },
    default: {
      title: 'Connection Failed',
      solutions: [
        'Double-check all credentials are entered correctly',
        'Verify the Base URL matches your environment',
        'Ensure your EHR system is online and accessible',
        'Try again in a few moments',
      ],
    },
  };

  // Determine error type
  const getErrorType = (errorMessage: string): keyof typeof errorSolutions => {
    const lowerError = errorMessage.toLowerCase();
    if (lowerError.includes('auth') || lowerError.includes('credential')) return 'authentication';
    if (lowerError.includes('network') || lowerError.includes('timeout')) return 'network';
    if (lowerError.includes('permission') || lowerError.includes('forbidden')) return 'permission';
    return 'default';
  };

  const errorType = getErrorType(error);
  const errorInfo = errorSolutions[errorType];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Connection Failed</h2>
        <p className="text-muted-foreground">
          We couldn't connect to {providerInfo.displayName}
        </p>
      </div>

      {/* Error Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{errorInfo.title}</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
        </AlertDescription>
      </Alert>

      {/* Troubleshooting Card */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Steps</CardTitle>
          <CardDescription>
            Try these solutions to resolve the connection issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {errorInfo.solutions.map((solution, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="text-sm">{solution}</span>
              </li>
            ))}
          </ul>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              className="w-full"
              size="lg"
              onClick={onRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Help Resources */}
          <div className="pt-4 space-y-2">
            <h4 className="font-semibold text-sm">Need More Help?</h4>
            <div className="space-y-2">
              <a
                href={providerInfo.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View {providerInfo.displayName} Documentation
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="/docs/ehr-troubleshooting"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View Troubleshooting Guide
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="/contact"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Contact Support
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details (Collapsible) */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Show technical details
        </summary>
        <div className="mt-2 p-4 bg-muted rounded-lg">
          <pre className="text-xs overflow-auto">{error}</pre>
        </div>
      </details>
    </div>
  );
}