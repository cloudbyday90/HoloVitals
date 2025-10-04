/**
 * Alert Webhook Service
 * Sends notifications to external systems when critical issues occur
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  type: 'discord' | 'slack' | 'telegram' | 'custom';
  enabled: boolean;
  events: string[];
  secret?: string;
}

export interface AlertPayload {
  event: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  message: string;
  metrics?: Record<string, unknown>;
  server: {
    hostname: string;
    environment: string;
  };
}

export class AlertWebhookService {
  private static instance: AlertWebhookService;

  private constructor() {}

  static getInstance(): AlertWebhookService {
    if (!AlertWebhookService.instance) {
      AlertWebhookService.instance = new AlertWebhookService();
    }
    return AlertWebhookService.instance;
  }

  /**
   * Send alert to all configured webhooks
   */
  async sendAlert(payload: AlertPayload): Promise<void> {
    try {
      // Get all enabled webhooks
      const webhooks = await this.getEnabledWebhooks(payload.event);

      // Send to each webhook
      const promises = webhooks.map(webhook =>
        this.sendToWebhook(webhook, payload)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error sending alerts:', error);
    }
  }

  /**
   * Get enabled webhooks for an event
   */
  private async getEnabledWebhooks(event: string): Promise<WebhookConfig[]> {
    // Mock data - replace with actual database query
    return [
      {
        id: '1',
        name: 'Discord Alerts',
        url: process.env.DISCORD_WEBHOOK_URL || '',
        type: 'discord',
        enabled: !!process.env.DISCORD_WEBHOOK_URL,
        events: ['server.critical', 'server.warning', 'deployment.failed'],
        secret: undefined,
      },
      {
        id: '2',
        name: 'Slack Alerts',
        url: process.env.SLACK_WEBHOOK_URL || '',
        type: 'slack',
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        events: ['server.critical', 'deployment.failed'],
        secret: undefined,
      },
    ].filter(w => w.enabled && w.events.includes(event));
  }

  /**
   * Send to specific webhook
   */
  private async sendToWebhook(
    webhook: WebhookConfig,
    payload: AlertPayload
  ): Promise<void> {
    try {
      let body: string;

      // Format payload based on webhook type
      switch (webhook.type) {
        case 'discord':
          body = JSON.stringify(this.formatDiscord(payload));
          break;
        case 'slack':
          body = JSON.stringify(this.formatSlack(payload));
          break;
        case 'telegram':
          body = JSON.stringify(this.formatTelegram(payload));
          break;
        default:
          body = JSON.stringify(payload);
      }

      // Send webhook
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.secret && {
            'X-Webhook-Secret': webhook.secret,
          }),
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      console.log(`✅ Alert sent to ${webhook.name}`);
    } catch (error) {
      console.error(`❌ Failed to send to ${webhook.name}:`, error);
    }
  }

  /**
   * Format for Discord
   */
  private formatDiscord(payload: AlertPayload): unknown {
    const color = payload.severity === 'critical' ? 15158332 : // Red
                  payload.severity === 'warning' ? 16776960 : // Yellow
                  3447003; // Blue

    return {
      embeds: [
        {
          title: `🚨 ${payload.event}`,
          description: payload.message,
          color,
          fields: [
            {
              name: 'Severity',
              value: payload.severity.toUpperCase(),
              inline: true,
            },
            {
              name: 'Server',
              value: payload.server.hostname,
              inline: true,
            },
            {
              name: 'Environment',
              value: payload.server.environment,
              inline: true,
            },
          ],
          timestamp: payload.timestamp,
          footer: {
            text: 'HoloVitals Server Monitoring',
          },
        },
      ],
    };
  }

  /**
   * Format for Slack
   */
  private formatSlack(payload: AlertPayload): unknown {
    const emoji = payload.severity === 'critical' ? '🔴' :
                  payload.severity === 'warning' ? '🟡' : '🟢';

    return {
      text: `${emoji} *${payload.event}*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${payload.event}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.message,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Severity:*\n${payload.severity.toUpperCase()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Server:*\n${payload.server.hostname}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Environment: ${payload.server.environment} | ${new Date(payload.timestamp).toLocaleString()}`,
            },
          ],
        },
      ],
    };
  }

  /**
   * Format for Telegram
   */
  private formatTelegram(payload: AlertPayload): unknown {
    const emoji = payload.severity === 'critical' ? '🔴' :
                  payload.severity === 'warning' ? '🟡' : '🟢';

    const text = `
${emoji} *${payload.event}*

${payload.message}

*Severity:* ${payload.severity.toUpperCase()}
*Server:* ${payload.server.hostname}
*Environment:* ${payload.server.environment}
*Time:* ${new Date(payload.timestamp).toLocaleString()}
    `.trim();

    return {
      text,
      parse_mode: 'Markdown',
    };
  }

  /**
   * Send critical CPU alert
   */
  async sendCPUAlert(usage: number): Promise<void> {
    await this.sendAlert({
      event: 'server.cpu.critical',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      message: `CPU usage critically high: ${usage.toFixed(1)}%`,
      metrics: { cpu: { usage } },
      server: {
        hostname: process.env.HOSTNAME || 'holovitals.net',
        environment: process.env.NODE_ENV || 'production',
      },
    });
  }

  /**
   * Send memory alert
   */
  async sendMemoryAlert(usagePercent: number): Promise<void> {
    await this.sendAlert({
      event: 'server.memory.critical',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      message: `Memory usage critically high: ${usagePercent.toFixed(1)}%`,
      metrics: { memory: { usagePercent } },
      server: {
        hostname: process.env.HOSTNAME || 'holovitals.net',
        environment: process.env.NODE_ENV || 'production',
      },
    });
  }

  /**
   * Send disk alert
   */
  async sendDiskAlert(usagePercent: number): Promise<void> {
    await this.sendAlert({
      event: 'server.disk.critical',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      message: `Disk usage critically high: ${usagePercent.toFixed(1)}%`,
      metrics: { disk: { usagePercent } },
      server: {
        hostname: process.env.HOSTNAME || 'holovitals.net',
        environment: process.env.NODE_ENV || 'production',
      },
    });
  }

  /**
   * Send deployment notification
   */
  async sendDeploymentNotification(
    status: 'success' | 'failed',
    commit: string,
    duration?: number
  ): Promise<void> {
    await this.sendAlert({
      event: `deployment.${status}`,
      severity: status === 'failed' ? 'critical' : 'info',
      timestamp: new Date().toISOString(),
      message: status === 'success'
        ? `Deployment completed successfully (${commit})`
        : `Deployment failed (${commit})`,
      metrics: { deployment: { commit, duration } },
      server: {
        hostname: process.env.HOSTNAME || 'holovitals.net',
        environment: process.env.NODE_ENV || 'production',
      },
    });
  }
}

// Export singleton instance
export const alertWebhook = AlertWebhookService.getInstance();