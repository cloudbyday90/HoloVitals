/**
 * EHR Provider Configurations
 * 
 * Registry of supported EHR providers with their FHIR endpoints and OAuth configurations
 */

export enum EHRProvider {
  EPIC = 'EPIC',
  CERNER = 'CERNER',
  ALLSCRIPTS = 'ALLSCRIPTS',
  ATHENAHEALTH = 'ATHENAHEALTH',
  ECLINICALWORKS = 'ECLINICALWORKS',
  NEXTGEN = 'NEXTGEN',
  MEDITECH = 'MEDITECH',
  PRACTICE_FUSION = 'PRACTICE_FUSION',
  GREENWAY = 'GREENWAY',
  OTHER = 'OTHER',
}

export interface ProviderEndpoints {
  fhirBaseUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
  registrationUrl?: string;
  documentationUrl?: string;
}

export interface ProviderCapabilities {
  supportsDocumentReference: boolean;
  supportsObservation: boolean;
  supportsCondition: boolean;
  supportsMedication: boolean;
  supportsAllergy: boolean;
  supportsImmunization: boolean;
  supportsProcedure: boolean;
  supportsBulkData: boolean;
  supportsSmartLaunch: boolean;
}

export interface ProviderConfig {
  id: EHRProvider;
  name: string;
  displayName: string;
  description: string;
  logo?: string;
  color: string;
  
  // Endpoints
  production: ProviderEndpoints;
  sandbox?: ProviderEndpoints;
  
  // OAuth Configuration
  requiresClientSecret: boolean;
  defaultScopes: string[];
  
  // Capabilities
  capabilities: ProviderCapabilities;
  
  // Rate Limiting
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  
  // Additional Info
  marketShare?: number; // Percentage
  patientPortalName?: string;
  setupInstructions?: string;
}

/**
 * Epic Configuration
 */
export const EPIC_CONFIG: ProviderConfig = {
  id: EHRProvider.EPIC,
  name: 'epic',
  displayName: 'Epic',
  description: 'Epic Systems - Leading EHR provider serving major health systems',
  color: '#0071CE',
  patientPortalName: 'MyChart',
  marketShare: 31,
  
  production: {
    fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
    authorizationUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
    tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
    registrationUrl: 'https://fhir.epic.com/Developer/Apps',
    documentationUrl: 'https://fhir.epic.com/',
  },
  
  sandbox: {
    fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
    authorizationUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
    tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
    documentationUrl: 'https://fhir.epic.com/',
  },
  
  requiresClientSecret: false,
  defaultScopes: [
    'openid',
    'profile',
    'launch/patient',
    'offline_access',
    'patient/Patient.read',
    'patient/DocumentReference.read',
    'patient/Observation.read',
    'patient/Condition.read',
    'patient/MedicationRequest.read',
    'patient/AllergyIntolerance.read',
    'patient/Immunization.read',
    'patient/Procedure.read',
  ],
  
  capabilities: {
    supportsDocumentReference: true,
    supportsObservation: true,
    supportsCondition: true,
    supportsMedication: true,
    supportsAllergy: true,
    supportsImmunization: true,
    supportsProcedure: true,
    supportsBulkData: true,
    supportsSmartLaunch: true,
  },
  
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
  
  setupInstructions: 'Register your app at https://fhir.epic.com/Developer/Apps',
};

/**
 * Cerner/Oracle Health Configuration
 */
export const CERNER_CONFIG: ProviderConfig = {
  id: EHRProvider.CERNER,
  name: 'cerner',
  displayName: 'Cerner (Oracle Health)',
  description: 'Oracle Health (formerly Cerner) - Major EHR provider',
  color: '#FF6600',
  patientPortalName: 'HealtheLife',
  marketShare: 25,
  
  production: {
    fhirBaseUrl: 'https://fhir-myrecord.cerner.com/r4/{tenant_id}',
    authorizationUrl: 'https://authorization.cerner.com/tenants/{tenant_id}/protocols/oauth2/profiles/smart-v1/personas/patient/authorize',
    tokenUrl: 'https://authorization.cerner.com/tenants/{tenant_id}/protocols/oauth2/profiles/smart-v1/token',
    registrationUrl: 'https://code-console.cerner.com/',
    documentationUrl: 'https://fhir.cerner.com/',
  },
  
  sandbox: {
    fhirBaseUrl: 'https://fhir-ehr-code.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d',
    authorizationUrl: 'https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/personas/patient/authorize',
    tokenUrl: 'https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/token',
    documentationUrl: 'https://fhir.cerner.com/millennium/r4/',
  },
  
  requiresClientSecret: false,
  defaultScopes: [
    'openid',
    'profile',
    'launch/patient',
    'offline_access',
    'patient/Patient.read',
    'patient/DocumentReference.read',
    'patient/Observation.read',
    'patient/Condition.read',
    'patient/MedicationRequest.read',
    'patient/AllergyIntolerance.read',
    'patient/Immunization.read',
    'patient/Procedure.read',
  ],
  
  capabilities: {
    supportsDocumentReference: true,
    supportsObservation: true,
    supportsCondition: true,
    supportsMedication: true,
    supportsAllergy: true,
    supportsImmunization: true,
    supportsProcedure: true,
    supportsBulkData: true,
    supportsSmartLaunch: true,
  },
  
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
  
  setupInstructions: 'Register your app at https://code-console.cerner.com/',
};

