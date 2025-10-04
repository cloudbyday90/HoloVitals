/**
 * eClinicalWorks Connector
 * 
 * eClinicalWorks-specific implementation
 */

import { BaseEHRConnector, ConnectorConfig } from './BaseEHRConnector';
import { ECLINICALWORKS_CONFIG } from '../config/ehr-providers';

export class EClinicalWorksConnector extends BaseEHRConnector {
  constructor(config: Omit<ConnectorConfig, 'providerConfig'>) {
    super({
      ...config,
      providerConfig: ECLINICALWORKS_CONFIG,
    });
  }

  /**
   * eClinicalWorks-specific scopes
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