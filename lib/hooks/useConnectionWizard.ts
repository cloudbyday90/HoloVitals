/**
 * Connection Wizard Hook
 * 
 * Manages state and logic for the EHR connection wizard
 */

import { useState, useCallback } from 'react';
import { EHRProvider, WizardState, WizardStep, EHRConnectionConfig, EHRConnectionResponse } from '@/lib/types/ehr';

export function useConnectionWizard(patientId: string) {
  const [state, setState] = useState<WizardState>({
    currentStep: 'provider',
  });

  const [isLoading, setIsLoading] = useState(false);

  // Navigate to a specific step
  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // Select a provider
  const selectProvider = useCallback((provider: EHRProvider) => {
    setState((prev) => ({
      ...prev,
      selectedProvider: provider,
      currentStep: 'credentials',
    }));
  }, []);

  // Submit credentials and test connection
  const submitCredentials = useCallback(async (credentials: EHRConnectionConfig) => {
    setIsLoading(true);
    setState((prev) => ({
      ...prev,
      credentials,
      currentStep: 'testing',
    }));

    try {
      const response = await fetch('/api/ehr/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patientId,
          provider: credentials.provider,
          config: {
            baseUrl: credentials.baseUrl,
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            additionalConfig: credentials.additionalConfig,
          },
        }),
      });

      const data: EHRConnectionResponse = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          connectionResult: data,
          currentStep: 'success',
        }));
      } else {
        setState((prev) => ({
          ...prev,
          connectionResult: data,
          error: data.error || data.message,
          currentStep: 'error',
        }));
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to connect to EHR system',
        currentStep: 'error',
      }));
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  // Retry connection
  const retry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: 'credentials',
      error: undefined,
      connectionResult: undefined,
    }));
  }, []);

  // Reset wizard
  const reset = useCallback(() => {
    setState({
      currentStep: 'provider',
    });
  }, []);

  // Go back to previous step
  const goBack = useCallback(() => {
    setState((prev) => {
      switch (prev.currentStep) {
        case 'credentials':
          return { ...prev, currentStep: 'provider' };
        case 'testing':
          return { ...prev, currentStep: 'credentials' };
        case 'error':
          return { ...prev, currentStep: 'credentials' };
        default:
          return prev;
      }
    });
  }, []);

  return {
    state,
    isLoading,
    goToStep,
    selectProvider,
    submitCredentials,
    retry,
    reset,
    goBack,
  };
}