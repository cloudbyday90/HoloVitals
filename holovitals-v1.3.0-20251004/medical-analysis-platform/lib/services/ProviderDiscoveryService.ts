/**
 * Provider Discovery Service
 * 
 * Helps users discover and connect to their healthcare providers
 */

import { PrismaClient } from '@prisma/client';
import {
  EHRProvider,
  ProviderConfig,
  getProviderConfig,
  getAllProviders,
  getProvidersByMarketShare,
  searchProviders,
} from '../config/ehr-providers';

const prisma = new PrismaClient();

export interface ProviderSearchResult {
  provider: ProviderConfig;
  organizations: ProviderOrganization[];
}

export interface ProviderOrganization {
  id: string;
  name: string;
  location?: string;
  fhirBaseUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
}

export class ProviderDiscoveryService {
  /**
   * Get all supported providers
   */
  static async getSupportedProviders(): Promise<ProviderConfig[]> {
    return getAllProviders();
  }

  /**
   * Get providers sorted by market share
   */
  static async getPopularProviders(): Promise<ProviderConfig[]> {
    return getProvidersByMarketShare();
  }

  /**
   * Search for providers by name
   */
  static async searchProvidersByName(query: string): Promise<ProviderConfig[]> {
    return searchProviders(query);
  }

  /**
   * Get provider configuration
   */
  static async getProvider(providerId: EHRProvider): Promise<ProviderConfig> {
    return getProviderConfig(providerId);
  }

  /**
   * Get provider by name (case-insensitive)
   */
  static async getProviderByName(name: string): Promise<ProviderConfig | null> {
    const providers = getAllProviders();
    const lowerName = name.toLowerCase();
    
    return providers.find(p =>
      p.name.toLowerCase() === lowerName ||
      p.displayName.toLowerCase() === lowerName
    ) || null;
  }

  /**
   * Seed provider configurations to database
   */
  static async seedProviderConfigurations(): Promise<void> {
    const providers = getAllProviders();

    for (const provider of providers) {
      const existing = await prisma.providerConfiguration.findFirst({
        where: {
          provider: provider.id as any,
          providerName: provider.displayName,
        },
      });

      if (!existing) {
        await prisma.providerConfiguration.create({
          data: {
            provider: provider.id as any,
            providerName: provider.displayName,
            fhirBaseUrl: provider.production.fhirBaseUrl,
            authorizationUrl: provider.production.authorizationUrl,
            tokenUrl: provider.production.tokenUrl,
            scopes: provider.defaultScopes.join(' '),
            supportsDocumentReference: provider.capabilities.supportsDocumentReference,
            supportsObservation: provider.capabilities.supportsObservation,
            supportsCondition: provider.capabilities.supportsCondition,
            supportsMedication: provider.capabilities.supportsMedication,
            supportsAllergy: provider.capabilities.supportsAllergy,
            supportsImmunization: provider.capabilities.supportsImmunization,
            supportsProcedure: provider.capabilities.supportsProcedure,
            rateLimit: provider.rateLimit?.requestsPerMinute,
            enabled: true,
            isSandbox: false,
            metadata: JSON.stringify({
              description: provider.description,
              color: provider.color,
              patientPortalName: provider.patientPortalName,
              marketShare: provider.marketShare,
              setupInstructions: provider.setupInstructions,
              documentationUrl: provider.production.documentationUrl,
              registrationUrl: provider.production.registrationUrl,
              requiresClientSecret: provider.requiresClientSecret,
            }),
          },
        });
      }

      // Also seed sandbox configuration if available
      if (provider.sandbox) {
        const existingSandbox = await prisma.providerConfiguration.findFirst({
          where: {
            provider: provider.id as any,
            providerName: `${provider.displayName} (Sandbox)`,
          },
        });

        if (!existingSandbox) {
          await prisma.providerConfiguration.create({
            data: {
              provider: provider.id as any,
              providerName: `${provider.displayName} (Sandbox)`,
              fhirBaseUrl: provider.sandbox.fhirBaseUrl,
              authorizationUrl: provider.sandbox.authorizationUrl,
              tokenUrl: provider.sandbox.tokenUrl,
              scopes: provider.defaultScopes.join(' '),
              supportsDocumentReference: provider.capabilities.supportsDocumentReference,
              supportsObservation: provider.capabilities.supportsObservation,
              supportsCondition: provider.capabilities.supportsCondition,
              supportsMedication: provider.capabilities.supportsMedication,
              supportsAllergy: provider.capabilities.supportsAllergy,
              supportsImmunization: provider.capabilities.supportsImmunization,
              supportsProcedure: provider.capabilities.supportsProcedure,
              rateLimit: provider.rateLimit?.requestsPerMinute,
              enabled: true,
              isSandbox: true,
              metadata: JSON.stringify({
                description: `${provider.description} (Sandbox/Testing)`,
                color: provider.color,
                patientPortalName: provider.patientPortalName,
                setupInstructions: provider.setupInstructions,
                documentationUrl: provider.sandbox.documentationUrl,
                requiresClientSecret: provider.requiresClientSecret,
              }),
            },
          });
        }
      }
    }
  }

