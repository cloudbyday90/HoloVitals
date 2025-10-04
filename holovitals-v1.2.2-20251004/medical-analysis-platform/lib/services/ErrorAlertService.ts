/**
 * Error Alert Service
 * Sends alerts for critical errors via multiple channels
 */

import { ErrorSeverity } from '../errors/ErrorLogger';
import { prisma } from '../prisma';

// ============================================================================
// ALERT CHANNELS
// ============================================================================

export enum AlertChannel {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  SMS = 'SMS',
  WEBHOOK = 'WEBHOOK',
  IN_APP = 'IN_APP',
}

// ============================================================================
// ALERT CONFIGURATION
// ============================================================================

interface AlertConfig {
  channels: AlertChannel[];
  recipients: string[];
  webhookUrl?: string;
  slackWebhook?: string;
}

// ============================================================================
// ERROR ALERT SERVICE
// ============================================================================

export class ErrorAlertService {
  private static instance: ErrorAlertService;
  private config: AlertConfig;

  private constructor() {
    this.config = {
      channels: [AlertChannel.IN_APP],
      recipients: [],
      webhookUrl: process.env.ALERT_WEBHOOK_URL,
      slackWebhook: process.env.SLACK_WEBHOOK_URL,
    };
  }

  public static getInstance(): ErrorAlertService {
    if (!ErrorAlertService.instance) {
      ErrorAlertService.instance = new ErrorAlertService();
    }
    return ErrorAlertService.instance;
  }

  /**
   * Send alert for critical error
   */
  public async sendCriticalAlert(
    errorId: string,
    message: string,
    details: {
      code?: string;
      endpoint?: string;
      userId?: string;
      timestamp: Date;
    }
  ): Promise<void> {
    console.log('🚨 CRITICAL ALERT:', {
      errorId,
      message,
      ...details,
    });

    // Send to all configured channels
    await Promise.all([
      this.sendInAppNotification(errorId, message, details),
      this.sendSlackAlert(message, details),
      this.sendWebhookAlert(message, details),
      this.sendEmailAlert(message, details),
    ]);
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(
    errorId: string,
    message: string,
    details: any
  ): Promise<void> {
    try {
      // Get all admin and owner users
      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['OWNER', 'ADMIN'],
          },
        },
        select: { id: true },
      });

      // Create notification for each admin
      await Promise.all(
        adminUsers.map(user =>
          prisma.notification.create({
            data: {
              userId: user.id,
              type: 'CRITICAL_ERROR',
              title: 'Critical System Error',
              message: message,
              severity: 'CRITICAL',
              metadata: JSON.stringify({
                errorId,
                ...details,
              }),
              read: false,
            },
          })
        )
      );

      console.log(`✓ In-app notifications sent to ${adminUsers.length} admins`);
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(message: string, details: any): Promise<void> {
    if (!this.config.slackWebhook) {
      return;
    }

    try {
      const payload = {
        text: '🚨 Critical System Error',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 Critical System Error',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:* ${message}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Code:*\n${details.code || 'N/A'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Endpoint:*\n${details.endpoint || 'N/A'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Time:*\n${details.timestamp.toISOString()}`,
              },
              {
                type: 'mrkdwn',
                text: `*User:*\n${details.userId || 'N/A'}`,
              },
            ],
          },
        ],
      };

      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('✓ Slack alert sent');
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(message: string, details: any): Promise<void> {
    if (!this.config.webhookUrl) {
      return;
    }

    try {
      await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'critical_error',
          message,
          details,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log('✓ Webhook alert sent');
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(message: string, details: any): Promise<void> {
    // TODO: Implement email sending
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('✓ Email alert queued (not implemented)');
  }

  /**
   * Send high severity alert
   */
  public async sendHighSeverityAlert(
    errorId: string,
    message: string,
    details: any
  ): Promise<void> {
    console.log('⚠️ HIGH SEVERITY ALERT:', {
      errorId,
      message,
      ...details,
    });

    // Only send in-app notification for high severity
    await this.sendInAppNotification(errorId, message, details);
  }

  /**
   * Configure alert settings
   */
  public configure(config: Partial<AlertConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get alert statistics
   */
  public async getAlertStats(hours: number = 24): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: { gte: since },
        type: {
          in: ['CRITICAL_ERROR', 'HIGH_SEVERITY_ERROR'],
        },
      },
      select: {
        severity: true,
        type: true,
      },
    });

    const stats = {
      total: notifications.length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    notifications.forEach(notification => {
      stats.bySeverity[notification.severity] =
        (stats.bySeverity[notification.severity] || 0) + 1;
      stats.byType[notification.type] =
        (stats.byType[notification.type] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const errorAlertService = ErrorAlertService.getInstance();