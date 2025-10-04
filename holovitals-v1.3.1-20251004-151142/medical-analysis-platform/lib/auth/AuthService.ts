/**
 * Authentication Service for HoloVitals
 * 
 * Implements secure authentication with:
 * - Password hashing with bcrypt
 * - JWT token management
 * - Multi-Factor Authentication (MFA) with TOTP
 * - Session management
 * - Account lockout protection
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
  mfaVerified?: boolean;
}

export type UserRole = 'patient' | 'specialist' | 'admin';

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface SessionInfo {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Register a new patient account
   */
  async register(data: RegisterData): Promise<AuthUser> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate password strength
    this.validatePasswordStrength(data.password);

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create patient profile
    await prisma.patient.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        createdAt: new Date()
      }
    });

    return {
      id: user.id,
      email: user.email,
      role: 'patient',
      mfaEnabled: false
    };
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    await this.checkAccountLockout(user.id);

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

    if (!isValidPassword) {
      await this.recordFailedLogin(user.id);
      throw new Error('Invalid credentials');
    }

    // Check MFA if enabled
    const mfaEnabled = await this.isMFAEnabled(user.id);
    
    if (mfaEnabled) {
      if (!credentials.mfaToken) {
        throw new Error('MFA token required');
      }

      const isValidMFA = await this.verifyMFAToken(user.id, credentials.mfaToken);
      if (!isValidMFA) {
        await this.recordFailedLogin(user.id);
        throw new Error('Invalid MFA token');
      }
    }

    // Reset failed login attempts
    await this.resetFailedLoginAttempts(user.id);

    // Get user role
    const role = await this.getUserRole(user.id);

    // Create session
    const sessionId = await this.createSession(user.id, ipAddress, userAgent);

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role,
      mfaEnabled,
      mfaVerified: true
    }, sessionId);

    return tokens;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;

      // Verify session is still valid
      const session = await this.getSession(decoded.sessionId);
      if (!session || session.expiresAt < new Date()) {
        throw new Error('Session expired');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get user role
      const role = await this.getUserRole(user.id);

      // Generate new tokens
      return this.generateTokens({
        id: user.id,
        email: user.email,
        role,
        mfaEnabled: decoded.mfaEnabled,
        mfaVerified: decoded.mfaVerified
      }, decoded.sessionId);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    await this.destroySession(sessionId);
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId: string): Promise<MFASetup> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `HoloVitals (${user.email})`,
      issuer: 'HoloVitals'
    });

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);

    // Store MFA secret (encrypted in production)
    await prisma.$executeRaw`
      UPDATE users 
      SET mfa_secret = ${secret.base32},
          mfa_backup_codes = ${JSON.stringify(backupCodes)},
          updated_at = NOW()
      WHERE id = ${userId}
    `;

    return {
      secret: secret.base32,
      qrCode,
      backupCodes
    };
  }

  /**
   * Enable MFA after verification
   */
  async enableMFA(userId: string, token: string): Promise<void> {
    const isValid = await this.verifyMFAToken(userId, token);
    
    if (!isValid) {
      throw new Error('Invalid MFA token');
    }

    await prisma.$executeRaw`
      UPDATE users 
      SET mfa_enabled = true,
          updated_at = NOW()
      WHERE id = ${userId}
    `;
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    await prisma.$executeRaw`
      UPDATE users 
      SET mfa_enabled = false,
          mfa_secret = NULL,
          mfa_backup_codes = NULL,
          updated_at = NOW()
      WHERE id = ${userId}
    `;
  }

  /**
   * Verify MFA token
   */
  async verifyMFAToken(userId: string, token: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT mfa_secret, mfa_backup_codes 
      FROM users 
      WHERE id = ${userId}
    `;

    if (!result || result.length === 0) {
      return false;
    }

    const { mfa_secret, mfa_backup_codes } = result[0];

    if (!mfa_secret) {
      return false;
    }

    // Verify TOTP token
    const isValidTOTP = speakeasy.totp.verify({
      secret: mfa_secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps before/after
    });

    if (isValidTOTP) {
      return true;
    }

    // Check backup codes
    if (mfa_backup_codes) {
      const backupCodes = JSON.parse(mfa_backup_codes);
      const codeIndex = backupCodes.indexOf(token);
      
      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await prisma.$executeRaw`
          UPDATE users 
          SET mfa_backup_codes = ${JSON.stringify(backupCodes)}
          WHERE id = ${userId}
        `;
        return true;
      }
    }

    return false;
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid current password');
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });

    // Invalidate all sessions except current
    await this.invalidateAllSessions(userId);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): AuthUser {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        mfaEnabled: decoded.mfaEnabled,
        mfaVerified: decoded.mfaVerified
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Private helper methods

  private generateTokens(user: AuthUser, sessionId: string): AuthTokens {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
        mfaVerified: user.mfaVerified,
        sessionId
      },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        sessionId,
        mfaEnabled: user.mfaEnabled,
        mfaVerified: user.mfaVerified
      },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  private async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);

    await prisma.$executeRaw`
      INSERT INTO user_sessions (id, user_id, expires_at, ip_address, user_agent, created_at)
      VALUES (${sessionId}, ${userId}, ${expiresAt}, ${ipAddress}, ${userAgent}, NOW())
    `;

    return sessionId;
  }

  private async getSession(sessionId: string): Promise<SessionInfo | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM user_sessions WHERE id = ${sessionId}
    `;

    if (!result || result.length === 0) {
      return null;
    }

    const session = result[0];
    return {
      userId: session.user_id,
      email: session.email,
      role: session.role,
      sessionId: session.id,
      createdAt: session.created_at,
      expiresAt: session.expires_at,
      ipAddress: session.ip_address,
      userAgent: session.user_agent
    };
  }

  private async destroySession(sessionId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM user_sessions WHERE id = ${sessionId}
    `;
  }

  private async invalidateAllSessions(userId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM user_sessions WHERE user_id = ${userId}
    `;
  }

  private async getUserRole(userId: string): Promise<UserRole> {
    // Check if patient
    const patient = await prisma.patient.findFirst({
      where: { userId }
    });

    if (patient) {
      return 'patient';
    }

    // Check if specialist (would be in a specialists table)
    // For now, default to patient
    return 'patient';
  }

  private async isMFAEnabled(userId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT mfa_enabled FROM users WHERE id = ${userId}
    `;

    return result && result.length > 0 && result[0].mfa_enabled;
  }

  private async checkAccountLockout(userId: string): Promise<void> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT failed_login_attempts, last_failed_login 
      FROM users 
      WHERE id = ${userId}
    `;

    if (!result || result.length === 0) {
      return;
    }

    const { failed_login_attempts, last_failed_login } = result[0];

    if (failed_login_attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockoutEnd = new Date(last_failed_login.getTime() + this.LOCKOUT_DURATION);
      
      if (new Date() < lockoutEnd) {
        const minutesLeft = Math.ceil((lockoutEnd.getTime() - Date.now()) / 60000);
        throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`);
      } else {
        // Lockout period expired, reset attempts
        await this.resetFailedLoginAttempts(userId);
      }
    }
  }

  private async recordFailedLogin(userId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          last_failed_login = NOW()
      WHERE id = ${userId}
    `;
  }

  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE users 
      SET failed_login_attempts = 0,
          last_failed_login = NULL
      WHERE id = ${userId}
    `;
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters long');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

export const authService = new AuthService();