/**
 * Allscripts Configuration
 */
export const ALLSCRIPTS_CONFIG: ProviderConfig = {
  id: EHRProvider.ALLSCRIPTS,
  name: 'allscripts',
  displayName: 'Allscripts',
  description: 'Allscripts - Healthcare IT solutions provider',
  color: '#00A3E0',
  patientPortalName: 'FollowMyHealth',
  marketShare: 8,
  
  production: {
    fhirBaseUrl: 'https://fhir.allscripts.com/fhir/r4',
    authorizationUrl: 'https://oauth.allscripts.com/oauth/authorize',
    tokenUrl: 'https://oauth.allscripts.com/oauth/token',
    registrationUrl: 'https://developer.allscripts.com/',
    documentationUrl: 'https://developer.allscripts.com/FHIR',
  },
  
  sandbox: {
    fhirBaseUrl: 'https://fhir-sandbox.allscripts.com/fhir/r4',
    authorizationUrl: 'https://oauth-sandbox.allscripts.com/oauth/authorize',
    tokenUrl: 'https://oauth-sandbox.allscripts.com/oauth/token',
    documentationUrl: 'https://developer.allscripts.com/FHIR',
  },
  
  requiresClientSecret: true,
  defaultScopes: [
    'openid',
    'profile',
    'launch/patient',
    'offline_access',
    'patient/Patient.read',
    'patient/DocumentReference.read',
    'patient/Observation.read',
    'patient/Condition.read',
    'patient/MedicationRequest.read',
    'patient/AllergyIntolerance.read',
    'patient/Immunization.read',
    'patient/Procedure.read',
  ],
  
  capabilities: {
    supportsDocumentReference: true,
    supportsObservation: true,
    supportsCondition: true,
    supportsMedication: true,
    supportsAllergy: true,
    supportsImmunization: true,
    supportsProcedure: true,
    supportsBulkData: false,
    supportsSmartLaunch: true,
  },
  
  rateLimit: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
  },
  
  setupInstructions: 'Register your app at https://developer.allscripts.com/',
};

/**
 * athenahealth Configuration
 */
export const ATHENAHEALTH_CONFIG: ProviderConfig = {
  id: EHRProvider.ATHENAHEALTH,
  name: 'athenahealth',
  displayName: 'athenahealth',
  description: 'athenahealth - Cloud-based EHR and practice management',
  color: '#FF6B35',
  patientPortalName: 'athenaPatient',
  marketShare: 6,
  
  production: {
    fhirBaseUrl: 'https://api.platform.athenahealth.com/fhir/r4',
    authorizationUrl: 'https://api.platform.athenahealth.com/oauth2/v1/authorize',
    tokenUrl: 'https://api.platform.athenahealth.com/oauth2/v1/token',
    registrationUrl: 'https://developer.athenahealth.com/',
    documentationUrl: 'https://docs.athenahealth.com/api/fhir-r4',
  },
  
  sandbox: {
    fhirBaseUrl: 'https://api.preview.platform.athenahealth.com/fhir/r4',
    authorizationUrl: 'https://api.preview.platform.athenahealth.com/oauth2/v1/authorize',
    tokenUrl: 'https://api.preview.platform.athenahealth.com/oauth2/v1/token',
    documentationUrl: 'https://docs.athenahealth.com/api/fhir-r4',
  },
  
  requiresClientSecret: true,
  defaultScopes: [
    'openid',
    'profile',
    'launch/patient',
    'offline_access',
    'patient/Patient.read',
    'patient/DocumentReference.read',
    'patient/Observation.read',
    'patient/Condition.read',
    'patient/MedicationRequest.read',
    'patient/AllergyIntolerance.read',
    'patient/Immunization.read',
    'patient/Procedure.read',
  ],
  
  capabilities: {
    supportsDocumentReference: true,
    supportsObservation: true,
    supportsCondition: true,
    supportsMedication: true,
    supportsAllergy: true,
    supportsImmunization: true,
    supportsProcedure: true,
    supportsBulkData: false,
    supportsSmartLaunch: true,
  },
  
  rateLimit: {
    requestsPerMinute: 40,
    requestsPerHour: 800,
  },
  
  setupInstructions: 'Register your app at https://developer.athenahealth.com/',
};

/**
 * eClinicalWorks Configuration
 */
export const ECLINICALWORKS_CONFIG: ProviderConfig = {
  id: EHRProvider.ECLINICALWORKS,
  name: 'eclinicalworks',
  displayName: 'eClinicalWorks',
  description: 'eClinicalWorks - Ambulatory EHR and practice management',
  color: '#0066CC',
  patientPortalName: 'Patient Portal V11',
  marketShare: 5,
  
  production: {
    fhirBaseUrl: 'https://fhir.eclinicalworks.com/fhir/r4',
    authorizationUrl: 'https://oauth.eclinicalworks.com/oauth/authorize',
    tokenUrl: 'https://oauth.eclinicalworks.com/oauth/token',
    registrationUrl: 'https://developer.eclinicalworks.com/',
    documentationUrl: 'https://developer.eclinicalworks.com/fhir',
  },
  
  sandbox: {
    fhirBaseUrl: 'https://fhir-sandbox.eclinicalworks.com/fhir/r4',
    authorizationUrl: 'https://oauth-sandbox.eclinicalworks.com/oauth/authorize',
    tokenUrl: 'https://oauth-sandbox.eclinicalworks.com/oauth/token',
    documentationUrl: 'https://developer.eclinicalworks.com/fhir',
  },
  
  requiresClientSecret: true,
  defaultScopes: [
    'openid',
    'profile',
    'launch/patient',
    'offline_access',
    'patient/Patient.read',
    'patient/DocumentReference.read',
    'patient/Observation.read',
    'patient/Condition.read',
    'patient/MedicationRequest.read',
    'patient/AllergyIntolerance.read',
    'patient/Immunization.read',
    'patient/Procedure.read',
  ],
  
  capabilities: {
    supportsDocumentReference: true,
    supportsObservation: true,
    supportsCondition: true,
    supportsMedication: true,
    supportsAllergy: true,
    supportsImmunization: true,
    supportsProcedure: true,
    supportsBulkData: false,
    supportsSmartLaunch: true,
  },
  
  rateLimit: {
    requestsPerMinute: 30,
    requestsPerHour: 600,
  },
  
  setupInstructions: 'Contact eClinicalWorks for API access',
};

/**
 * NextGen Configuration
 */
export const NEXTGEN_CONFIG: ProviderConfig = {
  id: EHRProvider.NEXTGEN,
  name: 'nextgen',
  displayName: 'NextGen Healthcare',
  description: 'NextGen Healthcare - Ambulatory EHR solutions',
  color: '#00A651',
  patientPortalName: 'NextGen Patient Portal',
  marketShare: 4,
  
  production: {
    fhirBaseUrl: 'https://fhir.nextgen.com/nge/prod/fhir/r4',
    authorizationUrl: 'https://fhir.nextgen.com/nge/prod/oauth/authorize',
    tokenUrl: 'https://fhir.nextgen.com/nge/prod/oauth/token',
    registrationUrl: 'https://developer.nextgen.com/',
    documentationUrl: 'https://developer.nextgen.com/fhir',
  },
  
  sandbox: {
    fhirBaseUrl: 'https://fhir.nextgen.com/nge/sandbox/fhir/r4',
    authorizationUrl: 'https://fhir.nextgen.com/nge/sandbox/oauth/authorize',
    tokenUrl: 'https://fhir.nextgen.com/nge/sandbox/oauth/token',
    documentationUrl: 'https://developer.nextgen.com/fhir',
  },
  
  requiresClientSecret: true,
  defaultScopes: [
    'openid',
    'profile',
    'launch/patient',
    'offline_access',
    'patient/Patient.read',
    'patient/DocumentReference.read',
    'patient/Observation.read',
    'patient/Condition.read',
    'patient/MedicationRequest.read',
    'patient/AllergyIntolerance.read',
    'patient/Immunization.read',
    'patient/Procedure.read',
  ],
  
  capabilities: {
    supportsDocumentReference: true,
    supportsObservation: true,
    supportsCondition: true,
    supportsMedication: true,
    supportsAllergy: true,
    supportsImmunization: true,
    supportsProcedure: true,
    supportsBulkData: false,
    supportsSmartLaunch: true,
  },
  
  rateLimit: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
  },
  
  setupInstructions: 'Register your app at https://developer.nextgen.com/',
};