  /**
   * Get provider configurations from database
   */
  static async getProviderConfigurations(
    includeDisabled: boolean = false,
    includeSandbox: boolean = false
  ): Promise<any[]> {
    const where: any = {};
    
    if (!includeDisabled) {
      where.enabled = true;
    }
    
    if (!includeSandbox) {
      where.isSandbox = false;
    }

    return prisma.providerConfiguration.findMany({
      where,
      orderBy: { providerName: 'asc' },
    });
  }

  /**
   * Get provider configuration by ID
   */
  static async getProviderConfigurationById(id: string): Promise<any> {
    return prisma.providerConfiguration.findUnique({
      where: { id },
    });
  }

  /**
   * Update provider configuration
   */
  static async updateProviderConfiguration(
    id: string,
    data: {
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
      enabled?: boolean;
    }
  ): Promise<any> {
    return prisma.providerConfiguration.update({
      where: { id },
      data,
    });
  }

  /**
   * Get provider statistics
   */
  static async getProviderStatistics(): Promise<{
    totalProviders: number;
    enabledProviders: number;
    totalConnections: number;
    activeConnections: number;
    connectionsByProvider: Array<{
      provider: string;
      count: number;
    }>;
  }> {
    const [
      totalProviders,
      enabledProviders,
      totalConnections,
      activeConnections,
      connectionsByProvider,
    ] = await Promise.all([
      prisma.providerConfiguration.count(),
      prisma.providerConfiguration.count({ where: { enabled: true } }),
      prisma.eHRConnection.count(),
      prisma.eHRConnection.count({ where: { status: 'ACTIVE' } }),
      prisma.eHRConnection.groupBy({
        by: ['provider'],
        _count: true,
      }),
    ]);

    return {
      totalProviders,
      enabledProviders,
      totalConnections,
      activeConnections,
      connectionsByProvider: connectionsByProvider.map(c => ({
        provider: c.provider,
        count: c._count,
      })),
    };
  }

  /**
   * Validate provider endpoints
   */
  static async validateProviderEndpoints(
    fhirBaseUrl: string
  ): Promise<{
    valid: boolean;
    message: string;
    metadata?: any;
  }> {
    try {
      // Try to fetch capability statement
      const response = await fetch(`${fhirBaseUrl}/metadata`, {
        headers: {
          'Accept': 'application/fhir+json',
        },
      });

      if (!response.ok) {
        return {
          valid: false,
          message: `Failed to fetch capability statement: ${response.status} ${response.statusText}`,
        };
      }

      const capabilityStatement = await response.json();

      if (capabilityStatement.resourceType !== 'CapabilityStatement') {
        return {
          valid: false,
          message: 'Invalid response: Expected CapabilityStatement',
        };
      }

      return {
        valid: true,
        message: 'Provider endpoints validated successfully',
        metadata: {
          fhirVersion: capabilityStatement.fhirVersion,
          publisher: capabilityStatement.publisher,
          software: capabilityStatement.software,
          implementation: capabilityStatement.implementation,
        },
      };
    } catch (error: any) {
      return {
        valid: false,
        message: `Validation failed: ${error.message}`,
      };
    }
  }

  /**
   * Get recommended providers based on user location or preferences
   */
  static async getRecommendedProviders(
    location?: string,
    preferences?: string[]
  ): Promise<ProviderConfig[]> {
    // For now, return popular providers
    // In the future, this could use location data and user preferences
    return getProvidersByMarketShare().slice(0, 5);
  }
}