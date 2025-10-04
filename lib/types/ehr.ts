/**
 * EHR Types and Interfaces
 * 
 * Shared types for EHR integration components
 */

export type EHRProvider = 
  | 'EPIC'
  | 'CERNER'
  | 'MEDITECH'
  | 'ATHENAHEALTH'
  | 'ECLINICALWORKS'
  | 'ALLSCRIPTS'
  | 'NEXTGEN';

export interface EHRProviderInfo {
  id: EHRProvider;
  name: string;
  displayName: string;
  description: string;
  marketShare: string;
  logo?: string;
  color: string;
  website: string;
  documentationUrl: string;
}

export interface EHRConnectionConfig {
  provider: EHRProvider;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  additionalConfig?: Record<string, any>;
}

export interface EHRConnectionRequest {
  customerId: string;
  provider: EHRProvider;
  config: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    additionalConfig?: Record<string, any>;
  };
}

export interface EHRConnectionResponse {
  success: boolean;
  message: string;
  data?: {
    customerId: string;
    provider: EHRProvider;
    connectedAt: string;
  };
  error?: string;
}

export interface EHRConnectionStatus {
  connected: boolean;
  provider?: EHRProvider;
  lastSyncedAt?: Date;
}

// Provider-specific configuration fields
export interface ProviderConfigFields {
  baseUrl: {
    label: string;
    placeholder: string;
    helpText: string;
  };
  clientId: {
    label: string;
    placeholder: string;
    helpText: string;
  };
  clientSecret: {
    label: string;
    placeholder: string;
    helpText: string;
  };
  additionalFields?: Array<{
    name: string;
    label: string;
    placeholder: string;
    helpText: string;
    required: boolean;
  }>;
}

// Wizard step types
export type WizardStep = 'provider' | 'credentials' | 'testing' | 'success' | 'error';

export interface WizardState {
  currentStep: WizardStep;
  selectedProvider?: EHRProvider;
  credentials?: EHRConnectionConfig;
  connectionResult?: EHRConnectionResponse;
  error?: string;
}