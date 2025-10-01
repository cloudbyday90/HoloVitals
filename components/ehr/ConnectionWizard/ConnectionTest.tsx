/**
 * Connection Test Component
 * 
 * Shows loading state while testing the EHR connection
 */

'use client';

import { EHRProvider } from '@/lib/types/ehr';
import { EHR_PROVIDERS } from '@/lib/constants/ehr-providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

interface ConnectionTestProps {
  provider: EHRProvider;
}

export function ConnectionTest({ provider }: ConnectionTestProps) {
  const providerInfo = EHR_PROVIDERS[provider];
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Validating credentials',
    'Establishing secure connection',
    'Authenticating with OAuth 2.0',
    'Testing API access',
    'Verifying permissions',
  ];

  useEffect(() => {
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update current step based on progress
    const step = Math.floor((progress / 100) * steps.length);
    setCurrentStep(Math.min(step, steps.length - 1));
  }, [progress, steps.length]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Testing Connection</h2>
        <p className="text-muted-foreground">
          Connecting to {providerInfo.displayName}...
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Connection in Progress
          </CardTitle>
          <CardDescription>
            This may take a few moments while we establish a secure connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">{progress}% Complete</p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  index < currentStep
                    ? 'bg-primary/10'
                    : index === currentStep
                    ? 'bg-primary/5'
                    : 'bg-muted/50'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                ) : index === currentStep ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Please wait while we verify your connection...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}