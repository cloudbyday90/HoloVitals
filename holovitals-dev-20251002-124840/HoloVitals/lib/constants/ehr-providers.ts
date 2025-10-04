/**
 * EHR Provider Constants
 * 
 * Information about supported EHR providers
 */

import { EHRProviderInfo, ProviderConfigFields } from '@/lib/types/ehr';

export const EHR_PROVIDERS: Record<string, EHRProviderInfo> = {
  EPIC: {
    id: 'EPIC',
    name: 'epic',
    displayName: 'Epic Systems',
    description: 'Leading EHR system used by major healthcare organizations',
    marketShare: '41.3%',
    color: '#0033A0',
    website: 'https://www.epic.com',
    documentationUrl: 'https://fhir.epic.com',
  },
  CERNER: {
    id: 'CERNER',
    name: 'cerner',
    displayName: 'Oracle Cerner',
    description: 'Comprehensive EHR platform by Oracle Health',
    marketShare: '21.8%',
    color: '#FF0000',
    website: 'https://www.oracle.com/health',
    documentationUrl: 'https://fhir.cerner.com',
  },
  MEDITECH: {
    id: 'MEDITECH',
    name: 'meditech',
    displayName: 'MEDITECH',
    description: 'Expanse EHR platform for hospitals and health systems',
    marketShare: '11.9%',
    color: '#00A651',
    website: 'https://www.meditech.com',
    documentationUrl: 'https://ehr.meditech.com',
  },
  ATHENAHEALTH: {
    id: 'ATHENAHEALTH',
    name: 'athenahealth',
    displayName: 'athenahealth',
    description: 'Cloud-based EHR and practice management',
    marketShare: '1.1%',
    color: '#FF6B35',
    website: 'https://www.athenahealth.com',
    documentationUrl: 'https://docs.athenahealth.com',
  },
  ECLINICALWORKS: {
    id: 'ECLINICALWORKS',
    name: 'eclinicalworks',
    displayName: 'eClinicalWorks',
    description: 'Ambulatory EHR and practice management solution',
    marketShare: 'Top 10',
    color: '#0066CC',
    website: 'https://www.eclinicalworks.com',
    documentationUrl: 'https://www.eclinicalworks.com',
  },
  ALLSCRIPTS: {
    id: 'ALLSCRIPTS',
    name: 'allscripts',
    displayName: 'Allscripts/Veradigm',
    description: 'Healthcare IT solutions and EHR platforms',
    marketShare: 'Top 10',
    color: '#00B4A0',
    website: 'https://www.veradigm.com',
    documentationUrl: 'https://developer.veradigm.com',
  },
  NEXTGEN: {
    id: 'NEXTGEN',
    name: 'nextgen',
    displayName: 'NextGen Healthcare',
    description: 'Ambulatory and specialty care EHR',
    marketShare: 'Top 10',
    color: '#005EB8',
    website: 'https://www.nextgen.com',
    documentationUrl: 'https://www.nextgen.com/solutions/interoperability',
  },
};

