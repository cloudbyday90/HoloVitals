/**
 * Provider Onboarding Service
 * Handles provider search, EHR detection, and connection setup
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Provider information with EHR system detection
interface ProviderInfo {
  id: string;
  name: string;
  npi?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  specialty?: string;
  ehrSystem?: string;
  ehrSystemConfidence?: number;
}

// EHR system signatures for detection
const EHR_SIGNATURES = {
  epic: {
    keywords: ['epic', 'mychart', 'epiccare'],
    domains: ['epic.com', 'mychart.'],
    confidence: 0.9,
  },
  cerner: {
    keywords: ['cerner', 'oracle health', 'powerchart'],
    domains: ['cerner.com', 'oraclehealth.com'],
    confidence: 0.9,
  },
  meditech: {
    keywords: ['meditech', 'expanse', 'magic'],
    domains: ['meditech.com', 'ehr.meditech.com'],
    confidence: 0.85,
  },
  allscripts: {
    keywords: ['allscripts', 'veradigm', 'sunrise', 'touchworks'],
    domains: ['allscripts.com', 'veradigm.com'],
    confidence: 0.85,
  },
  nextgen: {
    keywords: ['nextgen', 'nextmd'],
    domains: ['nextgen.com', 'nextmd.com'],
    confidence: 0.85,
  },
  athenahealth: {
    keywords: ['athenahealth', 'athenanet'],
    domains: ['athenahealth.com', 'athenanet.athenahealth.com'],
    confidence: 0.9,
  },
  eclinicalworks: {
    keywords: ['eclinicalworks', 'ecw', 'healow'],
    domains: ['eclinicalworks.com', 'healow.com'],
    confidence: 0.85,
  },
};

export class ProviderOnboardingService {
  /**
   * Search for healthcare providers using NPI Registry API
   */
  async searchProviders(query: string, limit: number = 10): Promise<ProviderInfo[]> {
    try {
      // Use NPI Registry API (free, no API key required)
      const response = await fetch(
        `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=${limit}&search_type=name&name=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search providers');
      }

      const data = await response.json();
      const results: ProviderInfo[] = [];

      if (data.results && Array.isArray(data.results)) {
        for (const result of data.results) {
          const provider: ProviderInfo = {
            id: result.number,
            name: this.formatProviderName(result),
            npi: result.number,
            specialty: this.getPrimaryTaxonomy(result),
          };

          // Get address information
          if (result.addresses && result.addresses.length > 0) {
            const primaryAddress = result.addresses.find((a: any) => a.address_purpose === 'LOCATION') || result.addresses[0];
            provider.address = primaryAddress.address_1;
            provider.city = primaryAddress.city;
            provider.state = primaryAddress.state;
            provider.zip = primaryAddress.postal_code;
            provider.phone = primaryAddress.telephone_number;
          }

          // Detect EHR system
          const ehrDetection = await this.detectEHRSystem(provider);
          provider.ehrSystem = ehrDetection.system;
          provider.ehrSystemConfidence = ehrDetection.confidence;

          results.push(provider);
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching providers:', error);
      throw error;
    }
  }

  /**
   * Detect EHR system used by a provider
   */
  async detectEHRSystem(provider: ProviderInfo): Promise<{ system: string; confidence: number }> {
    let bestMatch = { system: 'unknown', confidence: 0 };

    // Search for provider's website or EHR portal
    const searchQuery = `${provider.name} ${provider.city} ${provider.state} patient portal EHR`;
    
    try {
      // Use a simple web search to find provider's website
      // In production, you would use Google Custom Search API or similar
      const searchResults = await this.searchWeb(searchQuery);

      for (const [ehrName, signature] of Object.entries(EHR_SIGNATURES)) {
        let confidence = 0;

        // Check for keyword matches in search results
        for (const keyword of signature.keywords) {
          if (searchResults.toLowerCase().includes(keyword.toLowerCase())) {
            confidence += 0.3;
          }
        }

        // Check for domain matches
        for (const domain of signature.domains) {
          if (searchResults.toLowerCase().includes(domain.toLowerCase())) {
            confidence += 0.5;
          }
        }

        // Normalize confidence
        confidence = Math.min(confidence, 1.0);

        if (confidence > bestMatch.confidence) {
          bestMatch = {
            system: ehrName,
            confidence: confidence * signature.confidence,
          };
        }
      }
    } catch (error) {
      console.error('Error detecting EHR system:', error);
    }

    return bestMatch;
  }

  /**
   * Get connection requirements for a specific EHR system
   */
  getConnectionRequirements(ehrSystem: string): {
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
      placeholder?: string;
      helpText?: string;
    }>;
    instructions: string;
    documentationUrl?: string;
  } {
    const requirements: Record<string, any> = {
      epic: {
        fields: [
          {
            name: 'clientId',
            label: 'Client ID',
            type: 'text',
            required: true,
            placeholder: 'Enter your Epic Client ID',
            helpText: 'Obtain from Epic App Orchard',
          },
          {
            name: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            required: true,
            placeholder: 'Enter your Epic Client Secret',
            helpText: 'Keep this secure and never share',
          },
          {
            name: 'fhirBaseUrl',
            label: 'FHIR Base URL',
            type: 'url',
            required: true,
            placeholder: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
            helpText: 'Your organization\'s Epic FHIR endpoint',
          },
        ],
        instructions: 'To connect to Epic, you need to register your application in Epic App Orchard and obtain OAuth credentials.',
        documentationUrl: 'https://fhir.epic.com/Documentation',
      },
      cerner: {
        fields: [
          {
            name: 'clientId',
            label: 'Client ID',
            type: 'text',
            required: true,
            placeholder: 'Enter your Cerner Client ID',
          },
          {
            name: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            required: true,
            placeholder: 'Enter your Cerner Client Secret',
          },
          {
            name: 'fhirBaseUrl',
            label: 'FHIR Base URL',
            type: 'url',
            required: true,
            placeholder: 'https://fhir-myrecord.cerner.com/r4',
          },
        ],
        instructions: 'Register your application in Cerner Code Console to obtain OAuth credentials.',
        documentationUrl: 'https://fhir.cerner.com/',
      },
      meditech: {
        fields: [
          {
            name: 'username',
            label: 'Username',
            type: 'text',
            required: true,
            placeholder: 'Enter your MEDITECH username',
          },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            required: true,
            placeholder: 'Enter your MEDITECH password',
          },
          {
            name: 'facilityId',
            label: 'Facility ID',
            type: 'text',
            required: true,
            placeholder: 'Enter your facility ID',
          },
          {
            name: 'apiUrl',
            label: 'API URL',
            type: 'url',
            required: true,
            placeholder: 'https://your-facility.meditech.com/api',
          },
        ],
        instructions: 'Contact your MEDITECH administrator to obtain API access credentials.',
        documentationUrl: 'https://ehr.meditech.com/',
      },
      allscripts: {
        fields: [
          {
            name: 'appName',
            label: 'Application Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your application name',
          },
          {
            name: 'appUsername',
            label: 'Application Username',
            type: 'text',
            required: true,
            placeholder: 'Enter your application username',
          },
          {
            name: 'appPassword',
            label: 'Application Password',
            type: 'password',
            required: true,
            placeholder: 'Enter your application password',
          },
          {
            name: 'apiUrl',
            label: 'API URL',
            type: 'url',
            required: true,
            placeholder: 'https://unity.allscripts.com',
          },
        ],
        instructions: 'Register your application with Allscripts Developer Program.',
        documentationUrl: 'https://developer.allscripts.com/',
      },
      nextgen: {
        fields: [
          {
            name: 'clientId',
            label: 'Client ID',
            type: 'text',
            required: true,
            placeholder: 'Enter your NextGen Client ID',
          },
          {
            name: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            required: true,
            placeholder: 'Enter your NextGen Client Secret',
          },
          {
            name: 'practiceId',
            label: 'Practice ID',
            type: 'text',
            required: true,
            placeholder: 'Enter your practice ID',
          },
          {
            name: 'apiUrl',
            label: 'API URL',
            type: 'url',
            required: true,
            placeholder: 'https://api.nextgen.com',
          },
        ],
        instructions: 'Contact NextGen Healthcare to register your application.',
        documentationUrl: 'https://www.nextgen.com/',
      },
      athenahealth: {
        fields: [
          {
            name: 'clientId',
            label: 'Client ID',
            type: 'text',
            required: true,
            placeholder: 'Enter your athenahealth Client ID',
          },
          {
            name: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            required: true,
            placeholder: 'Enter your athenahealth Client Secret',
          },
          {
            name: 'practiceId',
            label: 'Practice ID',
            type: 'text',
            required: true,
            placeholder: 'Enter your practice ID',
          },
        ],
        instructions: 'Register your application in athenahealth Developer Portal.',
        documentationUrl: 'https://docs.athenahealth.com/',
      },
      eclinicalworks: {
        fields: [
          {
            name: 'username',
            label: 'Username',
            type: 'text',
            required: true,
            placeholder: 'Enter your eClinicalWorks username',
          },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            required: true,
            placeholder: 'Enter your eClinicalWorks password',
          },
          {
            name: 'practiceId',
            label: 'Practice ID',
            type: 'text',
            required: true,
            placeholder: 'Enter your practice ID',
          },
          {
            name: 'apiUrl',
            label: 'API URL',
            type: 'url',
            required: true,
            placeholder: 'https://api.eclinicalworks.com',
          },
        ],
        instructions: 'Contact eClinicalWorks support to enable API access.',
        documentationUrl: 'https://www.eclinicalworks.com/',
      },
    };

    return requirements[ehrSystem] || {
      fields: [],
      instructions: 'Please contact your EHR vendor for API access information.',
    };
  }

  /**
   * Test EHR connection with provided credentials
   */
  async testConnection(ehrSystem: string, credentials: Record<string, string>): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      // Import the appropriate adapter
      const adapterModule = await import(`./sync/adapters/${this.getAdapterName(ehrSystem)}SyncAdapter`);
      const AdapterClass = adapterModule[`${this.getAdapterName(ehrSystem)}SyncAdapter`];
      
      const adapter = new AdapterClass({
        ...credentials,
        provider: ehrSystem,
      });

      // Test the connection
      const result = await adapter.testConnection();

      return {
        success: result.success,
        message: result.success ? 'Connection successful!' : 'Connection failed',
        details: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection test failed',
        details: error,
      };
    }
  }

  /**
   * Save EHR connection to database
   */
  async saveConnection(
    userId: string,
    providerInfo: ProviderInfo,
    ehrSystem: string,
    credentials: Record<string, string>
  ): Promise<any> {
    try {
      const connection = await prisma.eHRConnection.create({
        data: {
          userId,
          provider: ehrSystem,
          providerName: providerInfo.name,
          credentials: JSON.stringify(credentials),
          status: 'active',
          lastSyncedAt: new Date(),
        },
      });

      return connection;
    } catch (error) {
      console.error('Error saving connection:', error);
      throw error;
    }
  }

  // Helper methods

  private formatProviderName(result: any): string {
    if (result.basic?.name) {
      return result.basic.name;
    }
    
    if (result.basic?.first_name && result.basic?.last_name) {
      return `${result.basic.first_name} ${result.basic.last_name}`;
    }

    return 'Unknown Provider';
  }

  private getPrimaryTaxonomy(result: any): string {
    if (result.taxonomies && result.taxonomies.length > 0) {
      const primary = result.taxonomies.find((t: any) => t.primary) || result.taxonomies[0];
      return primary.desc || 'Unknown Specialty';
    }
    return 'Unknown Specialty';
  }

  private async searchWeb(query: string): Promise<string> {
    // In production, use Google Custom Search API or similar
    // For now, return empty string (detection will be based on manual selection)
    return '';
  }

  private getAdapterName(ehrSystem: string): string {
    const names: Record<string, string> = {
      epic: 'Epic',
      cerner: 'Cerner',
      meditech: 'Meditech',
      allscripts: 'Allscripts',
      nextgen: 'NextGen',
      athenahealth: 'AthenaHealth',
      eclinicalworks: 'EClinicalWorks',
    };
    return names[ehrSystem] || 'Epic';
  }
}

export const providerOnboardingService = new ProviderOnboardingService();