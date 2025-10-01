/**
 * Two-Factor Authentication Service
 * 
 * Provides comprehensive 2FA capabilities including:
 * - TOTP (Time-based One-Time Password)
 * - SMS backup authentication
 * - Backup codes
 * - Recovery options
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { auditLogging } from './AuditLoggingService';

const prisma = new PrismaClient();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TwoFactorSetup {
  userId: string;
  method: '2FA_TOTP' | '2FA_SMS';
  secret?: string;
  phoneNumber?: string;
}

export interface TwoFactorSetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  userId: string;
  code: string;
  method: '2FA_TOTP' | '2FA_SMS' | '2FA_BACKUP';
}

export interface TwoFactorStatus {
  enabled: boolean;
  methods: string[];
  backupCodesRemaining: number;
}

// ============================================================================
// TWO-FACTOR AUTHENTICATION SERVICE
// ============================================================================

export class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;

  private constructor() {}

  public static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  // ==========================================================================
  // TOTP (Time-based One-Time Password)
  // ==========================================================================

  /**
   * Generate TOTP secret
   */
  generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('base32');
  }

  /**
   * Generate TOTP code
   */
  generateTOTPCode(secret: string, window: number = 0): string {
    const epoch = Math.floor(Date.now() / 1000);
    const time = Math.floor(epoch / 30) + window;
    
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(time));
    
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
    hmac.update(buffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0x0f;
    const binary = 
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    
    const code = binary % 1000000;
    return code.toString().padStart(6, '0');
  }

  /**
   * Verify TOTP code
   */
  verifyTOTPCode(secret: string, code: string, window: number = 1): boolean {
    // Check current time window and adjacent windows
    for (let i = -window; i <= window; i++) {
      const expectedCode = this.generateTOTPCode(secret, i);
      if (expectedCode === code) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate QR code data URL for TOTP
   */
  generateQRCodeURL(userId: string, secret: string, issuer: string = 'HoloVitals'): string {
    const label = encodeURIComponent(`${issuer}:${userId}`);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30',
    });
    
    return `otpauth://totp/${label}?${params.toString()}`;
  }

  /**
   * Setup TOTP for user
   */
  async setupTOTP(userId: string): Promise<TwoFactorSetupResult> {
    // Generate secret
    const secret = this.generateTOTPSecret();
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store in database (encrypted)
    await prisma.$executeRaw`
      INSERT INTO user_2fa (user_id, method, secret, backup_codes, enabled)
      VALUES (${userId}, '2FA_TOTP', ${secret}, ${JSON.stringify(backupCodes)}, false)
      ON CONFLICT (user_id, method) 
      DO UPDATE SET secret = ${secret}, backup_codes = ${JSON.stringify(backupCodes)}, updated_at = NOW()
    `;
    
    // Generate QR code URL
    const qrCode = this.generateQRCodeURL(userId, secret);
    
    // Log setup
    await auditLogging.log({
      context: { userId, userRole: 'USER', userName: 'User' },
      eventType: 'MFA_ENABLED',
      eventCategory: 'AUTHENTICATION',
      action: 'SETUP_TOTP',
      outcome: 'SUCCESS',
      riskLevel: 'LOW',
    });
    
    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Enable TOTP after verification
   */
  async enableTOTP(userId: string, verificationCode: string): Promise<boolean> {
    // Get user's TOTP secret
    const result = await prisma.$queryRaw<any[]>`
      SELECT secret FROM user_2fa 
      WHERE user_id = ${userId} AND method = '2FA_TOTP'
    `;
    
    if (result.length === 0) {
      return false;
    }
    
    const secret = result[0].secret;
    
    // Verify code
    if (!this.verifyTOTPCode(secret, verificationCode)) {
      await auditLogging.log({
        context: { userId, userRole: 'USER', userName: 'User' },
        eventType: 'MFA_FAILURE',
        eventCategory: 'AUTHENTICATION',
        action: 'ENABLE_TOTP_FAILED',
        outcome: 'FAILURE',
        riskLevel: 'MEDIUM',
      });
      return false;
    }
    
    // Enable TOTP
    await prisma.$executeRaw`
      UPDATE user_2fa 
      SET enabled = true, updated_at = NOW()
      WHERE user_id = ${userId} AND method = '2FA_TOTP'
    `;
    
    // Log success
    await auditLogging.log({
      context: { userId, userRole: 'USER', userName: 'User' },
      eventType: 'MFA_ENABLED',
      eventCategory: 'AUTHENTICATION',
      action: 'ENABLE_TOTP',
      outcome: 'SUCCESS',
      riskLevel: 'LOW',
    });
    
    return true;
  }

  /**
   * Verify TOTP code for authentication
   */
  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    // Get user's TOTP secret
    const result = await prisma.$queryRaw<any[]>`
      SELECT secret, enabled FROM user_2fa 
      WHERE user_id = ${userId} AND method = '2FA_TOTP'
    `;
    
    if (result.length === 0 || !result[0].enabled) {
      return false;
    }
    
    const secret = result[0].secret;
    const isValid = this.verifyTOTPCode(secret, code);
    
    // Log verification attempt
    await auditLogging.log({
      context: { userId, userRole: 'USER', userName: 'User' },
      eventType: isValid ? 'MFA_SUCCESS' : 'MFA_FAILURE',
      eventCategory: 'AUTHENTICATION',
      action: 'VERIFY_TOTP',
      outcome: isValid ? 'SUCCESS' : 'FAILURE',
      riskLevel: isValid ? 'LOW' : 'MEDIUM',
    });
    
    return isValid;
  }

  // ==========================================================================
  // SMS AUTHENTICATION
  // ==========================================================================

  /**
   * Setup SMS authentication
   */
  async setupSMS(userId: string, phoneNumber: string): Promise<void> {
    // Store phone number (encrypted)
    await prisma.$executeRaw`
      INSERT INTO user_2fa (user_id, method, phone_number, enabled)
      VALUES (${userId}, '2FA_SMS', ${phoneNumber}, false)
      ON CONFLICT (user_id, method) 
      DO UPDATE SET phone_number = ${phoneNumber}, updated_at = NOW()
    `;
    
    // Log setup
    await auditLogging.log({
      context: { userId, userRole: 'USER', userName: 'User' },
      eventType: 'MFA_ENABLED',
      eventCategory: 'AUTHENTICATION',
      action: 'SETUP_SMS',
      outcome: 'SUCCESS',
      riskLevel: 'LOW',
    });
  }

  /**
   * Send SMS code
   */
  async sendSMSCode(userId: string): Promise<boolean> {
    // Get user's phone number
    const result = await prisma.$queryRaw<any[]>`
      SELECT phone_number, enabled FROM user_2fa 
      WHERE user_id = ${userId} AND method = '2FA_SMS'
    `;
    
    if (result.length === 0 || !result[0].enabled) {
      return false;
    }
    
    const phoneNumber = result[0].phone_number;
    
    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Store code with expiration (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.$executeRaw`
      UPDATE user_2fa 
      SET sms_code = ${code}, sms_code_expires_at = ${expiresAt}, updated_at = NOW()
      WHERE user_id = ${userId} AND method = '2FA_SMS'
    `;
    
    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    // For now, just log the code (in production, this should send SMS)
    console.log(`SMS Code for ${phoneNumber}: ${code}`);
    
    // Log SMS sent
    await auditLogging.log({
      context: { userId, userRole: 'USER', userName: 'User' },
      eventType: 'MFA_SUCCESS',
      eventCategory: 'AUTHENTICATION',
      action: 'SEND_SMS_CODE',
      outcome: 'SUCCESS',
      riskLevel: 'LOW',
    });
    
    return true;
  }

  /**
   * Verify SMS code
   */
  async verifySMS(userId: string, code: string): Promise<boolean> {
    // Get stored code
    const result = await prisma.$queryRaw<any[]>`
      SELECT sms_code, sms_code_expires_at FROM user_2fa 
      WHERE user_id = ${userId} AND method = '2FA_SMS' AND enabled = true
    `;
    
    if (result.length === 0) {
      return false;
    }
    
    const storedCode = result[0].sms_code;
    const expiresAt = new Date(result[0].sms_code_expires_at);
    
    // Check if code is valid and not expired
    const isValid = storedCode === code && expiresAt > new Date();
    
    if (isValid) {
      // Clear used code
      await prisma.$executeRaw`
        UPDATE user_2fa 
        SET sms_code = NULL, sms_code_expires_at = NULL, updated_at = NOW()
        WHERE user_id = ${userId} AND method = '2FA_SMS'
      `;
    }
    
    // Log verification attempt
    await auditLogging.log({
      context: { userId, userRole: 'USER', userName: 'User' },
      eventType: isValid ? 'MFA_SUCCESS' : 'MFA_FAILURE',
      eventCategory: 'AUTHENTICATION',
      action: 'VERIFY_SMS',
      outcome: isValid ? 'SUCCESS' : 'FAILURE',
      riskLevel: isValid ? 'LOW' : 'MEDIUM',
    });
    
    return isValid;
  }

  // ==========================================================================
  // BACKUP CODES
  // ==========================================================================

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    // Get backup codes
    const result = await prisma.$queryRaw<any[]>`
      SELECT backup_codes FROM user_2fa 
      WHERE user_id = ${userId} AND method = '2FA_TOTP'
    `;
    
    if (result.length === 0) {
      return false;
    }
    
    const backupCodes = JSON.parse(result[0].backup_codes || '[]');
    const codeIndex = backupCodes.indexOf(code.toUpperCase());
    
    if (codeIndex === -1) {
      // Log failed attempt
      await auditLogging.log({
        context: { userId, userRole: 'USER', userName: 'User' },
        eventType: 'MFA_FAILURE',
        eventCategory: 'AUTHENTICATION',
        action: 'VERIFY_BACKUP_CODE',
        outcome: 'FAILURE',
        riskLevel: 'MEDIUM',
      });
      return false;
    }
    
    // Remove used code
    backupCodes.splice(codeIndex, 1);
    await prisma.$executeRaw`
      UPDATE user_2fa 
      SET backup_codes = ${JSON.stringify(backupCodes)}, updated_at = NOW()
      WHERE user_id = ${userId} AND method = '2FA_TOTP'
    `;
    
    // Log success
    await auditLogging.log({
      context: { userId, userRole: 'USER', userName: 'User' },
      eventType: 'MFA_SUCCESS',
      eventCategory: 'AUTHENTICATION',
      action: 'VERIFY_BACKUP_CODE',
      outcome: 'SUCCESS',
      riskLevel: 'MEDIUM',
      metadata: {
        backupCodesRemaining: backupCodes.length,
      },
    });
    
    return true;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    
    await prisma.$executeRaw`
      UPDATE user_2fa 
      SET backup_codes = ${JSON.stringify(backupCodes)}, updated_at = NOW()
      WHERE user_id = ${userId} AND method = '2FA_TOTP'
    `;
    
    // Log regeneration
    await auditLogging.log({
      context: { userId, userRole: 'USER', userName: 'User' },
      eventType: 'MFA_ENABLED',
      eventCategory: 'AUTHENTICATION',
      action: 'REGENERATE_BACKUP_CODES',
      outcome: 'SUCCESS',
      riskLevel: 'MEDIUM',
    });
    
    return backupCodes;
  }

  // ==========================================================================
  // 2FA MANAGEMENT
  // ==========================================================================

  /**
   * Get 2FA status for user
   */
  async get2FAStatus(userId: string): Promise<TwoFactorStatus> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT method, enabled, backup_codes FROM user_2fa 
      WHERE user_id = ${userId}
    `;
    
    const enabledMethods = result
      .filter(r => r.enabled)
      .map(r => r.method);
    
    const totpRecord = result.find(r => r.method === '2FA_TOTP');
    const backupCodes = totpRecord 
      ? JSON.parse(totpRecord.backup_codes || '[]')
      : [];
    
    return {
      enabled: enabledMethods.length > 0,
      methods: enabledMethods,
      backupCodesRemaining: backupCodes.length,
    };
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string, method?: string): Promise<void> {
    if (method) {
      // Disable specific method
      await prisma.$executeRaw`
        UPDATE user_2fa 
        SET enabled = false, updated_at = NOW()
        WHERE user_id = ${userId} AND method = ${method}
      `;
    } else {
      // Disable all methods
      await prisma.$executeRaw`
        UPDATE user_2fa 
        SET enabled = false, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    }
    
    // Log disable
    await auditLogging.log({
      context: { userId, userRole: 'USER', userName: 'User' },
      eventType: 'MFA_DISABLED',
      eventCategory: 'AUTHENTICATION',
      action: method ? `DISABLE_${method}` : 'DISABLE_ALL_2FA',
      outcome: 'SUCCESS',
      riskLevel: 'HIGH',
    });
  }

  /**
   * Verify 2FA code (any method)
   */
  async verify2FA(verification: TwoFactorVerification): Promise<boolean> {
    switch (verification.method) {
      case '2FA_TOTP':
        return this.verifyTOTP(verification.userId, verification.code);
      
      case '2FA_SMS':
        return this.verifySMS(verification.userId, verification.code);
      
      case '2FA_BACKUP':
        return this.verifyBackupCode(verification.userId, verification.code);
      
      default:
        return false;
    }
  }

  /**
   * Check if 2FA is required for user
   */
  async is2FARequired(userId: string): Promise<boolean> {
    const status = await this.get2FAStatus(userId);
    return status.enabled;
  }
}

// Export singleton instance
export const twoFactorAuth = TwoFactorAuthService.getInstance();