export const PROVIDER_CONFIG_FIELDS: Record<string, ProviderConfigFields> = {
  EPIC: {
    baseUrl: {
      label: 'FHIR Base URL',
      placeholder: 'https://fhir.epic.com',
      helpText: 'Your Epic FHIR endpoint URL',
    },
    clientId: {
      label: 'Client ID',
      placeholder: 'your-client-id',
      helpText: 'OAuth 2.0 client ID from Epic',
    },
    clientSecret: {
      label: 'Client Secret',
      placeholder: 'your-client-secret',
      helpText: 'OAuth 2.0 client secret from Epic',
    },
  },
  CERNER: {
    baseUrl: {
      label: 'FHIR Base URL',
      placeholder: 'https://fhir.cerner.com',
      helpText: 'Your Cerner FHIR endpoint URL',
    },
    clientId: {
      label: 'Client ID',
      placeholder: 'your-client-id',
      helpText: 'OAuth 2.0 client ID from Cerner',
    },
    clientSecret: {
      label: 'Client Secret',
      placeholder: 'your-client-secret',
      helpText: 'OAuth 2.0 client secret from Cerner',
    },
    additionalFields: [
      {
        name: 'tenantId',
        label: 'Tenant ID',
        placeholder: 'your-tenant-id',
        helpText: 'Your Cerner tenant identifier',
        required: true,
      },
    ],
  },
  MEDITECH: {
    baseUrl: {
      label: 'FHIR Base URL',
      placeholder: 'https://fhir.meditech.com',
      helpText: 'Your MEDITECH FHIR endpoint URL',
    },
    clientId: {
      label: 'Client ID',
      placeholder: 'your-client-id',
      helpText: 'OAuth 2.0 client ID from MEDITECH',
    },
    clientSecret: {
      label: 'Client Secret',
      placeholder: 'your-client-secret',
      helpText: 'OAuth 2.0 client secret from MEDITECH',
    },
    additionalFields: [
      {
        name: 'facilityId',
        label: 'Facility ID',
        placeholder: 'your-facility-id',
        helpText: 'Your MEDITECH facility identifier',
        required: true,
      },
    ],
  },
  ATHENAHEALTH: {
    baseUrl: {
      label: 'API Base URL',
      placeholder: 'https://api.athenahealth.com',
      helpText: 'Your athenahealth API endpoint URL',
    },
    clientId: {
      label: 'Client ID',
      placeholder: 'your-client-id',
      helpText: 'OAuth 2.0 client ID from athenahealth',
    },
    clientSecret: {
      label: 'Client Secret',
      placeholder: 'your-client-secret',
      helpText: 'OAuth 2.0 client secret from athenahealth',
    },
    additionalFields: [
      {
        name: 'practiceId',
        label: 'Practice ID',
        placeholder: 'your-practice-id',
        helpText: 'Your athenahealth practice identifier',
        required: true,
      },
    ],
  },
  ECLINICALWORKS: {
    baseUrl: {
      label: 'API Base URL',
      placeholder: 'https://api.eclinicalworks.com',
      helpText: 'Your eClinicalWorks API endpoint URL',
    },
    clientId: {
      label: 'Client ID',
      placeholder: 'your-client-id',
      helpText: 'OAuth 2.0 client ID from eClinicalWorks',
    },
    clientSecret: {
      label: 'Client Secret',
      placeholder: 'your-client-secret',
      helpText: 'OAuth 2.0 client secret from eClinicalWorks',
    },
    additionalFields: [
      {
        name: 'practiceId',
        label: 'Practice ID',
        placeholder: 'your-practice-id',
        helpText: 'Your eClinicalWorks practice identifier',
        required: true,
      },
    ],
  },
  ALLSCRIPTS: {
    baseUrl: {
      label: 'API Base URL',
      placeholder: 'https://api.veradigm.com',
      helpText: 'Your Allscripts/Veradigm API endpoint URL',
    },
    clientId: {
      label: 'Client ID',
      placeholder: 'your-client-id',
      helpText: 'OAuth 2.0 client ID from Allscripts',
    },
    clientSecret: {
      label: 'Client Secret',
      placeholder: 'your-client-secret',
      helpText: 'OAuth 2.0 client secret from Allscripts',
    },
    additionalFields: [
      {
        name: 'appName',
        label: 'Application Name',
        placeholder: 'your-app-name',
        helpText: 'Your registered application name',
        required: true,
      },
      {
        name: 'platform',
        label: 'Platform',
        placeholder: 'touchworks',
        helpText: 'Platform type (touchworks, sunrise, professional)',
        required: false,
      },
    ],
  },
  NEXTGEN: {
    baseUrl: {
      label: 'API Base URL',
      placeholder: 'https://api.nextgen.com',
      helpText: 'Your NextGen Healthcare API endpoint URL',
    },
    clientId: {
      label: 'Client ID',
      placeholder: 'your-client-id',
      helpText: 'OAuth 2.0 client ID from NextGen',
    },
    clientSecret: {
      label: 'Client Secret',
      placeholder: 'your-client-secret',
      helpText: 'OAuth 2.0 client secret from NextGen',
    },
    additionalFields: [
      {
        name: 'practiceId',
        label: 'Practice ID',
        placeholder: 'your-practice-id',
        helpText: 'Your NextGen practice identifier',
        required: true,
      },
    ],
  },
};

export const PROVIDER_LIST = Object.values(EHR_PROVIDERS);