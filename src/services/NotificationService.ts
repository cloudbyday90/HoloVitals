/**
 * Notification Service
 * 
 * Manages notifications across all repositories for bugs, features, deployments, and system events.
 * Supports multiple channels: email, in-app, Slack, webhooks.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

enum NotificationChannel {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SLACK = 'SLACK',
  WEBHOOK = 'WEBHOOK',
  SMS = 'SMS',
}

enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

enum NotificationType {
  BUG_CREATED = 'BUG_CREATED',
  BUG_ASSIGNED = 'BUG_ASSIGNED',
  BUG_STATUS_CHANGED = 'BUG_STATUS_CHANGED',
  BUG_CRITICAL = 'BUG_CRITICAL',
  FEATURE_CREATED = 'FEATURE_CREATED',
  FEATURE_APPROVED = 'FEATURE_APPROVED',
  FEATURE_COMPLETED = 'FEATURE_COMPLETED',
  DEPLOYMENT_STARTED = 'DEPLOYMENT_STARTED',
  DEPLOYMENT_SUCCESS = 'DEPLOYMENT_SUCCESS',
  DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED',
  TEST_FAILED = 'TEST_FAILED',
  ENVIRONMENT_DOWN = 'ENVIRONMENT_DOWN',
  CODE_REVIEW_REQUESTED = 'CODE_REVIEW_REQUESTED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

interface NotificationData {
  type: NotificationType;
  priority: NotificationPriority;
  recipientId: string;
  recipientEmail?: string;
  title: string;
  message: string;
  data?: any;
  channels?: NotificationChannel[];
  actionUrl?: string;
}

interface NotificationPreferences {
  userId: string;
  channels: NotificationChannel[];
  bugNotifications: boolean;
  featureNotifications: boolean;
  deploymentNotifications: boolean;
  systemAlerts: boolean;
  emailDigest: boolean;
  digestFrequency?: 'DAILY' | 'WEEKLY';
}

export class NotificationService {
  /**
   * Send a notification
   */
  async sendNotification(data: NotificationData): Promise<void> {
    // Get user preferences
    const preferences = await this.getUserPreferences(data.recipientId);
    
    // Check if user wants this type of notification
    if (!this.shouldSendNotification(data.type, preferences)) {
      return;
    }

    // Determine channels to use
    const channels = data.channels || preferences.channels || [NotificationChannel.IN_APP];

    // Send to each channel
    for (const channel of channels) {
      try {
        await this.sendToChannel(channel, data);
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
      }
    }

    // Store notification in database
    await this.storeNotification(data);
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: NotificationData[]): Promise<void> {
    await Promise.all(notifications.map(n => this.sendNotification(n)));
  }

  /**
   * Notify about new bug
   */
  async notifyBugCreated(bugId: string, bug: any): Promise<void> {
    const priority = this.mapBugSeverityToPriority(bug.severity);
    
    // Notify assigned developer
    if (bug.assignedTo) {
      await this.sendNotification({
        type: NotificationType.BUG_CREATED,
        priority,
        recipientId: bug.assignedTo,
        title: `New Bug Assigned: ${bug.title}`,
        message: `A ${bug.severity} bug has been assigned to you: ${bug.description.substring(0, 100)}...`,
        data: { bugId, bug },
        actionUrl: `/bugs/${bugId}`,
      });
    }

    // Notify team leads for critical bugs
    if (bug.severity === 'CRITICAL') {
      await this.notifyTeamLeads({
        type: NotificationType.BUG_CRITICAL,
        priority: NotificationPriority.URGENT,
        title: `CRITICAL BUG: ${bug.title}`,
        message: `A critical bug has been reported: ${bug.description}`,
        data: { bugId, bug },
        actionUrl: `/bugs/${bugId}`,
      });
    }
  }

  /**
   * Notify about bug status change
   */
  async notifyBugStatusChanged(bugId: string, bug: any, oldStatus: string, newStatus: string): Promise<void> {
    // Notify reporter
    if (bug.reportedBy) {
      await this.sendNotification({
        type: NotificationType.BUG_STATUS_CHANGED,
        priority: NotificationPriority.MEDIUM,
        recipientId: bug.reportedBy,
        title: `Bug Status Updated: ${bug.title}`,
        message: `Bug status changed from ${oldStatus} to ${newStatus}`,
        data: { bugId, bug, oldStatus, newStatus },
        actionUrl: `/bugs/${bugId}`,
      });
    }

    // Notify assigned developer
    if (bug.assignedTo && bug.assignedTo !== bug.reportedBy) {
      await this.sendNotification({
        type: NotificationType.BUG_STATUS_CHANGED,
        priority: NotificationPriority.MEDIUM,
        recipientId: bug.assignedTo,
        title: `Bug Status Updated: ${bug.title}`,
        message: `Bug status changed from ${oldStatus} to ${newStatus}`,
        data: { bugId, bug, oldStatus, newStatus },
        actionUrl: `/bugs/${bugId}`,
      });
    }
  }

  /**
   * Notify about new feature request
   */
  async notifyFeatureCreated(featureId: string, feature: any): Promise<void> {
    // Notify product team
    await this.notifyProductTeam({
      type: NotificationType.FEATURE_CREATED,
      priority: NotificationPriority.MEDIUM,
      title: `New Feature Request: ${feature.title}`,
      message: `A new feature has been requested: ${feature.description.substring(0, 100)}...`,
      data: { featureId, feature },
      actionUrl: `/features/${featureId}`,
    });
  }

  /**
   * Notify about feature approval
   */
  async notifyFeatureApproved(featureId: string, feature: any): Promise<void> {
    // Notify requester
    if (feature.requestedBy) {
      await this.sendNotification({
        type: NotificationType.FEATURE_APPROVED,
        priority: NotificationPriority.HIGH,
        recipientId: feature.requestedBy,
        title: `Feature Approved: ${feature.title}`,
        message: `Your feature request has been approved and added to the roadmap!`,
        data: { featureId, feature },
        actionUrl: `/features/${featureId}`,
      });
    }

    // Notify development team
    await this.notifyDevelopmentTeam({
      type: NotificationType.FEATURE_APPROVED,
      priority: NotificationPriority.MEDIUM,
      title: `New Feature Approved: ${feature.title}`,
      message: `A new feature has been approved for development: ${feature.description.substring(0, 100)}...`,
      data: { featureId, feature },
      actionUrl: `/features/${featureId}`,
    });
  }

  /**
   * Notify about deployment
   */
  async notifyDeploymentStarted(projectId: string, deployment: any): Promise<void> {
    await this.notifyDevelopmentTeam({
      type: NotificationType.DEPLOYMENT_STARTED,
      priority: NotificationPriority.MEDIUM,
      title: `Deployment Started: ${deployment.environment}`,
      message: `Deployment to ${deployment.environment} has started for version ${deployment.version}`,
      data: { projectId, deployment },
      actionUrl: `/projects/${projectId}/deployments`,
    });
  }

  /**
   * Notify about deployment success
   */
  async notifyDeploymentSuccess(projectId: string, deployment: any): Promise<void> {
    await this.notifyDevelopmentTeam({
      type: NotificationType.DEPLOYMENT_SUCCESS,
      priority: NotificationPriority.MEDIUM,
      title: `Deployment Successful: ${deployment.environment}`,
      message: `Version ${deployment.version} has been successfully deployed to ${deployment.environment}`,
      data: { projectId, deployment },
      actionUrl: `/projects/${projectId}/deployments`,
    });
  }

  /**
   * Notify about deployment failure
   */
  async notifyDeploymentFailed(projectId: string, deployment: any): Promise<void> {
    await this.notifyDevelopmentTeam({
      type: NotificationType.DEPLOYMENT_FAILED,
      priority: NotificationPriority.URGENT,
      title: `Deployment Failed: ${deployment.environment}`,
      message: `Deployment to ${deployment.environment} has failed: ${deployment.errorMessage}`,
      data: { projectId, deployment },
      actionUrl: `/projects/${projectId}/deployments`,
      channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.IN_APP],
    });
  }

  /**
   * Notify about test failures
   */
  async notifyTestFailed(projectId: string, testRun: any): Promise<void> {
    await this.notifyDevelopmentTeam({
      type: NotificationType.TEST_FAILED,
      priority: NotificationPriority.HIGH,
      title: `Tests Failed: ${testRun.testSuite}`,
      message: `${testRun.failedTests} tests failed in ${testRun.environment} environment`,
      data: { projectId, testRun },
      actionUrl: `/projects/${projectId}/tests`,
    });
  }

  /**
   * Notify about environment issues
   */
  async notifyEnvironmentDown(environment: string, issues: string[]): Promise<void> {
    await this.notifyTeamLeads({
      type: NotificationType.ENVIRONMENT_DOWN,
      priority: NotificationPriority.URGENT,
      title: `Environment Down: ${environment}`,
      message: `The ${environment} environment is experiencing issues: ${issues.join(', ')}`,
      data: { environment, issues },
      channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.SMS],
    });
  }

  /**
   * Notify about code review request
   */
  async notifyCodeReviewRequested(projectId: string, reviewerId: string, changes: any[]): Promise<void> {
    await this.sendNotification({
      type: NotificationType.CODE_REVIEW_REQUESTED,
      priority: NotificationPriority.MEDIUM,
      recipientId: reviewerId,
      title: `Code Review Requested`,
      message: `You have been requested to review ${changes.length} code changes`,
      data: { projectId, changes },
      actionUrl: `/projects/${projectId}/reviews`,
    });
  }

  /**
   * Send system alert
   */
  async sendSystemAlert(title: string, message: string, priority: NotificationPriority = NotificationPriority.HIGH): Promise<void> {
    await this.notifyTeamLeads({
      type: NotificationType.SYSTEM_ALERT,
      priority,
      title,
      message,
      channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.IN_APP],
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    // TODO: Implement database query for notifications
    // This would query a Notification table
    return [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    // TODO: Implement database update
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    // TODO: Implement database update for user preferences
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // TODO: Implement database query for preferences
    // Return default preferences for now
    return {
      userId,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      bugNotifications: true,
      featureNotifications: true,
      deploymentNotifications: true,
      systemAlerts: true,
      emailDigest: false,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async sendToChannel(channel: NotificationChannel, data: NotificationData): Promise<void> {
    switch (channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmail(data);
        break;
      case NotificationChannel.IN_APP:
        await this.sendInApp(data);
        break;
      case NotificationChannel.SLACK:
        await this.sendSlack(data);
        break;
      case NotificationChannel.WEBHOOK:
        await this.sendWebhook(data);
        break;
      case NotificationChannel.SMS:
        await this.sendSMS(data);
        break;
    }
  }

  private async sendEmail(data: NotificationData): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Sending email to ${data.recipientEmail}: ${data.title}`);
  }

  private async sendInApp(data: NotificationData): Promise<void> {
    // TODO: Store in database for in-app display
    console.log(`Sending in-app notification to ${data.recipientId}: ${data.title}`);
  }

  private async sendSlack(data: NotificationData): Promise<void> {
    // TODO: Integrate with Slack API
    console.log(`Sending Slack notification: ${data.title}`);
  }

  private async sendWebhook(data: NotificationData): Promise<void> {
    // TODO: Send to configured webhook URL
    console.log(`Sending webhook notification: ${data.title}`);
  }

  private async sendSMS(data: NotificationData): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending SMS notification: ${data.title}`);
  }

  private async storeNotification(data: NotificationData): Promise<void> {
    // TODO: Store notification in database
    console.log(`Storing notification: ${data.title}`);
  }

  private shouldSendNotification(type: NotificationType, preferences: NotificationPreferences): boolean {
    // Check if user wants this category of notifications
    if (type.startsWith('BUG_') && !preferences.bugNotifications) return false;
    if (type.startsWith('FEATURE_') && !preferences.featureNotifications) return false;
    if (type.startsWith('DEPLOYMENT_') && !preferences.deploymentNotifications) return false;
    if (type === NotificationType.SYSTEM_ALERT && !preferences.systemAlerts) return false;

    return true;
  }

  private mapBugSeverityToPriority(severity: string): NotificationPriority {
    const map: { [key: string]: NotificationPriority } = {
      CRITICAL: NotificationPriority.URGENT,
      HIGH: NotificationPriority.HIGH,
      MEDIUM: NotificationPriority.MEDIUM,
      LOW: NotificationPriority.LOW,
      TRIVIAL: NotificationPriority.LOW,
    };
    return map[severity] || NotificationPriority.MEDIUM;
  }

  private async notifyTeamLeads(data: Omit<NotificationData, 'recipientId'>): Promise<void> {
    // TODO: Get team lead IDs from database
    const teamLeadIds = ['TEAM_LEAD_1', 'TEAM_LEAD_2'];
    
    for (const leadId of teamLeadIds) {
      await this.sendNotification({
        ...data,
        recipientId: leadId,
      });
    }
  }

  private async notifyProductTeam(data: Omit<NotificationData, 'recipientId'>): Promise<void> {
    // TODO: Get product team IDs from database
    const productTeamIds = ['PRODUCT_MANAGER_1', 'PRODUCT_OWNER_1'];
    
    for (const memberId of productTeamIds) {
      await this.sendNotification({
        ...data,
        recipientId: memberId,
      });
    }
  }

  private async notifyDevelopmentTeam(data: Omit<NotificationData, 'recipientId'>): Promise<void> {
    // TODO: Get development team IDs from database
    const devTeamIds = ['DEV_1', 'DEV_2', 'DEV_3'];
    
    for (const devId of devTeamIds) {
      await this.sendNotification({
        ...data,
        recipientId: devId,
      });
    }
  }
}

export default NotificationService;