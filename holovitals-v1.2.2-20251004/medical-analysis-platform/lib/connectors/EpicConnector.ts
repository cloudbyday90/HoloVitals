/**
 * Epic EHR Connector
 * 
 * Epic-specific implementation with MyChart integration
 */

import { BaseEHRConnector, ConnectorConfig } from './BaseEHRConnector';
import { EPIC_CONFIG } from '../config/ehr-providers';

export class EpicConnector extends BaseEHRConnector {
  constructor(config: Omit<ConnectorConfig, 'providerConfig'>) {
    super({
      ...config,
      providerConfig: EPIC_CONFIG,
    });
  }

  /**
   * Epic-specific authorization URL modifications
   */
  protected modifyAuthorizationUrl(url: string): string {
    // Epic requires 'aud' parameter
    const urlObj = new URL(url);
    
    if (!urlObj.searchParams.has('aud')) {
      const endpoints = this.useSandbox && this.providerConfig.sandbox
        ? this.providerConfig.sandbox
        : this.providerConfig.production;
      
      urlObj.searchParams.set('aud', endpoints.fhirBaseUrl);
    }
    
    return urlObj.toString();
  }

  /**
   * Epic-specific scopes
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
      'patient/DiagnosticReport.read',
      'patient/CarePlan.read',
    ];
  }

  /**
   * Epic-specific patient data retrieval
   */
  async getPatientData(fhirClient: any, patientId: string): Promise<any> {
    // Get base data
    const baseData = await super.getPatientData(fhirClient, patientId);
    
    // Epic-specific: Also get diagnostic reports and care plans
    try {
      const [diagnosticReports, carePlans] = await Promise.all([
        fhirClient.searchAll('DiagnosticReport', { patient: patientId }),
        fhirClient.searchAll('CarePlan', { patient: patientId }),
      ]);
      
      return {
        ...baseData,
        diagnosticReports,
        carePlans,
      };
    } catch (error) {
      console.error('Failed to fetch Epic-specific resources:', error);
      return baseData;
    }
  }
}