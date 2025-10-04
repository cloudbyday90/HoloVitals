/**
 * Webhook Service
 * 
 * Handles incoming webhooks from EHR providers for real-time data synchronization.
 * Implements webhook validation, processing, and retry logic.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { syncOrchestrationService, SyncJobType, SyncDirection, SyncJobPriority } from './SyncOrchestrationService';

const prisma = new PrismaClient();

// Webhook Event Types
export enum WebhookEventType {
  PATIENT_CREATED = 'PATIENT_CREATED',
  PATIENT_UPDATED = 'PATIENT_UPDATED',
  PATIENT_DELETED = 'PATIENT_DELETED',
  OBSERVATION_CREATED = 'OBSERVATION_CREATED',
  OBSERVATION_UPDATED = 'OBSERVATION_UPDATED',
  MEDICATION_CREATED = 'MEDICATION_CREATED',
  MEDICATION_UPDATED = 'MEDICATION_UPDATED',
  ALLERGY_CREATED = 'ALLERGY_CREATED',
  ALLERGY_UPDATED = 'ALLERGY_UPDATED',
  CONDITION_CREATED = 'CONDITION_CREATED',
  CONDITION_UPDATED = 'CONDITION_UPDATED',
  ENCOUNTER_CREATED = 'ENCOUNTER_CREATED',
  ENCOUNTER_UPDATED = 'ENCOUNTER_UPDATED',
  DOCUMENT_CREATED = 'DOCUMENT_CREATED',
  DOCUMENT_UPDATED = 'DOCUMENT_UPDATED',
  CUSTOM = 'CUSTOM',
}

// Webhook Status
export enum WebhookStatus {
  RECEIVED = 'RECEIVED',
  VALIDATED = 'VALIDATED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  IGNORED = 'IGNORED',
}

// Webhook Payload
export interface WebhookPayload {
  webhookId: string;
  eventType: WebhookEventType;
  eventId: string;
  timestamp: Date;
  ehrProvider: string;
  ehrConnectionId: string;
  resourceType: string;
  resourceId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  metadata?: Record<string, any>;
}

// Webhook Validation Result
export interface WebhookValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Webhook Processing Result
export interface WebhookProcessingResult {
  success: boolean;
  webhookId: string;
  syncJobId?: string;
  errors: string[];
  warnings: string[];
  duration: number;
}

// Webhook Configuration
export interface WebhookConfig {
  ehrProvider: string;
  ehrConnectionId: string;
  endpoint: string;
  secret: string;
  enabled: boolean;
  events: WebhookEventType[];
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  signatureHeader?: string;
  signatureAlgorithm?: 'sha256' | 'sha512';
  customHeaders?: Record<string, string>;
}

// Webhook Statistics
export interface WebhookStatistics {
  totalReceived: number;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  byEventType: Record<WebhookEventType, number>;
  byStatus: Record<WebhookStatus, number>;
  lastWebhookTime?: Date;
}

/**
 * Webhook Service
 */
export class WebhookService {
  private webhookConfigs: Map<string, WebhookConfig> = new Map();
  private eventHandlers: Map<WebhookEventType, (payload: WebhookPayload) => Promise<void>> = new Map();

  constructor() {
    this.initializeDefaultHandlers();
  }

