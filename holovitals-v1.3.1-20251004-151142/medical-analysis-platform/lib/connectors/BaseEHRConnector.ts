/**
 * Base EHR Connector
 * 
 * Abstract base class for EHR-specific connectors
 */

import { FHIRClient } from '../fhir/FHIRClient';
import { SMARTAuthService, TokenResponse } from '../fhir/SMARTAuthService';
import { ProviderConfig } from '../config/ehr-providers';

export interface ConnectorConfig {
  providerConfig: ProviderConfig;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  useSandbox?: boolean;
}

export interface AuthorizationResult {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

export abstract class BaseEHRConnector {
  protected providerConfig: ProviderConfig;
  protected clientId: string;
  protected clientSecret?: string;
  protected redirectUri: string;
  protected useSandbox: boolean;
  protected authService: SMARTAuthService;

  constructor(config: ConnectorConfig) {
    this.providerConfig = config.providerConfig;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.useSandbox = config.useSandbox || false;

    // Get endpoints based on sandbox flag
    const endpoints = this.useSandbox && config.providerConfig.sandbox
      ? config.providerConfig.sandbox
      : config.providerConfig.production;

    // Initialize SMART auth service
    this.authService = new SMARTAuthService({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
      authorizationUrl: endpoints.authorizationUrl,
      tokenUrl: endpoints.tokenUrl,
      scopes: this.getScopes(),
    });
  }

  /**
   * Get scopes for this provider
   * Can be overridden by specific connectors
   */
  protected getScopes(): string[] {
    return this.providerConfig.defaultScopes;
  }

  /**
   * Generate authorization URL
   */
  async generateAuthorizationUrl(launch?: string): Promise<AuthorizationResult> {
    const result = this.authService.generateAuthorizationUrl(launch);
    
    // Provider-specific URL modifications
    const modifiedUrl = this.modifyAuthorizationUrl(result.url);
    
    return {
      authorizationUrl: modifiedUrl,
      state: result.params.state,
      codeVerifier: result.params.codeVerifier,
    };
  }

  /**
   * Modify authorization URL (can be overridden)
   */
  protected modifyAuthorizationUrl(url: string): string {
    return url;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string, codeVerifier: string): Promise<TokenResponse> {
    return this.authService.getAccessToken(code, codeVerifier);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    return this.authService.refreshAccessToken(refreshToken);
  }

  /**
   * Create FHIR client with access token
   */
  createFHIRClient(accessToken: string): FHIRClient {
    const endpoints = this.useSandbox && this.providerConfig.sandbox
      ? this.providerConfig.sandbox
      : this.providerConfig.production;

    return new FHIRClient({
      baseUrl: endpoints.fhirBaseUrl,
      accessToken,
    });
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.providerConfig.displayName;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return this.providerConfig.capabilities;
  }

  /**
   * Validate connection (can be overridden)
   */
  async validateConnection(fhirClient: FHIRClient): Promise<boolean> {
    try {
      // Try to fetch capability statement
      await fhirClient.getCapabilityStatement();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get rate limit info
   */
  getRateLimit() {
    return this.providerConfig.rateLimit;
  }

  /**
   * Provider-specific resource retrieval (can be overridden)
   */
  async getPatientData(fhirClient: FHIRClient, patientId: string): Promise<any> {
    const [
      patient,
      documentReferences,
      observations,
      conditions,
      medications,
      allergies,
      immunizations,
      procedures,
    ] = await Promise.all([
      fhirClient.getPatient(patientId),
      this.providerConfig.capabilities.supportsDocumentReference
        ? fhirClient.getDocumentReferences(patientId)
        : [],
      this.providerConfig.capabilities.supportsObservation
        ? fhirClient.getObservations(patientId)
        : [],
      this.providerConfig.capabilities.supportsCondition
        ? fhirClient.getConditions(patientId)
        : [],
      this.providerConfig.capabilities.supportsMedication
        ? fhirClient.getMedicationRequests(patientId)
        : [],
      this.providerConfig.capabilities.supportsAllergy
        ? fhirClient.getAllergyIntolerances(patientId)
        : [],
      this.providerConfig.capabilities.supportsImmunization
        ? fhirClient.getImmunizations(patientId)
        : [],
      this.providerConfig.capabilities.supportsProcedure
        ? fhirClient.getProcedures(patientId)
        : [],
    ]);

    return {
      patient,
      documentReferences,
      observations,
      conditions,
      medications,
      allergies,
      immunizations,
      procedures,
    };
  }
}