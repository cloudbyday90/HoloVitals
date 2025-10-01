/**
 * Connection Wizard Component
 * 
 * Main wizard component that orchestrates the EHR connection flow
 */

'use client';

import { useConnectionWizard } from '@/lib/hooks/useConnectionWizard';
import { ProviderSelector } from './ProviderSelector';
import { CredentialsForm } from './CredentialsForm';
import { ConnectionTest } from './ConnectionTest';
import { SuccessScreen } from './SuccessScreen';
import { ErrorScreen } from './ErrorScreen';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ConnectionWizardProps {
  patientId: string;
}

export function ConnectionWizard({ patientId }: ConnectionWizardProps) {
  const {
    state,
    isLoading,
    selectProvider,
    submitCredentials,
    retry,
    reset,
    goBack,
  } = useConnectionWizard(patientId);

  // Calculate progress percentage
  const getProgress = () => {
    switch (state.currentStep) {
      case 'provider':
        return 0;
      case 'credentials':
        return 25;
      case 'testing':
        return 50;
      case 'success':
        return 100;
      case 'error':
        return 50;
      default:
        return 0;
    }
  };

  const progress = getProgress();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Progress Bar */}
      {state.currentStep !== 'success' && (
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {state.currentStep === 'provider' ? '1' : state.currentStep === 'credentials' ? '2' : '3'} of 3</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}

      {/* Wizard Steps */}
      <div className="min-h-[600px]">
        {state.currentStep === 'provider' && (
          <ProviderSelector
            selectedProvider={state.selectedProvider}
            onSelect={selectProvider}
          />
        )}

        {state.currentStep === 'credentials' && state.selectedProvider && (
          <CredentialsForm
            provider={state.selectedProvider}
            onSubmit={submitCredentials}
            onBack={goBack}
            isLoading={isLoading}
          />
        )}

        {state.currentStep === 'testing' && state.selectedProvider && (
          <ConnectionTest provider={state.selectedProvider} />
        )}

        {state.currentStep === 'success' && state.selectedProvider && state.connectionResult && (
          <SuccessScreen
            provider={state.selectedProvider}
            connectionResult={state.connectionResult}
            onReset={reset}
          />
        )}

        {state.currentStep === 'error' && state.selectedProvider && state.error && (
          <ErrorScreen
            provider={state.selectedProvider}
            error={state.error}
            onRetry={retry}
            onBack={goBack}
          />
        )}
      </div>

      {/* Help Section */}
      {state.currentStep !== 'success' && (
        <div className="mt-8 max-w-2xl mx-auto">
          <Card className="p-6 bg-muted/50">
            <div className="space-y-2">
              <h3 className="font-semibold">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Our support team is here to help you connect to your EHR system.
              </p>
              <div className="flex gap-4 pt-2">
                <a
                  href="/docs/ehr-connection"
                  className="text-sm text-primary hover:underline"
                >
                  View Setup Guide
                </a>
                <a
                  href="/contact"
                  className="text-sm text-primary hover:underline"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}