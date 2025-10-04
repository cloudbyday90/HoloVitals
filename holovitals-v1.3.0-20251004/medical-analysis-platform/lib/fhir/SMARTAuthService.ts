/**
 * SMART on FHIR Authentication Service
 * 
 * Handles OAuth2 authentication flow for SMART on FHIR
 * Supports authorization code flow with PKCE
 */

import { AuthorizationCode } from 'simple-oauth2';
import crypto from 'crypto';

export interface SMARTAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
}

export interface AuthorizationParams {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: Date;
  patientId?: string;
  scope?: string;
}

export class SMARTAuthService {
  private oauth2Client: AuthorizationCode;
  private config: SMARTAuthConfig;

  constructor(config: SMARTAuthConfig) {
    this.config = config;

    this.oauth2Client = new AuthorizationCode({
      client: {
        id: config.clientId,
        secret: config.clientSecret,
      },
      auth: {
        tokenHost: new URL(config.tokenUrl).origin,
        tokenPath: new URL(config.tokenUrl).pathname,
        authorizePath: new URL(config.authorizationUrl).pathname,
      },
    });
  }

  /**
   * Generate authorization URL for user to visit
   * Returns URL and parameters needed for callback
   */
  generateAuthorizationUrl(launch?: string): {
    url: string;
    params: AuthorizationParams;
  } {
    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    const authorizationParams: any = {
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      response_type: 'code',
      aud: this.extractAudience(this.config.authorizationUrl),
    };

    // Add launch parameter if provided (for EHR launch)
    if (launch) {
      authorizationParams.launch = launch;
    }

    const url = this.oauth2Client.authorizeURL(authorizationParams);

    return {
      url,
      params: {
        state,
        codeVerifier,
        codeChallenge,
      },
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(
    code: string,
    codeVerifier: string
  ): Promise<TokenResponse> {
    try {
      const tokenParams = {
        code,
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier,
      };

      const result = await this.oauth2Client.getToken(tokenParams);
      const token = result.token;

      return {
        accessToken: token.access_token as string,
        refreshToken: token.refresh_token as string | undefined,
        expiresIn: token.expires_in as number,
        expiresAt: new Date(Date.now() + (token.expires_in as number) * 1000),
        patientId: token.patient as string | undefined,
        scope: token.scope as string | undefined,
      };
    } catch (error: any) {
      throw new SMARTAuthError(
        `Failed to exchange authorization code: ${error.message}`,
        error
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const accessToken = this.oauth2Client.createToken({
        refresh_token: refreshToken,
      });

      const result = await accessToken.refresh();
      const token = result.token;

      return {
        accessToken: token.access_token as string,
        refreshToken: token.refresh_token as string | undefined,
        expiresIn: token.expires_in as number,
        expiresAt: new Date(Date.now() + (token.expires_in as number) * 1000),
        patientId: token.patient as string | undefined,
        scope: token.scope as string | undefined,
      };
    } catch (error: any) {
      throw new SMARTAuthError(
        `Failed to refresh access token: ${error.message}`,
        error
      );
    }
  }

  /**
   * Check if token is expired or will expire soon
   */
  isTokenExpired(expiresAt: Date, bufferSeconds: number = 300): boolean {
    const now = new Date();
    const expiryWithBuffer = new Date(expiresAt.getTime() - bufferSeconds * 1000);
    return now >= expiryWithBuffer;
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Generate random state parameter
   */
  private generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Extract audience (aud) parameter from authorization URL
   */
  private extractAudience(authUrl: string): string {
    // For SMART on FHIR, the audience is typically the FHIR base URL
    // Extract from the authorization URL
    const url = new URL(authUrl);
    return `${url.protocol}//${url.host}`;
  }
}

/**
 * SMART Auth Error class
 */
export class SMARTAuthError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'SMARTAuthError';
  }
}

/**
 * Helper function to parse SMART launch parameters
 */
export function parseLaunchParameters(launchParams: string): {
  iss?: string;
  launch?: string;
} {
  const params = new URLSearchParams(launchParams);
  return {
    iss: params.get('iss') || undefined,
    launch: params.get('launch') || undefined,
  };
}

/**
 * Standard SMART on FHIR scopes
 */
export const SMART_SCOPES = {
  // Patient-level scopes
  PATIENT_READ: 'patient/*.read',
  PATIENT_WRITE: 'patient/*.write',
  
  // Specific resource scopes
  PATIENT_PATIENT_READ: 'patient/Patient.read',
  PATIENT_OBSERVATION_READ: 'patient/Observation.read',
  PATIENT_CONDITION_READ: 'patient/Condition.read',
  PATIENT_MEDICATION_READ: 'patient/MedicationRequest.read',
  PATIENT_ALLERGY_READ: 'patient/AllergyIntolerance.read',
  PATIENT_IMMUNIZATION_READ: 'patient/Immunization.read',
  PATIENT_PROCEDURE_READ: 'patient/Procedure.read',
  PATIENT_DOCUMENT_READ: 'patient/DocumentReference.read',
  
  // OpenID Connect
  OPENID: 'openid',
  PROFILE: 'profile',
  
  // Launch context
  LAUNCH: 'launch',
  LAUNCH_PATIENT: 'launch/patient',
  
  // Offline access
  OFFLINE_ACCESS: 'offline_access',
};

/**
 * Get default patient-facing scopes
 */
export function getDefaultPatientScopes(): string[] {
  return [
    SMART_SCOPES.OPENID,
    SMART_SCOPES.PROFILE,
    SMART_SCOPES.LAUNCH_PATIENT,
    SMART_SCOPES.OFFLINE_ACCESS,
    SMART_SCOPES.PATIENT_PATIENT_READ,
    SMART_SCOPES.PATIENT_OBSERVATION_READ,
    SMART_SCOPES.PATIENT_CONDITION_READ,
    SMART_SCOPES.PATIENT_MEDICATION_READ,
    SMART_SCOPES.PATIENT_ALLERGY_READ,
    SMART_SCOPES.PATIENT_IMMUNIZATION_READ,
    SMART_SCOPES.PATIENT_PROCEDURE_READ,
    SMART_SCOPES.PATIENT_DOCUMENT_READ,
  ];
}