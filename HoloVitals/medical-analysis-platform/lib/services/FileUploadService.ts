/**
 * File Upload Service
 * 
 * Handles large file uploads, cost estimation, approval workflow, and multi-month processing
 */

import { PrismaClient } from '@prisma/client';
import { PricingService } from './PricingService';
import { TokenService } from './TokenService';
import { SubscriptionTier, getTierConfig } from '../config/pricing';

const prisma = new PrismaClient();

export interface FileUploadInput {
  userId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  requiresOCR?: boolean;
  requiresAnalysis?: boolean;
}

export interface CostApprovalInput {
  uploadId: string;
  approved: boolean;
  processingOption?: 'immediate' | 'one-time-purchase' | 'multi-month' | 'upgrade';
  packageIndex?: number; // For one-time purchase
  newTier?: SubscriptionTier; // For upgrade
}

export class FileUploadService {
  /**
   * Create file upload with cost estimation
   */
  static async createUpload(input: FileUploadInput) {
    // Get user's subscription and token balance
    const subscription = await prisma.subscription.findUnique({
      where: { userId: input.userId },
      include: { tokenBalance: true },
    });
    
    if (!subscription || !subscription.tokenBalance) {
      throw new Error('User subscription not found');
    }
    
    const tier = subscription.tier as SubscriptionTier;
    const tierConfig = getTierConfig(tier);
    
    // Validate file size against tier limits
    const sizeValidation = PricingService.validateFileSize(input.fileSize, tier);
    if (!sizeValidation.valid) {
      throw new Error(sizeValidation.message);
    }
    
    // Estimate cost
    const costEstimation = PricingService.estimateFileCost(
      input.fileSize,
      input.mimeType,
      subscription.tokenBalance.currentBalance,
      tier,
      subscription.tokenBalance.freeUploadUsed,
      input.requiresOCR ?? true,
      input.requiresAnalysis ?? true
    );
    
    // Create file upload record
    const upload = await prisma.fileUpload.create({
      data: {
        userId: input.userId,
        fileName: input.fileName,
        filePath: input.filePath,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        status: 'PENDING',
        estimatedTokens: costEstimation.estimatedTokens,
        estimatedCost: costEstimation.estimatedCost,
        usedFreeUpload: costEstimation.useFreeUpload,
        metadata: JSON.stringify({
          requiresOCR: input.requiresOCR ?? true,
          requiresAnalysis: input.requiresAnalysis ?? true,
          costEstimation,
        }),
      },
    });
    
    return {
      upload,
      costEstimation,
      tierConfig,
    };
  }
  
  /**
   * Approve or reject file upload cost
   */
  static async approveCost(input: CostApprovalInput) {
    const upload = await prisma.fileUpload.findUnique({
      where: { id: input.uploadId },
    });
    
    if (!upload) {
      throw new Error('Upload not found');
    }
    
    if (upload.status !== 'PENDING') {
      throw new Error('Upload is not in pending state');
    }
    
    if (!input.approved) {
      // User rejected the cost
      await prisma.fileUpload.update({
        where: { id: upload.id },
        data: {
          status: 'CANCELLED',
          errorMessage: 'User cancelled upload due to cost',
        },
      });
      
      return { status: 'cancelled' };
    }
    
    // User approved - handle based on processing option
    switch (input.processingOption) {
      case 'immediate':
        return await this.processImmediate(upload);
      
      case 'one-time-purchase':
        if (input.packageIndex === undefined) {
          throw new Error('Package index required for one-time purchase');
        }
        return await this.processWithPurchase(upload, input.packageIndex);
      
      case 'multi-month':
        return await this.scheduleMultiMonth(upload);
      
      case 'upgrade':
        if (!input.newTier) {
          throw new Error('New tier required for upgrade');
        }
        return await this.processWithUpgrade(upload, input.newTier);
      
      default:
        throw new Error('Invalid processing option');
    }
  }
  