  /**
   * Register webhook configuration
   */
  async registerWebhook(config: WebhookConfig): Promise<void> {
    try {
      // Validate configuration
      this.validateWebhookConfig(config);

      // Store configuration
      const key = `${config.ehrProvider}-${config.ehrConnectionId}`;
      this.webhookConfigs.set(key, config);

      // Save to database
      await prisma.webhookConfig.create({
        data: {
          ehrProvider: config.ehrProvider,
          ehrConnectionId: config.ehrConnectionId,
          endpoint: config.endpoint,
          secret: config.secret,
          enabled: config.enabled,
          events: config.events,
          retryAttempts: config.retryAttempts,
          retryDelay: config.retryDelay,
          timeout: config.timeout,
          signatureHeader: config.signatureHeader,
          signatureAlgorithm: config.signatureAlgorithm,
          customHeaders: config.customHeaders,
        },
      });

      console.log(`Webhook registered for ${config.ehrProvider}`);
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(
    ehrProvider: string,
    ehrConnectionId: string,
    headers: Record<string, string>,
    body: any
  ): Promise<WebhookProcessingResult> {
    const startTime = Date.now();
    const webhookId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get webhook configuration
      const config = this.getWebhookConfig(ehrProvider, ehrConnectionId);
      if (!config) {
        throw new Error('Webhook configuration not found');
      }

      if (!config.enabled) {
        throw new Error('Webhook is disabled');
      }

      // Validate webhook signature
      const validationResult = await this.validateWebhook(config, headers, body);
      if (!validationResult.valid) {
        errors.push(...validationResult.errors);
        await this.saveWebhookLog(webhookId, ehrProvider, ehrConnectionId, body, WebhookStatus.FAILED, errors);
        return {
          success: false,
          webhookId,
          errors,
          warnings,
          duration: Date.now() - startTime,
        };
      }

      warnings.push(...validationResult.warnings);

      // Parse webhook payload
      const payload = this.parseWebhookPayload(webhookId, ehrProvider, ehrConnectionId, body);

      // Check if event type is supported
      if (!config.events.includes(payload.eventType)) {
        warnings.push(`Event type ${payload.eventType} not configured for this webhook`);
        await this.saveWebhookLog(webhookId, ehrProvider, ehrConnectionId, body, WebhookStatus.IGNORED, [], warnings);
        return {
          success: true,
          webhookId,
          errors,
          warnings,
          duration: Date.now() - startTime,
        };
      }

      // Save webhook log
      await this.saveWebhookLog(webhookId, ehrProvider, ehrConnectionId, body, WebhookStatus.RECEIVED);

      // Process webhook
      const syncJobId = await this.handleWebhookEvent(payload);

      // Update webhook log
      await this.updateWebhookLog(webhookId, WebhookStatus.COMPLETED, syncJobId);

      return {
        success: true,
        webhookId,
        syncJobId,
        errors,
        warnings,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error processing webhook:', error);
      errors.push(error.message);

      await this.saveWebhookLog(webhookId, ehrProvider, ehrConnectionId, body, WebhookStatus.FAILED, errors);

      return {
        success: false,
        webhookId,
        errors,
        warnings,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate webhook signature
   */
  private async validateWebhook(
    config: WebhookConfig,
    headers: Record<string, string>,
    body: any
  ): Promise<WebhookValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get signature from headers
      const signatureHeader = config.signatureHeader || 'x-webhook-signature';
      const signature = headers[signatureHeader.toLowerCase()];

      if (!signature) {
        errors.push('Webhook signature not found in headers');
        return { valid: false, errors, warnings };
      }

      // Calculate expected signature
      const algorithm = config.signatureAlgorithm || 'sha256';
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      const expectedSignature = crypto
        .createHmac(algorithm, config.secret)
        .update(bodyString)
        .digest('hex');

      // Compare signatures
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        errors.push('Invalid webhook signature');
        return { valid: false, errors, warnings };
      }

      return { valid: true, errors, warnings };
    } catch (error) {
      errors.push(`Signature validation failed: ${error.message}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Parse webhook payload
   */
  private parseWebhookPayload(
    webhookId: string,
    ehrProvider: string,
    ehrConnectionId: string,
    body: any
  ): WebhookPayload {
    // This is a generic parser - provider-specific parsers should override this
    return {
      webhookId,
      eventType: body.eventType || WebhookEventType.CUSTOM,
      eventId: body.eventId || body.id || webhookId,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      ehrProvider,
      ehrConnectionId,
      resourceType: body.resourceType || 'Unknown',
      resourceId: body.resourceId || body.id || '',
      action: body.action || 'UPDATE',
      data: body.data || body,
      metadata: body.metadata,
    };
  }

  /**
   * Handle webhook event
   */
  private async handleWebhookEvent(payload: WebhookPayload): Promise<string> {
    try {
      // Get event handler
      const handler = this.eventHandlers.get(payload.eventType);
      if (handler) {
        await handler(payload);
      }

      // Create sync job for the webhook event
      const syncJobId = `sync-webhook-${payload.webhookId}`;
      await syncOrchestrationService.createSyncJob({
        jobId: syncJobId,
        type: SyncJobType.WEBHOOK_SYNC,
        direction: SyncDirection.INBOUND,
        priority: SyncJobPriority.HIGH,
        ehrProvider: payload.ehrProvider,
        ehrConnectionId: payload.ehrConnectionId,
        userId: 'system',
        resourceType: payload.resourceType,
        resourceIds: [payload.resourceId],
        metadata: {
          webhookId: payload.webhookId,
          eventType: payload.eventType,
          eventId: payload.eventId,
          action: payload.action,
        },
      });

      return syncJobId;
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw new Error(`Failed to handle webhook event: ${error.message}`);
    }
  }

  /**
   * Register event handler
   */
  registerEventHandler(
    eventType: WebhookEventType,
    handler: (payload: WebhookPayload) => Promise<void>
  ): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Get webhook configuration
   */
  private getWebhookConfig(ehrProvider: string, ehrConnectionId: string): WebhookConfig | undefined {
    const key = `${ehrProvider}-${ehrConnectionId}`;
    return this.webhookConfigs.get(key);
  }

  /**
   * Validate webhook configuration
   */
  private validateWebhookConfig(config: WebhookConfig): void {
    if (!config.ehrProvider) {
      throw new Error('EHR provider is required');
    }
    if (!config.ehrConnectionId) {
      throw new Error('EHR connection ID is required');
    }
    if (!config.endpoint) {
      throw new Error('Webhook endpoint is required');
    }
    if (!config.secret) {
      throw new Error('Webhook secret is required');
    }
    if (!config.events || config.events.length === 0) {
      throw new Error('At least one event type is required');
    }
  }

  /**
   * Save webhook log
   */
  private async saveWebhookLog(
    webhookId: string,
    ehrProvider: string,
    ehrConnectionId: string,
    payload: any,
    status: WebhookStatus,
    errors: string[] = [],
    warnings: string[] = []
  ): Promise<void> {
    try {
      await prisma.webhookLog.create({
        data: {
          id: webhookId,
          ehrProvider,
          ehrConnectionId,
          payload,
          status,
          errors,
          warnings,
          receivedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error saving webhook log:', error);
    }
  }

  /**
   * Update webhook log
   */
  private async updateWebhookLog(
    webhookId: string,
    status: WebhookStatus,
    syncJobId?: string
  ): Promise<void> {
    try {
      await prisma.webhookLog.update({
        where: { id: webhookId },
        data: {
          status,
          syncJobId,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating webhook log:', error);
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStatistics(
    ehrProvider?: string,
    ehrConnectionId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WebhookStatistics> {
    try {
      const where: any = {};
      if (ehrProvider) where.ehrProvider = ehrProvider;
      if (ehrConnectionId) where.ehrConnectionId = ehrConnectionId;
      if (startDate || endDate) {
        where.receivedAt = {};
        if (startDate) where.receivedAt.gte = startDate;
        if (endDate) where.receivedAt.lte = endDate;
      }

      const webhooks = await prisma.webhookLog.findMany({ where });

      const stats: WebhookStatistics = {
        totalReceived: webhooks.length,
        totalProcessed: webhooks.filter(w => w.status === WebhookStatus.COMPLETED).length,
        totalFailed: webhooks.filter(w => w.status === WebhookStatus.FAILED).length,
        averageProcessingTime: 0,
        byEventType: {} as Record<WebhookEventType, number>,
        byStatus: {} as Record<WebhookStatus, number>,
      };

      let totalProcessingTime = 0;
      let processedCount = 0;

      for (const webhook of webhooks) {
        // Count by event type
        const eventType = (webhook.payload as any)?.eventType || WebhookEventType.CUSTOM;
        stats.byEventType[eventType] = (stats.byEventType[eventType] || 0) + 1;

        // Count by status
        stats.byStatus[webhook.status as WebhookStatus] = 
          (stats.byStatus[webhook.status as WebhookStatus] || 0) + 1;

        // Calculate processing time
        if (webhook.processedAt && webhook.receivedAt) {
          const processingTime = 
            new Date(webhook.processedAt).getTime() - 
            new Date(webhook.receivedAt).getTime();
          totalProcessingTime += processingTime;
          processedCount++;
        }
      }

      stats.averageProcessingTime = processedCount > 0 
        ? totalProcessingTime / processedCount 
        : 0;

      const lastWebhook = webhooks[webhooks.length - 1];
      stats.lastWebhookTime = lastWebhook?.receivedAt || undefined;

      return stats;
    } catch (error) {
      console.error('Error getting webhook statistics:', error);
      throw new Error(`Failed to get webhook statistics: ${error.message}`);
    }
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(
    ehrProvider?: string,
    ehrConnectionId?: string,
    status?: WebhookStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: any[]; total: number }> {
    try {
      const where: any = {};
      if (ehrProvider) where.ehrProvider = ehrProvider;
      if (ehrConnectionId) where.ehrConnectionId = ehrConnectionId;
      if (status) where.status = status;

      const [logs, total] = await Promise.all([
        prisma.webhookLog.findMany({
          where,
          orderBy: { receivedAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.webhookLog.count({ where }),
      ]);

      return { logs, total };
    } catch (error) {
      console.error('Error getting webhook logs:', error);
      throw new Error(`Failed to get webhook logs: ${error.message}`);
    }
  }

  /**
   * Retry failed webhook
   */
  async retryWebhook(webhookId: string): Promise<WebhookProcessingResult> {
    try {
      const webhook = await prisma.webhookLog.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      if (webhook.status !== WebhookStatus.FAILED) {
        throw new Error('Only failed webhooks can be retried');
      }

      // Update status to retrying
      await prisma.webhookLog.update({
        where: { id: webhookId },
        data: { status: WebhookStatus.RETRYING },
      });

      // Reprocess webhook
      return await this.processWebhook(
        webhook.ehrProvider,
        webhook.ehrConnectionId,
        {},
        webhook.payload
      );
    } catch (error) {
      console.error('Error retrying webhook:', error);
      throw new Error(`Failed to retry webhook: ${error.message}`);
    }
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhook(ehrProvider: string, ehrConnectionId: string): Promise<void> {
    try {
      const key = `${ehrProvider}-${ehrConnectionId}`;
      this.webhookConfigs.delete(key);

      await prisma.webhookConfig.deleteMany({
        where: {
          ehrProvider,
          ehrConnectionId,
        },
      });

      console.log(`Webhook deleted for ${ehrProvider}`);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  /**
   * Initialize default event handlers
   */
  private initializeDefaultHandlers(): void {
    // Customer events
    this.registerEventHandler(WebhookEventType.PATIENT_CREATED, async (payload) => {
      console.log('Customer created:', payload.resourceId);
    });

    this.registerEventHandler(WebhookEventType.PATIENT_UPDATED, async (payload) => {
      console.log('Customer updated:', payload.resourceId);
    });

    // Observation events
    this.registerEventHandler(WebhookEventType.OBSERVATION_CREATED, async (payload) => {
      console.log('Observation created:', payload.resourceId);
    });

    // Medication events
    this.registerEventHandler(WebhookEventType.MEDICATION_CREATED, async (payload) => {
      console.log('Medication created:', payload.resourceId);
    });

    // Add more default handlers as needed
  }

  /**
   * Load webhook configurations from database
   */
  async loadWebhookConfigs(): Promise<void> {
    try {
      const configs = await prisma.webhookConfig.findMany({
        where: { enabled: true },
      });

      for (const config of configs) {
        const key = `${config.ehrProvider}-${config.ehrConnectionId}`;
        this.webhookConfigs.set(key, config as any);
      }

      console.log(`Loaded ${configs.length} webhook configurations`);
    } catch (error) {
      console.error('Error loading webhook configs:', error);
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService();