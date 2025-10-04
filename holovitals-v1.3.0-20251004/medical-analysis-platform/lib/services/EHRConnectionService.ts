/**
 * EHR Connection Service
 * 
 * Manages connections to EHR systems and handles OAuth token lifecycle
 */

import { PrismaClient } from '@prisma/client';
import { SMARTAuthService, TokenResponse, getDefaultPatientScopes } from '../fhir/SMARTAuthService';
import { FHIRClient } from '../fhir/FHIRClient';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface CreateConnectionInput {
  userId: string;
  provider: string;
  providerName: string;
  fhirBaseUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}

export interface AuthorizeConnectionInput {
  connectionId: string;
  code: string;
  state: string;
  codeVerifier: string;
}

export class EHRConnectionService {
  /**
   * Initiate a new EHR connection
   * Returns authorization URL for user to visit
   */
  static async initiateConnection(input: CreateConnectionInput): Promise<{
    connection: any;
    authorizationUrl: string;
    state: string;
  }> {
    // Create SMART auth service
    const authService = new SMARTAuthService({
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      redirectUri: input.redirectUri,
      authorizationUrl: input.authorizationUrl,
      tokenUrl: input.tokenUrl,
      scopes: getDefaultPatientScopes(),
    });

    // Generate authorization URL
    const { url, params } = authService.generateAuthorizationUrl();

    // Create connection record
    const connection = await prisma.eHRConnection.create({
      data: {
        userId: input.userId,
        provider: input.provider as any,
        providerName: input.providerName,
        fhirBaseUrl: input.fhirBaseUrl,
        status: 'PENDING',
        metadata: JSON.stringify({
          authorizationUrl: input.authorizationUrl,
          tokenUrl: input.tokenUrl,
          clientId: input.clientId,
          clientSecret: input.clientSecret ? this.encrypt(input.clientSecret) : undefined,
          redirectUri: input.redirectUri,
          codeVerifier: params.codeVerifier,
          codeChallenge: params.codeChallenge,
        }),
      },
    });

    return {
      connection,
      authorizationUrl: url,
      state: params.state,
    };
  }