  /**
   * Process file immediately (user has sufficient balance)
   */
  private static async processImmediate(upload: any) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: upload.userId },
      include: { tokenBalance: true },
    });
    
    if (!subscription || !subscription.tokenBalance) {
      throw new Error('Subscription not found');
    }
    
    // Check if user can afford
    const canAfford = await TokenService.canAfford(
      upload.userId,
      upload.estimatedTokens || 0
    );
    
    if (!canAfford) {
      throw new Error('Insufficient token balance');
    }
    
    // Update upload status
    await prisma.fileUpload.update({
      where: { id: upload.id },
      data: {
        status: 'APPROVED',
        processingStartedAt: new Date(),
      },
    });
    
    // Deduct tokens (if not using free upload)
    if (!upload.usedFreeUpload && upload.estimatedTokens > 0) {
      await TokenService.deductTokens({
        userId: upload.userId,
        amount: upload.estimatedTokens,
        description: `File processing: ${upload.fileName}`,
        referenceId: upload.id,
        referenceType: 'FileUpload',
      });
    } else if (upload.usedFreeUpload) {
      // Track free upload usage
      await TokenService.trackFreeUploadUsage(upload.userId, upload.fileSize);
    }
    
    // Queue for processing (integrate with AnalysisQueueService)
    // This would be handled by the actual processing pipeline
    
    return {
      status: 'approved',
      message: 'File queued for immediate processing',
      upload,
    };
  }
  
  /**
   * Process file after one-time token purchase
   */
  private static async processWithPurchase(upload: any, packageIndex: number) {
    // This would integrate with payment processing
    // For now, we'll simulate the purchase
    
    // After successful payment, add tokens
    await TokenService.purchaseTokens({
      userId: upload.userId,
      packageIndex,
      paymentIntentId: `pi_${Date.now()}`, // Would be real payment ID
    });
    
    // Then process immediately
    return await this.processImmediate(upload);
  }
  
  /**
   * Schedule multi-month processing
   */
  private static async scheduleMultiMonth(upload: any) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: upload.userId },
      include: { tokenBalance: true },
    });
    
    if (!subscription || !subscription.tokenBalance) {
      throw new Error('Subscription not found');
    }
    
    const tier = subscription.tier as SubscriptionTier;
    const tierConfig = getTierConfig(tier);
    
    // Calculate multi-month schedule
    const multiMonthPlan = PricingService.calculateMultiMonthProcessing(
      upload.estimatedTokens || 0,
      subscription.tokenBalance.currentBalance,
      tierConfig.monthlyTokens
    );
    
    // Update upload with schedule
    await prisma.fileUpload.update({
      where: { id: upload.id },
      data: {
        status: 'SCHEDULED',
        scheduledMonths: multiMonthPlan.monthsRequired,
        currentMonth: 0,
        metadata: JSON.stringify({
          ...JSON.parse(upload.metadata || '{}'),
          multiMonthPlan,
        }),
      },
    });
    
    return {
      status: 'scheduled',
      message: `File scheduled for processing over ${multiMonthPlan.monthsRequired} months`,
      multiMonthPlan,
      upload,
    };
  }
  
  /**
   * Process file after tier upgrade
   */
  private static async processWithUpgrade(upload: any, newTier: SubscriptionTier) {
    // This would integrate with SubscriptionService
    // For now, we'll assume the upgrade happens first
    
    // After upgrade, process immediately
    return await this.processImmediate(upload);
  }
  
  /**
   * Process next chunk of multi-month upload (called by cron)
   */
  static async processMultiMonthChunk(uploadId: string) {
    const upload = await prisma.fileUpload.findUnique({
      where: { id: uploadId },
    });
    
    if (!upload || upload.status !== 'SCHEDULED') {
      throw new Error('Upload not found or not scheduled');
    }
    
    const metadata = JSON.parse(upload.metadata || '{}');
    const multiMonthPlan = metadata.multiMonthPlan;
    
    if (!multiMonthPlan) {
      throw new Error('Multi-month plan not found');
    }
    
    const currentMonth = upload.currentMonth || 0;
    const nextMonth = currentMonth + 1;
    
    if (nextMonth > multiMonthPlan.monthsRequired) {
      throw new Error('All months already processed');
    }
    
    const monthData = multiMonthPlan.monthlyProcessing[currentMonth];
    
    // Deduct tokens for this month
    await TokenService.deductTokens({
      userId: upload.userId,
      amount: monthData.tokens,
      description: `Multi-month processing (Month ${nextMonth}/${multiMonthPlan.monthsRequired}): ${upload.fileName}`,
      referenceId: upload.id,
      referenceType: 'FileUpload',
    });
    
    // Update upload progress
    const isComplete = nextMonth === multiMonthPlan.monthsRequired;
    
    await prisma.fileUpload.update({
      where: { id: upload.id },
      data: {
        currentMonth: nextMonth,
        status: isComplete ? 'COMPLETED' : 'SCHEDULED',
        processingCompletedAt: isComplete ? new Date() : undefined,
      },
    });
    
    return {
      uploadId: upload.id,
      month: nextMonth,
      totalMonths: multiMonthPlan.monthsRequired,
      tokensProcessed: monthData.tokens,
      percentageComplete: (nextMonth / multiMonthPlan.monthsRequired) * 100,
      isComplete,
    };
  }
  
  /**
   * Get upload details
   */
  static async getUpload(uploadId: string) {
    const upload = await prisma.fileUpload.findUnique({
      where: { id: uploadId },
    });
    
    if (!upload) {
      throw new Error('Upload not found');
    }
    
    const metadata = JSON.parse(upload.metadata || '{}');
    
    return {
      ...upload,
      metadata,
    };
  }
  
  /**
   * Get user's upload history
   */
  static async getUserUploads(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const uploads = await prisma.fileUpload.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    const total = await prisma.fileUpload.count({
      where: { userId },
    });
    
    return {
      uploads: uploads.map(u => ({
        ...u,
        metadata: JSON.parse(u.metadata || '{}'),
      })),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }
  
  /**
   * Get upload statistics
   */
  static async getUploadStats(userId?: string) {
    const where = userId ? { userId } : {};
    
    const [
      totalUploads,
      pendingUploads,
      processingUploads,
      completedUploads,
      failedUploads,
      totalSize,
      totalTokensUsed,
    ] = await Promise.all([
      prisma.fileUpload.count({ where }),
      prisma.fileUpload.count({ where: { ...where, status: 'PENDING' } }),
      prisma.fileUpload.count({ where: { ...where, status: 'PROCESSING' } }),
      prisma.fileUpload.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.fileUpload.count({ where: { ...where, status: 'FAILED' } }),
      prisma.fileUpload.aggregate({
        where,
        _sum: { fileSize: true },
      }),
      prisma.fileUpload.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { actualTokens: true },
      }),
    ]);
    
    return {
      totalUploads,
      pendingUploads,
      processingUploads,
      completedUploads,
      failedUploads,
      totalSize: totalSize._sum.fileSize || 0,
      totalTokensUsed: totalTokensUsed._sum.actualTokens || 0,
    };
  }
  
  /**
   * Cancel upload
   */
  static async cancelUpload(uploadId: string, reason?: string) {
    const upload = await prisma.fileUpload.findUnique({
      where: { id: uploadId },
    });
    
    if (!upload) {
      throw new Error('Upload not found');
    }
    
    if (upload.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed upload');
    }
    
    await prisma.fileUpload.update({
      where: { id: upload.id },
      data: {
        status: 'CANCELLED',
        errorMessage: reason || 'User cancelled upload',
      },
    });
    
    return { status: 'cancelled' };
  }
}