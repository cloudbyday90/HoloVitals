/**
 * NextGen Healthcare Connector
 * 
 * NextGen-specific implementation
 */

import { BaseEHRConnector, ConnectorConfig } from './BaseEHRConnector';
import { NEXTGEN_CONFIG } from '../config/ehr-providers';

export class NextGenConnector extends BaseEHRConnector {
  constructor(config: Omit<ConnectorConfig, 'providerConfig'>) {
    super({
      ...config,
      providerConfig: NEXTGEN_CONFIG,
    });
  }

  /**
   * NextGen-specific scopes
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