  /**
   * Complete OAuth authorization and activate connection
   */
  static async authorizeConnection(input: AuthorizeConnectionInput): Promise<any> {
    const connection = await prisma.eHRConnection.findUnique({
      where: { id: input.connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.status !== 'PENDING') {
      throw new Error('Connection is not in pending state');
    }

    // Parse metadata
    const metadata = JSON.parse(connection.metadata || '{}');

    // Create SMART auth service
    const authService = new SMARTAuthService({
      clientId: metadata.clientId,
      clientSecret: metadata.clientSecret ? this.decrypt(metadata.clientSecret) : undefined,
      redirectUri: metadata.redirectUri,
      authorizationUrl: metadata.authorizationUrl,
      tokenUrl: metadata.tokenUrl,
      scopes: getDefaultPatientScopes(),
    });

    // Exchange code for token
    const tokenResponse = await authService.getAccessToken(
      input.code,
      input.codeVerifier
    );

    // Get patient information
    const fhirClient = new FHIRClient({
      baseUrl: connection.fhirBaseUrl,
      accessToken: tokenResponse.accessToken,
    });

    let patientId = tokenResponse.patientId;
    let patientName = 'Unknown';

    if (patientId) {
      try {
        const patient = await fhirClient.getPatient(patientId);
        patientName = this.formatPatientName(patient);
      } catch (error) {
        console.error('Failed to fetch patient info:', error);
      }
    }

    // Update connection with tokens
    const updatedConnection = await prisma.eHRConnection.update({
      where: { id: connection.id },
      data: {
        status: 'ACTIVE',
        accessToken: this.encrypt(tokenResponse.accessToken),
        refreshToken: tokenResponse.refreshToken ? this.encrypt(tokenResponse.refreshToken) : null,
        tokenExpiresAt: tokenResponse.expiresAt,
        patientId,
        patientName,
        nextSyncAt: new Date(), // Schedule immediate sync
      },
    });

    return updatedConnection;
  }

  /**
   * Refresh access token for a connection
   */
  static async refreshToken(connectionId: string): Promise<any> {
    const connection = await prisma.eHRConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }

    const metadata = JSON.parse(connection.metadata || '{}');

    // Create SMART auth service
    const authService = new SMARTAuthService({
      clientId: metadata.clientId,
      clientSecret: metadata.clientSecret ? this.decrypt(metadata.clientSecret) : undefined,
      redirectUri: metadata.redirectUri,
      authorizationUrl: metadata.authorizationUrl,
      tokenUrl: metadata.tokenUrl,
      scopes: getDefaultPatientScopes(),
    });

    // Refresh token
    const tokenResponse = await authService.refreshAccessToken(
      this.decrypt(connection.refreshToken)
    );

    // Update connection
    const updatedConnection = await prisma.eHRConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: this.encrypt(tokenResponse.accessToken),
        refreshToken: tokenResponse.refreshToken ? this.encrypt(tokenResponse.refreshToken) : connection.refreshToken,
        tokenExpiresAt: tokenResponse.expiresAt,
        status: 'ACTIVE',
        errorMessage: null,
      },
    });

    return updatedConnection;
  }

  /**
   * Get FHIR client for a connection
   */
  static async getFHIRClient(connectionId: string): Promise<FHIRClient> {
    const connection = await prisma.eHRConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.status !== 'ACTIVE') {
      throw new Error('Connection is not active');
    }

    if (!connection.accessToken) {
      throw new Error('No access token available');
    }

    // Check if token is expired
    if (connection.tokenExpiresAt && new Date() >= connection.tokenExpiresAt) {
      // Try to refresh
      if (connection.refreshToken) {
        await this.refreshToken(connectionId);
        // Fetch updated connection
        const refreshedConnection = await prisma.eHRConnection.findUnique({
          where: { id: connectionId },
        });
        if (!refreshedConnection?.accessToken) {
          throw new Error('Failed to refresh token');
        }
        return new FHIRClient({
          baseUrl: refreshedConnection.fhirBaseUrl,
          accessToken: this.decrypt(refreshedConnection.accessToken),
        });
      } else {
        throw new Error('Token expired and no refresh token available');
      }
    }

    return new FHIRClient({
      baseUrl: connection.fhirBaseUrl,
      accessToken: this.decrypt(connection.accessToken),
    });
  }

  /**
   * Get user's connections
   */
  static async getUserConnections(userId: string): Promise<any[]> {
    const connections = await prisma.eHRConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Remove sensitive data
    return connections.map(conn => ({
      ...conn,
      accessToken: undefined,
      refreshToken: undefined,
      metadata: undefined,
    }));
  }

  /**
   * Disconnect (revoke) a connection
   */
  static async disconnectConnection(connectionId: string): Promise<any> {
    const connection = await prisma.eHRConnection.update({
      where: { id: connectionId },
      data: {
        status: 'DISCONNECTED',
        accessToken: null,
        refreshToken: null,
        autoSync: false,
      },
    });

    return connection;
  }

  /**
   * Delete a connection
   */
  static async deleteConnection(connectionId: string): Promise<void> {
    await prisma.eHRConnection.delete({
      where: { id: connectionId },
    });
  }

  /**
   * Get connections that need syncing
   */
  static async getConnectionsNeedingSync(): Promise<any[]> {
    const now = new Date();

    return prisma.eHRConnection.findMany({
      where: {
        status: 'ACTIVE',
        autoSync: true,
        nextSyncAt: {
          lte: now,
        },
      },
    });
  }

  /**
   * Update connection sync schedule
   */
  static async updateSyncSchedule(connectionId: string): Promise<any> {
    const connection = await prisma.eHRConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const nextSyncAt = new Date();
    nextSyncAt.setHours(nextSyncAt.getHours() + connection.syncFrequency);

    return prisma.eHRConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        nextSyncAt,
      },
    });
  }

  /**
   * Format patient name from FHIR Patient resource
   */
  private static formatPatientName(patient: any): string {
    const name = patient.name?.[0];
    if (!name) return 'Unknown';

    const parts = [];
    if (name.given) parts.push(...name.given);
    if (name.family) parts.push(name.family);

    return parts.join(' ') || 'Unknown';
  }

  /**
   * Encrypt sensitive data
   */
  private static encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b', 'utf8');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  private static decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b', 'utf8');
    
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}