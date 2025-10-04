/**
 * Allscripts Connector
 * 
 * Allscripts-specific implementation with FollowMyHealth integration
 */

import { BaseEHRConnector, ConnectorConfig } from './BaseEHRConnector';
import { ALLSCRIPTS_CONFIG } from '../config/ehr-providers';

export class AllscriptsConnector extends BaseEHRConnector {
  constructor(config: Omit<ConnectorConfig, 'providerConfig'>) {
    super({
      ...config,
      providerConfig: ALLSCRIPTS_CONFIG,
    });
  }

  /**
   * Allscripts requires client secret
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