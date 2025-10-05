/**
 * Service Configuration Service
 * Manages external service configurations (OpenAI, Stripe, SMTP, etc.)
 */

import { prisma } from '@/lib/prisma';
import { ServiceConfiguration } from '@prisma/client';

export interface ServiceConfig {
  serviceName: string;
  enabled: boolean;
  configuration?: Record<string, any>;
}

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class ServiceConfigurationService {
  /**
   * Get service configuration by name
   */
  async getServiceConfig(serviceName: string): Promise<ServiceConfiguration | null> {
    try {
      return await prisma.serviceConfiguration.findUnique({
        where: { serviceName },
      });
    } catch (error) {
      console.error(`Error fetching service config for ${serviceName}:`, error);
      return null;
    }
  }

  /**
   * Check if a service is enabled
   */
  async isServiceEnabled(serviceName: string): Promise<boolean> {
    try {
      const config = await this.getServiceConfig(serviceName);
      return config?.enabled ?? false;
    } catch (error) {
      console.error(`Error checking if service ${serviceName} is enabled:`, error);
      return false;
    }
  }

  /**
   * Get OpenAI configuration
   */
  async getOpenAIConfig(): Promise<OpenAIConfig | null> {
    try {
      const config = await this.getServiceConfig('openai');
      if (!config || !config.enabled) {
        return null;
      }
      return config.configuration as OpenAIConfig;
    } catch (error) {
      console.error('Error fetching OpenAI config:', error);
      return null;
    }
  }

  /**
   * Update or create service configuration
   */
  async updateServiceConfig(
    serviceName: string,
    enabled: boolean,
    configuration?: Record<string, any>,
    updatedBy?: string
  ): Promise<ServiceConfiguration> {
    try {
      return await prisma.serviceConfiguration.upsert({
        where: { serviceName },
        update: {
          enabled,
          configuration: configuration || null,
          updatedBy,
          updatedAt: new Date(),
        },
        create: {
          serviceName,
          enabled,
          configuration: configuration || null,
          updatedBy,
        },
      });
    } catch (error) {
      console.error(`Error updating service config for ${serviceName}:`, error);
      throw new Error(`Failed to update service configuration: ${error}`);
    }
  }

  /**
   * Enable a service
   */
  async enableService(
    serviceName: string,
    configuration?: Record<string, any>,
    updatedBy?: string
  ): Promise<ServiceConfiguration> {
    return this.updateServiceConfig(serviceName, true, configuration, updatedBy);
  }

  /**
   * Disable a service
   */
  async disableService(serviceName: string, updatedBy?: string): Promise<ServiceConfiguration> {
    return this.updateServiceConfig(serviceName, false, undefined, updatedBy);
  }

  /**
   * Get all service configurations
   */
  async getAllServiceConfigs(): Promise<ServiceConfiguration[]> {
    try {
      return await prisma.serviceConfiguration.findMany({
        orderBy: { serviceName: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching all service configs:', error);
      return [];
    }
  }

  /**
   * Delete service configuration
   */
  async deleteServiceConfig(serviceName: string): Promise<void> {
    try {
      await prisma.serviceConfiguration.delete({
        where: { serviceName },
      });
    } catch (error) {
      console.error(`Error deleting service config for ${serviceName}:`, error);
      throw new Error(`Failed to delete service configuration: ${error}`);
    }
  }

  /**
   * Validate OpenAI configuration
   */
  validateOpenAIConfig(config: any): { valid: boolean; error?: string } {
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      return { valid: false, error: 'API key is required and must be a string' };
    }

    if (config.apiKey.length < 20) {
      return { valid: false, error: 'API key appears to be invalid (too short)' };
    }

    if (!config.apiKey.startsWith('sk-')) {
      return { valid: false, error: 'API key must start with "sk-"' };
    }

    return { valid: true };
  }

  /**
   * Test OpenAI connection
   */
  async testOpenAIConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });

      // Test with a simple completion
      await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

      return { success: true };
    } catch (error: any) {
      console.error('OpenAI connection test failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to OpenAI',
      };
    }
  }
}

export default ServiceConfigurationService;