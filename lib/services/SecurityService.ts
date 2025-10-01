/**
 * Security Service
 * 
 * Provides comprehensive security features including:
 * - Session management
 * - Rate limiting
 * - Security monitoring
 * - Threat detection
 * - IP whitelisting/blacklisting
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface SessionOptions {
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  mfaVerified?: boolean;
  expiresInMinutes?: number;
}

export interface SessionInfo {
  id: string;
  sessionToken: string;
  userId: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  mfaVerified: boolean;
  riskScore: number;
}

export interface RateLimitOptions {
  identifier: string; // IP address or user ID
  action: string;
  maxAttempts: number;
  windowMinutes: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface SecurityAlert {
  alertType: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  userId?: string;
  ipAddress?: string;
  indicators: any;
}

// ============================================================================
// SECURITY SERVICE
// ============================================================================

export class SecurityService {
  private static instance: SecurityService;
  private rateLimitCache: Map<string, { count: number; resetAt: Date }> = new Map();
  private ipBlacklist: Set<string> = new Set();
  private ipWhitelist: Set<string> = new Set();

  private constructor() {
    // Load IP lists from database
    this.loadIPLists();
    
    // Clean up expired rate limit entries every 5 minutes
    setInterval(() => this.cleanupRateLimitCache(), 5 * 60 * 1000);
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Create a new session
   */
  async createSession(options: SessionOptions): Promise<SessionInfo> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (options.expiresInMinutes || 480)); // Default: 8 hours

    // Calculate risk score
    const riskScore = await this.calculateSessionRiskScore(options);

    // Parse user agent
    const deviceInfo = this.parseUserAgent(options.userAgent);

    const session = await prisma.userSession.create({
      data: {
        sessionToken,
        userId: options.userId,
        expiresAt,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        deviceId: options.deviceId,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        mfaVerified: options.mfaVerified || false,
        riskScore,
        active: true,
      },
    });

    return {
      id: session.id,
      sessionToken: session.sessionToken,
      userId: session.userId,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      mfaVerified: session.mfaVerified,
      riskScore: session.riskScore,
    };
  }

  /**
   * Validate session
   */
  async validateSession(sessionToken: string): Promise<SessionInfo | null> {
    const session = await prisma.userSession.findUnique({
      where: { sessionToken },
    });

    if (!session) return null;

    // Check if session is active and not expired
    if (!session.active || session.expiresAt < new Date()) {
      await this.terminateSession(sessionToken, 'Session expired or inactive');
      return null;
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        lastActivityAt: new Date(),
        requestCount: { increment: 1 },
      },
    });

    return {
      id: session.id,
      sessionToken: session.sessionToken,
      userId: session.userId,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      mfaVerified: session.mfaVerified,
      riskScore: session.riskScore,
    };
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionToken: string, reason?: string): Promise<void> {
    await prisma.userSession.update({
      where: { sessionToken },
      data: {
        active: false,
        terminatedAt: new Date(),
        terminationReason: reason,
      },
    });
  }

  /**
   * Terminate all user sessions
   */
  async terminateAllUserSessions(userId: string, reason?: string): Promise<number> {
    const result = await prisma.userSession.updateMany({
      where: {
        userId,
        active: true,
      },
      data: {
        active: false,
        terminatedAt: new Date(),
        terminationReason: reason || 'All sessions terminated',
      },
    });

    return result.count;
  }

  /**
   * Get active sessions for user
   */
  async getUserSessions(userId: string) {
    return prisma.userSession.findMany({
      where: {
        userId,
        active: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.userSession.updateMany({
      where: {
        active: true,
        expiresAt: { lt: new Date() },
      },
      data: {
        active: false,
        terminatedAt: new Date(),
        terminationReason: 'Session expired',
      },
    });

    return result.count;
  }

  /**
   * Generate session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate session risk score
   */
  private async calculateSessionRiskScore(options: SessionOptions): Promise<number> {
    let score = 0;

    // Check if IP is blacklisted
    if (this.ipBlacklist.has(options.ipAddress)) {
      score += 50;
    }

    // Check for unusual location (simplified - would need geolocation service)
    // score += await this.checkUnusualLocation(options.userId, options.ipAddress);

    // Check for unusual device
    const recentSessions = await prisma.userSession.findMany({
      where: {
        userId: options.userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { deviceId: true, userAgent: true },
    });

    const knownDevices = new Set(recentSessions.map(s => s.deviceId || s.userAgent));
    if (!knownDevices.has(options.deviceId || options.userAgent)) {
      score += 20;
    }

    // Check if MFA is not verified
    if (!options.mfaVerified) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Parse user agent string
   */
  private parseUserAgent(userAgent: string): {
    deviceType: string;
    browser: string;
    os: string;
  } {
    // Simplified user agent parsing
    let deviceType = 'desktop';
    let browser = 'unknown';
    let os = 'unknown';

    if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    else if (/tablet/i.test(userAgent)) deviceType = 'tablet';

    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';

    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/ios/i.test(userAgent)) os = 'iOS';

    return { deviceType, browser, os };
  }

  // ==========================================================================
  // RATE LIMITING
  // ==========================================================================

  /**
   * Check rate limit
   */
  async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const key = `${options.identifier}:${options.action}`;
    const now = new Date();

    let entry = this.rateLimitCache.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      const resetAt = new Date(now.getTime() + options.windowMinutes * 60 * 1000);
      entry = { count: 0, resetAt };
      this.rateLimitCache.set(key, entry);
    }

    entry.count++;

    const allowed = entry.count <= options.maxAttempts;
    const remaining = Math.max(0, options.maxAttempts - entry.count);

    // Create security alert if rate limit exceeded
    if (!allowed) {
      await this.createSecurityAlert({
        alertType: 'BRUTE_FORCE_ATTACK',
        severity: 'HIGH',
        title: 'Rate Limit Exceeded',
        description: `Rate limit exceeded for ${options.action}`,
        indicators: {
          identifier: options.identifier,
          action: options.action,
          attempts: entry.count,
          maxAttempts: options.maxAttempts,
        },
      });
    }

    return {
      allowed,
      remaining,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit
   */
  resetRateLimit(identifier: string, action: string): void {
    const key = `${identifier}:${action}`;
    this.rateLimitCache.delete(key);
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimitCache(): void {
    const now = new Date();
    for (const [key, entry] of this.rateLimitCache.entries()) {
      if (entry.resetAt < now) {
        this.rateLimitCache.delete(key);
      }
    }
  }

  // ==========================================================================
  // IP MANAGEMENT
  // ==========================================================================

  /**
   * Check if IP is blacklisted
   */
  isIPBlacklisted(ipAddress: string): boolean {
    return this.ipBlacklist.has(ipAddress);
  }

  /**
   * Check if IP is whitelisted
   */
  isIPWhitelisted(ipAddress: string): boolean {
    return this.ipWhitelist.has(ipAddress);
  }

  /**
   * Add IP to blacklist
   */
  async blacklistIP(ipAddress: string, reason: string): Promise<void> {
    this.ipBlacklist.add(ipAddress);
    
    await this.createSecurityAlert({
      alertType: 'POLICY_VIOLATION',
      severity: 'HIGH',
      title: 'IP Blacklisted',
      description: `IP address ${ipAddress} has been blacklisted`,
      ipAddress,
      indicators: { reason },
    });
  }

  /**
   * Remove IP from blacklist
   */
  removeIPFromBlacklist(ipAddress: string): void {
    this.ipBlacklist.delete(ipAddress);
  }

  /**
   * Add IP to whitelist
   */
  addIPToWhitelist(ipAddress: string): void {
    this.ipWhitelist.add(ipAddress);
  }

  /**
   * Remove IP from whitelist
   */
  removeIPFromWhitelist(ipAddress: string): void {
    this.ipWhitelist.delete(ipAddress);
  }

  /**
   * Load IP lists from database
   */
  private async loadIPLists(): Promise<void> {
    // This would load from database in production
    // For now, using in-memory sets
  }

  // ==========================================================================
  // SECURITY MONITORING
  // ==========================================================================

  /**
   * Create security alert
   */
  async createSecurityAlert(alert: SecurityAlert): Promise<string> {
    const securityAlert = await prisma.securityAlert.create({
      data: {
        alertType: alert.alertType as any,
        severity: alert.severity as any,
        title: alert.title,
        description: alert.description,
        source: 'security_service',
        userId: alert.userId,
        ipAddress: alert.ipAddress,
        indicators: alert.indicators,
        status: 'NEW',
      },
    });

    return securityAlert.id;
  }

  /**
   * Get active security alerts
   */
  async getActiveAlerts(filters?: {
    severity?: string;
    userId?: string;
    limit?: number;
  }) {
    return prisma.securityAlert.findMany({
      where: {
        status: { in: ['NEW', 'ACKNOWLEDGED'] },
        severity: filters?.severity as any,
        userId: filters?.userId,
      },
      orderBy: { detectedAt: 'desc' },
      take: filters?.limit || 100,
    });
  }

  /**
   * Acknowledge security alert
   */
  async acknowledgeAlert(alertId: string, assignedTo: string): Promise<void> {
    await prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        assignedTo,
        assignedAt: new Date(),
      },
    });
  }

  /**
   * Resolve security alert
   */
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    await prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolution,
      },
    });
  }

  /**
   * Detect anomalous behavior
   */
  async detectAnomalies(userId: string): Promise<boolean> {
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      },
    });

    // Check for rapid PHI access
    const phiAccess = recentActivity.filter(log => log.phiAccessed);
    if (phiAccess.length > 50) {
      await this.createSecurityAlert({
        alertType: 'ANOMALOUS_BEHAVIOR',
        severity: 'HIGH',
        title: 'Rapid PHI Access Detected',
        description: `User accessed ${phiAccess.length} PHI records in the last hour`,
        userId,
        indicators: {
          phiAccessCount: phiAccess.length,
          timeWindow: '1 hour',
        },
      });
      return true;
    }

    // Check for multiple failed attempts
    const failedAttempts = recentActivity.filter(log => log.outcome === 'FAILURE');
    if (failedAttempts.length > 10) {
      await this.createSecurityAlert({
        alertType: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        title: 'Multiple Failed Attempts',
        description: `User had ${failedAttempts.length} failed attempts in the last hour`,
        userId,
        indicators: {
          failedAttempts: failedAttempts.length,
          timeWindow: '1 hour',
        },
      });
      return true;
    }

    return false;
  }

  /**
   * Monitor for data exfiltration
   */
  async monitorDataExfiltration(userId: string): Promise<boolean> {
    const recentExports = await prisma.auditLog.count({
      where: {
        userId,
        eventType: 'PHI_EXPORTED',
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
    });

    if (recentExports > 10) {
      await this.createSecurityAlert({
        alertType: 'DATA_EXFILTRATION',
        severity: 'CRITICAL',
        title: 'Potential Data Exfiltration',
        description: `User exported ${recentExports} records in the last 24 hours`,
        userId,
        indicators: {
          exportCount: recentExports,
          timeWindow: '24 hours',
        },
      });
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();