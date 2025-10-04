import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export interface BetaCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  createdBy: string;
  tokenLimit: number;
  storageLimit: number;
  isActive: boolean;
}

export interface CreateBetaCodeParams {
  maxUses?: number;
  expiresAt?: Date;
  tokenLimit?: number;
  storageLimit?: number;
  createdBy: string;
  customCode?: string;
}

export interface ValidateBetaCodeResult {
  valid: boolean;
  code?: BetaCode;
  error?: string;
}

export class BetaCodeService {
  /**
   * Generate a unique beta code
   */
  private generateCode(): string {
    const prefix = 'HOLO';
    const randomPart = randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${randomPart}`;
  }

  /**
   * Create a new beta code
   */
  async createBetaCode(params: CreateBetaCodeParams): Promise<BetaCode> {
    const code = params.customCode || this.generateCode();

    // Check if code already exists
    const existing = await prisma.betaCode.findUnique({
      where: { code },
    });

    if (existing) {
      throw new Error('Beta code already exists');
    }

    const betaCode = await prisma.betaCode.create({
      data: {
        code,
        maxUses: params.maxUses || 1,
        usedCount: 0,
        expiresAt: params.expiresAt || null,
        createdBy: params.createdBy,
        tokenLimit: params.tokenLimit || 3000000, // 3M tokens default
        storageLimit: params.storageLimit || 500, // 500MB default
        isActive: true,
      },
    });

    return betaCode;
  }

  /**
   * Create multiple beta codes at once
   */
  async createBulkBetaCodes(
    count: number,
    params: Omit<CreateBetaCodeParams, 'customCode'>
  ): Promise<BetaCode[]> {
    const codes: BetaCode[] = [];

    for (let i = 0; i < count; i++) {
      const code = await this.createBetaCode(params);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Validate a beta code
   */
  async validateBetaCode(code: string): Promise<ValidateBetaCodeResult> {
    const betaCode = await prisma.betaCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!betaCode) {
      return {
        valid: false,
        error: 'Invalid beta code',
      };
    }

    if (!betaCode.isActive) {
      return {
        valid: false,
        error: 'Beta code has been deactivated',
      };
    }

    if (betaCode.expiresAt && betaCode.expiresAt < new Date()) {
      return {
        valid: false,
        error: 'Beta code has expired',
      };
    }

    if (betaCode.usedCount >= betaCode.maxUses) {
      return {
        valid: false,
        error: 'Beta code has reached maximum uses',
      };
    }

    return {
      valid: true,
      code: betaCode,
    };
  }

  /**
   * Redeem a beta code for a user
   */
  async redeemBetaCode(code: string, userId: string): Promise<void> {
    // Validate code first
    const validation = await this.validateBetaCode(code);
    if (!validation.valid || !validation.code) {
      throw new Error(validation.error || 'Invalid beta code');
    }

    // Check if user already has a beta code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { betaCodeId: true, isBetaTester: true },
    });

    if (user?.isBetaTester) {
      throw new Error('User is already a beta tester');
    }

    // Update user and increment code usage in a transaction
    await prisma.$transaction([
      // Update user
      prisma.user.update({
        where: { id: userId },
        data: {
          betaCodeId: validation.code.id,
          isBetaTester: true,
          betaJoinedAt: new Date(),
          tokensLimit: validation.code.tokenLimit,
          tokensUsed: 0,
          subscriptionPlan: 'beta-tester',
          subscriptionStatus: 'active',
        },
      }),
      // Increment code usage
      prisma.betaCode.update({
        where: { id: validation.code.id },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      }),
    ]);
  }

  /**
   * Get all beta codes (admin)
   */
  async getAllBetaCodes(
    page: number = 1,
    limit: number = 50
  ): Promise<{ codes: BetaCode[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [codes, total] = await Promise.all([
      prisma.betaCode.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.betaCode.count(),
    ]);

    return {
      codes,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get beta code by ID
   */
  async getBetaCodeById(id: string): Promise<BetaCode | null> {
    return await prisma.betaCode.findUnique({
      where: { id },
    });
  }

  /**
   * Get beta code by code string
   */
  async getBetaCodeByCode(code: string): Promise<BetaCode | null> {
    return await prisma.betaCode.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  /**
   * Update beta code
   */
  async updateBetaCode(
    id: string,
    data: Partial<Pick<BetaCode, 'maxUses' | 'expiresAt' | 'isActive' | 'tokenLimit' | 'storageLimit'>>
  ): Promise<BetaCode> {
    return await prisma.betaCode.update({
      where: { id },
      data,
    });
  }

  /**
   * Deactivate beta code
   */
  async deactivateBetaCode(id: string): Promise<void> {
    await prisma.betaCode.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Delete beta code
   */
  async deleteBetaCode(id: string): Promise<void> {
    await prisma.betaCode.delete({
      where: { id },
    });
  }

  /**
   * Get beta code statistics
   */
  async getBetaCodeStats(): Promise<{
    totalCodes: number;
    activeCodes: number;
    totalUses: number;
    totalBetaTesters: number;
    averageTokenUsage: number;
  }> {
    const [totalCodes, activeCodes, usageStats, betaTesters, tokenUsage] = await Promise.all([
      prisma.betaCode.count(),
      prisma.betaCode.count({ where: { isActive: true } }),
      prisma.betaCode.aggregate({
        _sum: { usedCount: true },
      }),
      prisma.user.count({ where: { isBetaTester: true } }),
      prisma.user.aggregate({
        where: { isBetaTester: true },
        _avg: { tokensUsed: true },
      }),
    ]);

    return {
      totalCodes,
      activeCodes,
      totalUses: usageStats._sum.usedCount || 0,
      totalBetaTesters: betaTesters,
      averageTokenUsage: Math.round(tokenUsage._avg.tokensUsed || 0),
    };
  }

  /**
   * Get users by beta code
   */
  async getUsersByBetaCode(codeId: string): Promise<Array<{
    id: string;
    email: string;
    name: string | null;
    betaJoinedAt: Date | null;
    tokensUsed: number;
    tokensLimit: number;
  }>> {
    const users = await prisma.user.findMany({
      where: { betaCodeId: codeId },
      select: {
        id: true,
        email: true,
        name: true,
        betaJoinedAt: true,
        tokensUsed: true,
        tokensLimit: true,
      },
      orderBy: { betaJoinedAt: 'desc' },
    });

    return users;
  }

  /**
   * Track token usage for a user
   */
  async trackTokenUsage(
    userId: string,
    tokensUsed: number,
    operation: string
  ): Promise<void> {
    await prisma.$transaction([
      // Update user's total token usage
      prisma.user.update({
        where: { id: userId },
        data: {
          tokensUsed: {
            increment: tokensUsed,
          },
        },
      }),
      // Create token usage record
      prisma.tokenUsage.create({
        data: {
          userId,
          tokensUsed,
          operation,
        },
      }),
    ]);
  }

  /**
   * Get token usage for a user
   */
  async getTokenUsage(userId: string): Promise<{
    tokensUsed: number;
    tokensLimit: number;
    tokensRemaining: number;
    percentageUsed: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tokensUsed: true,
        tokensLimit: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tokensRemaining = Math.max(0, user.tokensLimit - user.tokensUsed);
    const percentageUsed = user.tokensLimit > 0 
      ? (user.tokensUsed / user.tokensLimit) * 100 
      : 0;

    return {
      tokensUsed: user.tokensUsed,
      tokensLimit: user.tokensLimit,
      tokensRemaining,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
    };
  }

  /**
   * Get token usage history for a user
   */
  async getTokenUsageHistory(
    userId: string,
    limit: number = 100
  ): Promise<Array<{
    id: string;
    tokensUsed: number;
    operation: string;
    timestamp: Date;
  }>> {
    return await prisma.tokenUsage.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Check if user has enough tokens
   */
  async hasEnoughTokens(userId: string, requiredTokens: number): Promise<boolean> {
    const usage = await this.getTokenUsage(userId);
    return usage.tokensRemaining >= requiredTokens;
  }
}