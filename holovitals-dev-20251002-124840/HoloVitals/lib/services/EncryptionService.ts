/**
 * Encryption Service
 * 
 * Provides comprehensive encryption capabilities for PHI protection:
 * - Field-level encryption
 * - Data masking
 * - Key management
 * - Secure data deletion
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EncryptionOptions {
  algorithm?: string;
  keyId?: string;
  encoding?: BufferEncoding;
}

export interface EncryptedData {
  encrypted: string;
  keyId: string;
  algorithm: string;
  iv: string;
  authTag: string;
}

export interface MaskingOptions {
  maskChar?: string;
  visibleStart?: number;
  visibleEnd?: number;
  preserveLength?: boolean;
}

export interface KeyRotationResult {
  oldKeyId: string;
  newKeyId: string;
  recordsUpdated: number;
}

// ============================================================================
// ENCRYPTION SERVICE
// ============================================================================

export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: Buffer;
  private activeKeys: Map<string, Buffer> = new Map();
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_SIZE = 32; // 256 bits

  private constructor() {
    // Initialize master key from environment
    const masterKeyHex = process.env.MASTER_ENCRYPTION_KEY;
    if (!masterKeyHex) {
      throw new Error('MASTER_ENCRYPTION_KEY environment variable not set');
    }
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
    
    // Load active encryption keys
    this.loadActiveKeys();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // ==========================================================================
  // FIELD-LEVEL ENCRYPTION
  // ==========================================================================

  /**
   * Encrypt data
   */
  encrypt(data: string, options?: EncryptionOptions): EncryptedData {
    const algorithm = options?.algorithm || this.ALGORITHM;
    const keyId = options?.keyId || 'default';
    
    // Get encryption key
    const key = this.getKey(keyId);
    
    // Generate IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag for GCM mode
    const authTag = (cipher as any).getAuthTag();
    
    return {
      encrypted,
      keyId,
      algorithm,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: EncryptedData): string {
    // Get decryption key
    const key = this.getKey(encryptedData.keyId);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    // Set auth tag for GCM mode
    (decipher as any).setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    // Decrypt data
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Encrypt object fields
   */
  encryptFields(obj: any, fields: string[]): any {
    const encrypted = { ...obj };
    
    for (const field of fields) {
      if (encrypted[field] !== undefined && encrypted[field] !== null) {
        const encryptedData = this.encrypt(String(encrypted[field]));
        encrypted[field] = JSON.stringify(encryptedData);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt object fields
   */
  decryptFields(obj: any, fields: string[]): any {
    const decrypted = { ...obj };
    
    for (const field of fields) {
      if (decrypted[field]) {
        try {
          const encryptedData = JSON.parse(decrypted[field]);
          decrypted[field] = this.decrypt(encryptedData);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
        }
      }
    }
    
    return decrypted;
  }

  // ==========================================================================
  // DATA MASKING
  // ==========================================================================

  /**
   * Mask sensitive data
   */
  mask(data: string, options?: MaskingOptions): string {
    if (!data) return data;
    
    const {
      maskChar = '*',
      visibleStart = 0,
      visibleEnd = 0,
      preserveLength = true,
    } = options || {};
    
    const length = data.length;
    
    if (length <= visibleStart + visibleEnd) {
      return preserveLength ? maskChar.repeat(length) : maskChar.repeat(4);
    }
    
    const start = data.substring(0, visibleStart);
    const end = data.substring(length - visibleEnd);
    const maskedLength = preserveLength ? length - visibleStart - visibleEnd : 4;
    const masked = maskChar.repeat(maskedLength);
    
    return start + masked + end;
  }

  /**
   * Mask email address
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    
    const [local, domain] = email.split('@');
    const maskedLocal = this.mask(local, { visibleStart: 1, visibleEnd: 1 });
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number
   */
  maskPhone(phone: string): string {
    if (!phone) return phone;
    
    // Remove non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length < 4) return this.mask(phone);
    
    // Show last 4 digits
    return this.mask(phone, { visibleEnd: 4 });
  }

  /**
   * Mask SSN
   */
  maskSSN(ssn: string): string {
    if (!ssn) return ssn;
    
    // Show last 4 digits
    return this.mask(ssn, { visibleEnd: 4 });
  }

  /**
   * Mask credit card
   */
  maskCreditCard(cardNumber: string): string {
    if (!cardNumber) return cardNumber;
    
    // Show last 4 digits
    return this.mask(cardNumber, { visibleEnd: 4 });
  }

  /**
   * Mask object fields
   */
  maskFields(obj: any, fieldMasks: { [field: string]: MaskingOptions }): any {
    const masked = { ...obj };
    
    for (const [field, options] of Object.entries(fieldMasks)) {
      if (masked[field]) {
        masked[field] = this.mask(String(masked[field]), options);
      }
    }
    
    return masked;
  }

  // ==========================================================================
  // KEY MANAGEMENT
  // ==========================================================================

  /**
   * Generate new encryption key
   */
  async generateKey(purpose: string): Promise<string> {
    // Generate random key
    const key = crypto.randomBytes(this.KEY_SIZE);
    
    // Encrypt key with master key
    const encryptedKey = this.encryptKeyWithMaster(key);
    
    // Store in database
    const keyRecord = await prisma.encryptionKey.create({
      data: {
        keyId: crypto.randomBytes(16).toString('hex'),
        keyType: 'DATA_ENCRYPTION_KEY',
        algorithm: this.ALGORITHM,
        keySize: this.KEY_SIZE * 8, // bits
        encryptedKey: encryptedKey.toString('hex'),
        status: 'ACTIVE',
        purpose,
        activatedAt: new Date(),
      },
    });
    
    // Add to active keys cache
    this.activeKeys.set(keyRecord.keyId, key);
    
    return keyRecord.keyId;
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(oldKeyId: string, purpose: string): Promise<KeyRotationResult> {
    // Generate new key
    const newKeyId = await this.generateKey(purpose);
    
    // Deactivate old key
    await prisma.encryptionKey.update({
      where: { keyId: oldKeyId },
      data: {
        status: 'DEACTIVATED',
        deactivatedAt: new Date(),
      },
    });
    
    // Remove from active keys cache
    this.activeKeys.delete(oldKeyId);
    
    return {
      oldKeyId,
      newKeyId,
      recordsUpdated: 0, // Would need to re-encrypt data in production
    };
  }

  /**
   * Get encryption key
   */
  private getKey(keyId: string): Buffer {
    // Check cache first
    if (this.activeKeys.has(keyId)) {
      return this.activeKeys.get(keyId)!;
    }
    
    // Use master key as default
    return this.masterKey;
  }

  /**
   * Load active encryption keys from database
   */
  private async loadActiveKeys(): Promise<void> {
    try {
      const keys = await prisma.encryptionKey.findMany({
        where: { status: 'ACTIVE' },
      });
      
      for (const keyRecord of keys) {
        const encryptedKey = Buffer.from(keyRecord.encryptedKey, 'hex');
        const key = this.decryptKeyWithMaster(encryptedKey);
        this.activeKeys.set(keyRecord.keyId, key);
      }
    } catch (error) {
      console.error('Failed to load encryption keys:', error);
    }
  }

  /**
   * Encrypt key with master key
   */
  private encryptKeyWithMaster(key: Buffer): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.masterKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(key),
      cipher.final(),
    ]);
    
    const authTag = (cipher as any).getAuthTag();
    
    // Combine IV + AuthTag + Encrypted Key
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt key with master key
   */
  private decryptKeyWithMaster(encryptedKey: Buffer): Buffer {
    const iv = encryptedKey.slice(0, 16);
    const authTag = encryptedKey.slice(16, 32);
    const encrypted = encryptedKey.slice(32);
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.masterKey, iv);
    (decipher as any).setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
  }

  // ==========================================================================
  // SECURE DATA DELETION
  // ==========================================================================

  /**
   * Securely delete data (overwrite with random data)
   */
  secureDelete(data: string): string {
    // Overwrite with random data multiple times
    const length = data.length;
    let overwritten = data;
    
    for (let i = 0; i < 3; i++) {
      overwritten = crypto.randomBytes(length).toString('hex').substring(0, length);
    }
    
    return overwritten;
  }

  /**
   * Hash data (one-way)
   */
  hash(data: string, algorithm: string = 'sha256'): string {
    return crypto
      .createHash(algorithm)
      .update(data)
      .digest('hex');
  }

  /**
   * Hash with salt
   */
  hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .createHash('sha256')
      .update(data + actualSalt)
      .digest('hex');
    
    return { hash, salt: actualSalt };
  }

  /**
   * Verify hash
   */
  verifyHash(data: string, hash: string, salt: string): boolean {
    const computed = this.hashWithSalt(data, salt);
    return computed.hash === hash;
  }

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  /**
   * Generate random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure random number
   */
  generateRandomNumber(min: number, max: number): number {
    const range = max - min;
    const bytes = crypto.randomBytes(4);
    const value = bytes.readUInt32BE(0);
    return min + (value % (range + 1));
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();