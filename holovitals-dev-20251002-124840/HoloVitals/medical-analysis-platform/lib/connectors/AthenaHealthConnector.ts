/**
 * athenahealth Connector
 * 
 * athenahealth-specific implementation with athenaPatient integration
 */

import { BaseEHRConnector, ConnectorConfig } from './BaseEHRConnector';
import { ATHENAHEALTH_CONFIG } from '../config/ehr-providers';

export class AthenaHealthConnector extends BaseEHRConnector {
  constructor(config: Omit<ConnectorConfig, 'providerConfig'>) {
    super({
      ...config,
      providerConfig: ATHENAHEALTH_CONFIG,
    });
  }

  /**
   * athenahealth-specific scopes
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