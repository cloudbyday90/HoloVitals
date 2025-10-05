/**
 * GitHub Configuration Service
 * Manages GitHub Personal Access Token (PAT) storage and retrieval
 */

import { prisma } from '@/lib/prisma';
import { GitHubConfiguration } from '@prisma/client';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

export interface GitHubPATConfig {
  personalAccessToken: string;
  tokenName?: string;
  scopes?: string;
  expiresAt?: Date;
}

export class GitHubConfigurationService {
  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    try {
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    try {
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Get active GitHub PAT
   */
  async getActivePAT(): Promise<string | null> {
    try {
      const config = await prisma.gitHubConfiguration.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!config) {
        return null;
      }

      return this.decrypt(config.personalAccessToken);
    } catch (error) {
      console.error('Error fetching active GitHub PAT:', error);
      return null;
    }
  }

  /**
   * Get all GitHub configurations
   */
  async getAllConfigurations(): Promise<Omit<GitHubConfiguration, 'personalAccessToken'>[]> {
    try {
      const configs = await prisma.gitHubConfiguration.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Return without decrypted tokens (for security)
      return configs.map(config => ({
        id: config.id,
        tokenName: config.tokenName,
        scopes: config.scopes,
        expiresAt: config.expiresAt,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        updatedBy: config.updatedBy,
        personalAccessToken: '***', // Masked
      }));
    } catch (error) {
      console.error('Error fetching GitHub configurations:', error);
      return [];
    }
  }

  /**
   * Save or update GitHub PAT
   */
  async savePAT(
    config: GitHubPATConfig,
    updatedBy?: string
  ): Promise<GitHubConfiguration> {
    try {
      // Encrypt the PAT
      const encryptedPAT = this.encrypt(config.personalAccessToken);

      // Deactivate all existing PATs
      await prisma.gitHubConfiguration.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Create new configuration
      return await prisma.gitHubConfiguration.create({
        data: {
          personalAccessToken: encryptedPAT,
          tokenName: config.tokenName,
          scopes: config.scopes,
          expiresAt: config.expiresAt,
          isActive: true,
          updatedBy,
        },
      });
    } catch (error) {
      console.error('Error saving GitHub PAT:', error);
      throw new Error(`Failed to save GitHub PAT: ${error}`);
    }
  }

  /**
   * Update GitHub PAT
   */
  async updatePAT(
    id: string,
    config: Partial<GitHubPATConfig>,
    updatedBy?: string
  ): Promise<GitHubConfiguration> {
    try {
      const updateData: any = {
        updatedBy,
        updatedAt: new Date(),
      };

      if (config.personalAccessToken) {
        updateData.personalAccessToken = this.encrypt(config.personalAccessToken);
      }

      if (config.tokenName !== undefined) {
        updateData.tokenName = config.tokenName;
      }

      if (config.scopes !== undefined) {
        updateData.scopes = config.scopes;
      }

      if (config.expiresAt !== undefined) {
        updateData.expiresAt = config.expiresAt;
      }

      return await prisma.gitHubConfiguration.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      console.error('Error updating GitHub PAT:', error);
      throw new Error(`Failed to update GitHub PAT: ${error}`);
    }
  }

  /**
   * Activate a specific PAT
   */
  async activatePAT(id: string, updatedBy?: string): Promise<GitHubConfiguration> {
    try {
      // Deactivate all existing PATs
      await prisma.gitHubConfiguration.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Activate the specified PAT
      return await prisma.gitHubConfiguration.update({
        where: { id },
        data: {
          isActive: true,
          updatedBy,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error activating GitHub PAT:', error);
      throw new Error(`Failed to activate GitHub PAT: ${error}`);
    }
  }

  /**
   * Delete GitHub PAT
   */
  async deletePAT(id: string): Promise<void> {
    try {
      await prisma.gitHubConfiguration.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting GitHub PAT:', error);
      throw new Error(`Failed to delete GitHub PAT: ${error}`);
    }
  }

  /**
   * Test GitHub PAT
   */
  async testPAT(token: string): Promise<{ success: boolean; error?: string; scopes?: string[] }> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `GitHub API returned ${response.status}: ${response.statusText}`,
        };
      }

      // Get scopes from response headers
      const scopesHeader = response.headers.get('x-oauth-scopes');
      const scopes = scopesHeader ? scopesHeader.split(',').map(s => s.trim()) : [];

      return {
        success: true,
        scopes,
      };
    } catch (error: any) {
      console.error('GitHub PAT test failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to test GitHub PAT',
      };
    }
  }

  /**
   * Validate GitHub PAT format
   */
  validatePATFormat(token: string): { valid: boolean; error?: string } {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is required and must be a string' };
    }

    if (token.length < 20) {
      return { valid: false, error: 'Token appears to be invalid (too short)' };
    }

    // GitHub PATs typically start with 'ghp_' (personal), 'gho_' (OAuth), or 'ghs_' (server)
    if (!token.startsWith('ghp_') && !token.startsWith('gho_') && !token.startsWith('ghs_')) {
      return { valid: false, error: 'Token format appears to be invalid' };
    }

    return { valid: true };
  }
}

export default GitHubConfigurationService;