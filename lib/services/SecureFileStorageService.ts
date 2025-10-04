/**
 * Secure File Storage Service
 * 
 * Provides secure file storage for PHI documents with:
 * - File encryption
 * - Access control
 * - Audit logging
 * - Retention policies
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { encryptionService } from './EncryptionService';
import { auditLogging } from './AuditLoggingService';
import { accessControlService } from './AccessControlService';

const prisma = new PrismaClient();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface FileUploadOptions {
  userId: string;
  customerId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  description?: string;
  tags?: string[];
  encrypt?: boolean;
}

export interface FileMetadata {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  description?: string;
  tags: string[];
  encrypted: boolean;
  uploadedBy: string;
  uploadedAt: Date;
  customerId?: string;
  accessCount: number;
}

export interface FileAccessOptions {
  userId: string;
  fileId: string;
  reason: string;
}

export interface FileSearchOptions {
  customerId?: string;
  category?: string;
  tags?: string[];
  uploadedBy?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// SECURE FILE STORAGE SERVICE
// ============================================================================

export class SecureFileStorageService {
  private static instance: SecureFileStorageService;
  private storageBasePath: string;

  private constructor() {
    this.storageBasePath = process.env.FILE_STORAGE_PATH || '/workspace/secure-storage';
    this.initializeStorage();
  }

  public static getInstance(): SecureFileStorageService {
    if (!SecureFileStorageService.instance) {
      SecureFileStorageService.instance = new SecureFileStorageService();
    }
    return SecureFileStorageService.instance;
  }

  /**
   * Initialize storage directory
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storageBasePath, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  // ==========================================================================
  // FILE UPLOAD
  // ==========================================================================

  /**
   * Upload file
   */
  async uploadFile(
    fileBuffer: Buffer,
    options: FileUploadOptions
  ): Promise<FileMetadata> {
    try {
      // Generate unique file ID
      const fileId = crypto.randomBytes(16).toString('hex');
      
      // Determine storage path
      const storagePath = this.getStoragePath(fileId);
      
      // Encrypt file if required
      let finalBuffer = fileBuffer;
      let encryptionMetadata: any = null;
      
      if (options.encrypt !== false) {
        const encrypted = encryptionService.encrypt(fileBuffer.toString('base64'));
        finalBuffer = Buffer.from(JSON.stringify(encrypted));
        encryptionMetadata = {
          algorithm: 'aes-256-gcm',
          keyId: 'default',
        };
      }
      
      // Write file to storage
      await fs.writeFile(storagePath, finalBuffer);
      
      // Calculate file hash
      const fileHash = crypto
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex');
      
      // Store metadata in database
      const metadata = await prisma.$queryRaw<any[]>`
        INSERT INTO secure_files (
          id, file_name, file_type, file_size, file_hash,
          category, description, tags, encrypted, encryption_metadata,
          storage_path, uploaded_by, customer_id, created_at
        ) VALUES (
          ${fileId}, ${options.fileName}, ${options.fileType}, ${options.fileSize},
          ${fileHash}, ${options.category}, ${options.description},
          ${JSON.stringify(options.tags || [])}, ${options.encrypt !== false},
          ${JSON.stringify(encryptionMetadata)}, ${storagePath},
          ${options.userId}, ${options.customerId}, NOW()
        )
        RETURNING *
      `;
      
      // Log file upload
      await auditLogging.logPHIAccess(
        {
          userId: options.userId,
          userRole: 'USER',
        },
        {
          customerId: options.customerId || '',
          dataAccessed: ['file_upload'],
          accessReason: 'File upload',
          action: 'CREATE',
        }
      );
      
      return this.formatMetadata(metadata[0]);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error('File upload failed');
    }
  }

  // ==========================================================================
  // FILE DOWNLOAD
  // ==========================================================================

  /**
   * Download file
   */
  async downloadFile(options: FileAccessOptions): Promise<Buffer> {
    try {
      // Check access
      const hasAccess = await this.checkFileAccess(options.userId, options.fileId);
      
      if (!hasAccess) {
        throw new Error('Access denied');
      }
      
      // Get file metadata
      const metadata = await this.getFileMetadata(options.fileId);
      
      if (!metadata) {
        throw new Error('File not found');
      }
      
      // Read file from storage
      const fileBuffer = await fs.readFile(metadata.storagePath);
      
      // Decrypt if encrypted
      let finalBuffer = fileBuffer;
      
      if (metadata.encrypted) {
        const encryptedData = JSON.parse(fileBuffer.toString());
        const decrypted = encryptionService.decrypt(encryptedData);
        finalBuffer = Buffer.from(decrypted, 'base64');
      }
      
      // Update access count
      await prisma.$executeRaw`
        UPDATE secure_files 
        SET access_count = access_count + 1, last_accessed_at = NOW()
        WHERE id = ${options.fileId}
      `;
      
      // Log file access
      await auditLogging.logPHIAccess(
        {
          userId: options.userId,
          userRole: 'USER',
        },
        {
          customerId: metadata.customerId || '',
          dataAccessed: ['file_download'],
          accessReason: options.reason,
          action: 'VIEW',
        }
      );
      
      return finalBuffer;
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error('File download failed');
    }
  }

  // ==========================================================================
  // FILE MANAGEMENT
  // ==========================================================================

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<any> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM secure_files WHERE id = ${fileId}
    `;
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Search files
   */
  async searchFiles(options: FileSearchOptions): Promise<{
    files: FileMetadata[];
    total: number;
  }> {
    let whereConditions: string[] = [];
    let params: any[] = [];
    
    if (options.customerId) {
      whereConditions.push(`customer_id = $${params.length + 1}`);
      params.push(options.customerId);
    }
    
    if (options.category) {
      whereConditions.push(`category = $${params.length + 1}`);
      params.push(options.category);
    }
    
    if (options.uploadedBy) {
      whereConditions.push(`uploaded_by = $${params.length + 1}`);
      params.push(options.uploadedBy);
    }
    
    if (options.startDate) {
      whereConditions.push(`created_at >= $${params.length + 1}`);
      params.push(options.startDate);
    }
    
    if (options.endDate) {
      whereConditions.push(`created_at <= $${params.length + 1}`);
      params.push(options.endDate);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const [files, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM secure_files 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `, ...params),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count FROM secure_files ${whereClause}
      `, ...params),
    ]);
    
    return {
      files: files.map(f => this.formatMetadata(f)),
      total: parseInt(countResult[0].count),
    };
  }

  /**
   * Delete file
   */
  async deleteFile(userId: string, fileId: string, reason: string): Promise<void> {
    try {
      // Check access
      const hasAccess = await this.checkFileAccess(userId, fileId);
      
      if (!hasAccess) {
        throw new Error('Access denied');
      }
      
      // Get file metadata
      const metadata = await this.getFileMetadata(fileId);
      
      if (!metadata) {
        throw new Error('File not found');
      }
      
      // Delete file from storage
      await fs.unlink(metadata.storage_path);
      
      // Mark as deleted in database (soft delete)
      await prisma.$executeRaw`
        UPDATE secure_files 
        SET deleted = true, deleted_at = NOW(), deleted_by = ${userId}
        WHERE id = ${fileId}
      `;
      
      // Log file deletion
      await auditLogging.logPHIAccess(
        {
          userId,
          userRole: 'USER',
        },
        {
          customerId: metadata.customer_id || '',
          dataAccessed: ['file_delete'],
          accessReason: reason,
          action: 'DELETE',
        }
      );
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('File deletion failed');
    }
  }

  // ==========================================================================
  // ACCESS CONTROL
  // ==========================================================================

  /**
   * Check file access
   */
  async checkFileAccess(userId: string, fileId: string): Promise<boolean> {
    try {
      // Get file metadata
      const metadata = await this.getFileMetadata(fileId);
      
      if (!metadata) {
        return false;
      }
      
      // Check if user uploaded the file
      if (metadata.uploaded_by === userId) {
        return true;
      }
      
      // Check access control for customer files
      if (metadata.customer_id) {
        const accessResult = await accessControlService.checkAccess({
          userId,
          resource: 'customer_file',
          action: 'read',
          context: {
            customerId: metadata.customer_id,
          },
        });
        
        return accessResult.granted;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check file access:', error);
      return false;
    }
  }

  /**
   * Grant file access
   */
  async grantFileAccess(
    fileId: string,
    userId: string,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO file_access_grants (file_id, user_id, granted_by, expires_at)
      VALUES (${fileId}, ${userId}, ${grantedBy}, ${expiresAt})
    `;
    
    // Log access grant
    await auditLogging.logAdministrative(
      {
        userId: grantedBy,
        userRole: 'ADMIN',
      },
      {
        action: 'GRANT_FILE_ACCESS',
        resourceType: 'FILE',
        resourceId: fileId,
        description: `Granted file access to user ${userId}`,
      }
    );
  }

  /**
   * Revoke file access
   */
  async revokeFileAccess(fileId: string, userId: string, revokedBy: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM file_access_grants 
      WHERE file_id = ${fileId} AND user_id = ${userId}
    `;
    
    // Log access revocation
    await auditLogging.logAdministrative(
      {
        userId: revokedBy,
        userRole: 'ADMIN',
      },
      {
        action: 'REVOKE_FILE_ACCESS',
        resourceType: 'FILE',
        resourceId: fileId,
        description: `Revoked file access from user ${userId}`,
      }
    );
  }

  // ==========================================================================
  // RETENTION POLICIES
  // ==========================================================================

  /**
   * Apply retention policy
   */
  async applyRetentionPolicy(policyId: string): Promise<number> {
    // Get policy
    const policy = await prisma.dataRetentionPolicy.findUnique({
      where: { id: policyId },
    });
    
    if (!policy || policy.dataType !== 'secure_file') {
      return 0;
    }
    
    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() - policy.deleteAfterDays!);
    
    // Get files to delete
    const filesToDelete = await prisma.$queryRaw<any[]>`
      SELECT id, storage_path FROM secure_files 
      WHERE created_at < ${deleteDate} AND deleted = false
    `;
    
    // Delete files
    for (const file of filesToDelete) {
      try {
        await fs.unlink(file.storage_path);
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error);
      }
    }
    
    // Mark as deleted in database
    const result = await prisma.$executeRaw`
      UPDATE secure_files 
      SET deleted = true, deleted_at = NOW(), deleted_by = 'SYSTEM'
      WHERE created_at < ${deleteDate} AND deleted = false
    `;
    
    return filesToDelete.length;
  }

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  /**
   * Get storage path for file
   */
  private getStoragePath(fileId: string): string {
    const subdir = fileId.substring(0, 2);
    const dirPath = path.join(this.storageBasePath, subdir);
    
    // Create subdirectory if it doesn't exist
    fs.mkdir(dirPath, { recursive: true }).catch(console.error);
    
    return path.join(dirPath, fileId);
  }

  /**
   * Format metadata
   */
  private formatMetadata(raw: any): FileMetadata {
    return {
      id: raw.id,
      fileName: raw.file_name,
      fileType: raw.file_type,
      fileSize: raw.file_size,
      category: raw.category,
      description: raw.description,
      tags: JSON.parse(raw.tags || '[]'),
      encrypted: raw.encrypted,
      uploadedBy: raw.uploaded_by,
      uploadedAt: raw.created_at,
      customerId: raw.customer_id,
      accessCount: raw.access_count || 0,
    };
  }

  /**
   * Get storage statistics
   */
  async getStorageStatistics(): Promise<{
    totalFiles: number;
    totalSize: number;
    encryptedFiles: number;
    filesByCategory: Record<string, number>;
  }> {
    const [stats, categoryStats] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*) as total_files,
          SUM(file_size) as total_size,
          SUM(CASE WHEN encrypted THEN 1 ELSE 0 END) as encrypted_files
        FROM secure_files 
        WHERE deleted = false
      `,
      prisma.$queryRaw<any[]>`
        SELECT category, COUNT(*) as count
        FROM secure_files 
        WHERE deleted = false
        GROUP BY category
      `,
    ]);
    
    const filesByCategory: Record<string, number> = {};
    for (const row of categoryStats) {
      filesByCategory[row.category] = parseInt(row.count);
    }
    
    return {
      totalFiles: parseInt(stats[0].total_files),
      totalSize: parseInt(stats[0].total_size || '0'),
      encryptedFiles: parseInt(stats[0].encrypted_files),
      filesByCategory,
    };
  }
}

// Export singleton instance
export const secureFileStorage = SecureFileStorageService.getInstance();