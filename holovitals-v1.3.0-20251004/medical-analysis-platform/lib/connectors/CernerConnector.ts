/**
 * Cerner/Oracle Health Connector
 * 
 * Cerner-specific implementation with HealtheLife integration
 */

import { BaseEHRConnector, ConnectorConfig } from './BaseEHRConnector';
import { CERNER_CONFIG } from '../config/ehr-providers';

export class CernerConnector extends BaseEHRConnector {
  private tenantId?: string;

  constructor(config: Omit<ConnectorConfig, 'providerConfig'> & { tenantId?: string }) {
    super({
      ...config,
      providerConfig: CERNER_CONFIG,
    });
    this.tenantId = config.tenantId;
  }

  /**
   * Cerner requires tenant ID in URLs
   */
  protected modifyAuthorizationUrl(url: string): string {
    if (!this.tenantId) {
      return url;
    }

    // Replace {tenant_id} placeholder with actual tenant ID
    return url.replace('{tenant_id}', this.tenantId);
  }

  /**
   * Create FHIR client with tenant-specific base URL
   */
  createFHIRClient(accessToken: string): any {
    const endpoints = this.useSandbox && this.providerConfig.sandbox
      ? this.providerConfig.sandbox
      : this.providerConfig.production;

    let baseUrl = endpoints.fhirBaseUrl;
    
    // Replace tenant ID if provided
    if (this.tenantId) {
      baseUrl = baseUrl.replace('{tenant_id}', this.tenantId);
    }

    return super.createFHIRClient(accessToken);
  }

  /**
   * Cerner-specific scopes
   */
  protected getScopes(): string[] {
    return [
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
    ];
  }
}