/**
 * Provider Registry
 */
export const PROVIDER_REGISTRY: Record<EHRProvider, ProviderConfig> = {
  [EHRProvider.EPIC]: EPIC_CONFIG,
  [EHRProvider.CERNER]: CERNER_CONFIG,
  [EHRProvider.ALLSCRIPTS]: ALLSCRIPTS_CONFIG,
  [EHRProvider.ATHENAHEALTH]: ATHENAHEALTH_CONFIG,
  [EHRProvider.ECLINICALWORKS]: ECLINICALWORKS_CONFIG,
  [EHRProvider.NEXTGEN]: NEXTGEN_CONFIG,
  [EHRProvider.MEDITECH]: {
    id: EHRProvider.MEDITECH,
    name: 'meditech',
    displayName: 'MEDITECH',
    description: 'MEDITECH - Healthcare IT solutions',
    color: '#003DA5',
    production: {
      fhirBaseUrl: '',
      authorizationUrl: '',
      tokenUrl: '',
    },
    requiresClientSecret: true,
    defaultScopes: [],
    capabilities: {
      supportsDocumentReference: true,
      supportsObservation: true,
      supportsCondition: true,
      supportsMedication: true,
      supportsAllergy: true,
      supportsImmunization: true,
      supportsProcedure: true,
      supportsBulkData: false,
      supportsSmartLaunch: true,
    },
  },
  [EHRProvider.PRACTICE_FUSION]: {
    id: EHRProvider.PRACTICE_FUSION,
    name: 'practice_fusion',
    displayName: 'Practice Fusion',
    description: 'Practice Fusion - Cloud-based EHR',
    color: '#00B4A0',
    production: {
      fhirBaseUrl: '',
      authorizationUrl: '',
      tokenUrl: '',
    },
    requiresClientSecret: true,
    defaultScopes: [],
    capabilities: {
      supportsDocumentReference: true,
      supportsObservation: true,
      supportsCondition: true,
      supportsMedication: true,
      supportsAllergy: true,
      supportsImmunization: true,
      supportsProcedure: true,
      supportsBulkData: false,
      supportsSmartLaunch: true,
    },
  },
  [EHRProvider.GREENWAY]: {
    id: EHRProvider.GREENWAY,
    name: 'greenway',
    displayName: 'Greenway Health',
    description: 'Greenway Health - Ambulatory EHR',
    color: '#6CC24A',
    production: {
      fhirBaseUrl: '',
      authorizationUrl: '',
      tokenUrl: '',
    },
    requiresClientSecret: true,
    defaultScopes: [],
    capabilities: {
      supportsDocumentReference: true,
      supportsObservation: true,
      supportsCondition: true,
      supportsMedication: true,
      supportsAllergy: true,
      supportsImmunization: true,
      supportsProcedure: true,
      supportsBulkData: false,
      supportsSmartLaunch: true,
    },
  },
  [EHRProvider.OTHER]: {
    id: EHRProvider.OTHER,
    name: 'other',
    displayName: 'Other Provider',
    description: 'Custom FHIR-compliant provider',
    color: '#666666',
    production: {
      fhirBaseUrl: '',
      authorizationUrl: '',
      tokenUrl: '',
    },
    requiresClientSecret: false,
    defaultScopes: [],
    capabilities: {
      supportsDocumentReference: true,
      supportsObservation: true,
      supportsCondition: true,
      supportsMedication: true,
      supportsAllergy: true,
      supportsImmunization: true,
      supportsProcedure: true,
      supportsBulkData: false,
      supportsSmartLaunch: true,
    },
  },
};

/**
 * Get provider configuration
 */
export function getProviderConfig(provider: EHRProvider): ProviderConfig {
  return PROVIDER_REGISTRY[provider];
}

/**
 * Get all supported providers
 */
export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDER_REGISTRY).filter(p => p.id !== EHRProvider.OTHER);
}

/**
 * Get providers by market share (sorted)
 */
export function getProvidersByMarketShare(): ProviderConfig[] {
  return getAllProviders()
    .filter(p => p.marketShare)
    .sort((a, b) => (b.marketShare || 0) - (a.marketShare || 0));
}

/**
 * Search providers by name
 */
export function searchProviders(query: string): ProviderConfig[] {
  const lowerQuery = query.toLowerCase();
  return getAllProviders().filter(p =>
    p.displayName.toLowerCase().includes(lowerQuery) ||
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.patientPortalName?.toLowerCase().includes(lowerQuery)
  );
}