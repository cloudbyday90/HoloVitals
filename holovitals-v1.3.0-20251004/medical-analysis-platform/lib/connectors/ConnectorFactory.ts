/**
 * Connector Factory
 * 
 * Factory for creating provider-specific EHR connectors
 */

import { EHRProvider } from '../config/ehr-providers';
import { BaseEHRConnector, ConnectorConfig } from './BaseEHRConnector';
import { EpicConnector } from './EpicConnector';
import { CernerConnector } from './CernerConnector';
import { AllscriptsConnector } from './AllscriptsConnector';
import { AthenaHealthConnector } from './AthenaHealthConnector';
import { EClinicalWorksConnector } from './EClinicalWorksConnector';
import { NextGenConnector } from './NextGenConnector';

export interface ConnectorFactoryConfig {
  provider: EHRProvider;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  useSandbox?: boolean;
  tenantId?: string; // For Cerner
}

export class ConnectorFactory {
  /**
   * Create a connector for the specified provider
   */
  static createConnector(config: ConnectorFactoryConfig): BaseEHRConnector {
    const baseConfig = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      useSandbox: config.useSandbox,
    };

    switch (config.provider) {
      case EHRProvider.EPIC:
        return new EpicConnector(baseConfig);

      case EHRProvider.CERNER:
        return new CernerConnector({
          ...baseConfig,
          tenantId: config.tenantId,
        });

      case EHRProvider.ALLSCRIPTS:
        return new AllscriptsConnector(baseConfig);

      case EHRProvider.ATHENAHEALTH:
        return new AthenaHealthConnector(baseConfig);

      case EHRProvider.ECLINICALWORKS:
        return new EClinicalWorksConnector(baseConfig);

      case EHRProvider.NEXTGEN:
        return new NextGenConnector(baseConfig);

      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Get list of supported providers
   */
  static getSupportedProviders(): EHRProvider[] {
    return [
      EHRProvider.EPIC,
      EHRProvider.CERNER,
      EHRProvider.ALLSCRIPTS,
      EHRProvider.ATHENAHEALTH,
      EHRProvider.ECLINICALWORKS,
      EHRProvider.NEXTGEN,
    ];
  }

  /**
   * Check if a provider is supported
   */
  static isProviderSupported(provider: EHRProvider): boolean {
    return this.getSupportedProviders().includes(provider);
  }
}