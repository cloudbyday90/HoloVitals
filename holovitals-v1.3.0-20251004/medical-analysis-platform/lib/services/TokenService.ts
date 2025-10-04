/**
 * Token Management Service
 * 
 * Handles token balance tracking, deductions, purchases, and analytics
 */

import { PrismaClient } from '@prisma/client';
import {
  SubscriptionTier,
  getTierConfig,
  TOKEN_PACKAGES,
  PRICING_RULES,
  formatTokens,
} from '../config/pricing';

const prisma = new PrismaClient();

export interface TokenDeductionInput {
  userId: string;
  amount: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
}

export interface TokenPurchaseInput {
  userId: string;
  packageIndex: number; // Index in TOKEN_PACKAGES array
  paymentIntentId: string;
}

export interface TokenRefundInput {
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string;
}

export class TokenService {
  /**
   * Get user's token balance
   */
  static async getBalance(userId: string) {
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId },
      include: {
        subscription: true,
      },
    });
    
    if (!tokenBalance) {
      throw new Error('Token balance not found');
    }
    
    const tierConfig = getTierConfig(tokenBalance.subscription.tier as SubscriptionTier);
    
    return {
      ...tokenBalance,
      currentBalanceFormatted: formatTokens(tokenBalance.currentBalance),
      totalEarnedFormatted: formatTokens(tokenBalance.totalEarned),
      totalUsedFormatted: formatTokens(tokenBalance.totalUsed),
      monthlyAllocation: tierConfig.monthlyTokens,
      monthlyAllocationFormatted: formatTokens(tierConfig.monthlyTokens),
      freeUploadRemaining: Math.max(0, tierConfig.freeUploadLimit - tokenBalance.freeUploadUsed),
    };
  }
  
  /**
   * Deduct tokens from user's balance
   */
  static async deductTokens(input: TokenDeductionInput) {
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId: input.userId },
    });
    
    if (!tokenBalance) {
      throw new Error('Token balance not found');
    }
    
    // Check if user has sufficient balance
    if (tokenBalance.currentBalance < input.amount) {
      throw new Error(
        `Insufficient token balance. Required: ${formatTokens(input.amount)}, Available: ${formatTokens(tokenBalance.currentBalance)}`
      );
    }
    
    // Deduct tokens
    const newBalance = tokenBalance.currentBalance - input.amount;
    const newTotalUsed = tokenBalance.totalUsed + input.amount;
    
    const updatedBalance = await prisma.tokenBalance.update({
      where: { id: tokenBalance.id },
      data: {
        currentBalance: newBalance,
        totalUsed: newTotalUsed,
      },
    });
    
    // Create transaction record
    await prisma.tokenTransaction.create({
      data: {
        tokenBalanceId: tokenBalance.id,
        type: 'DEDUCTION',
        amount: -input.amount,
        balanceBefore: tokenBalance.currentBalance,
        balanceAfter: newBalance,
        description: input.description,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
      },
    });
    
    return updatedBalance;
  }
  
  /**
   * Purchase additional tokens
   */
  static async purchaseTokens(input: TokenPurchaseInput) {
    const tokenPackage = TOKEN_PACKAGES[input.packageIndex];
    
    if (!tokenPackage) {
      throw new Error('Invalid token package');
    }
    
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId: input.userId },
    });
    
    if (!tokenBalance) {
      throw new Error('Token balance not found');
    }
    
    // Calculate total tokens (base + bonus)
    const totalTokens = tokenPackage.tokens + tokenPackage.bonus;
    
    // Add tokens to balance
    const newBalance = tokenBalance.currentBalance + totalTokens;
    const newTotalEarned = tokenBalance.totalEarned + totalTokens;
    const newTotalPurchased = tokenBalance.totalPurchased + totalTokens;
    
    const updatedBalance = await prisma.tokenBalance.update({
      where: { id: tokenBalance.id },
      data: {
        currentBalance: newBalance,
        totalEarned: newTotalEarned,
        totalPurchased: newTotalPurchased,
      },
    });
    
    // Create transaction record
    await prisma.tokenTransaction.create({
      data: {
        tokenBalanceId: tokenBalance.id,
        type: 'PURCHASE',
        amount: totalTokens,
        balanceBefore: tokenBalance.currentBalance,
        balanceAfter: newBalance,
        description: `Token purchase: ${tokenPackage.displayName}`,
        referenceId: input.paymentIntentId,
        referenceType: 'PaymentIntent',
        metadata: JSON.stringify({
          packageIndex: input.packageIndex,
          baseTokens: tokenPackage.tokens,
          bonusTokens: tokenPackage.bonus,
          price: tokenPackage.price,
        }),
      },
    });
    
    // Create payment intent record
    await prisma.paymentIntent.create({
      data: {
        userId: input.userId,
        amount: tokenPackage.price,
        status: 'succeeded',
        paymentMethodId: input.paymentIntentId,
        tokensPurchased: totalTokens,
        description: `Token purchase: ${tokenPackage.displayName}`,
        metadata: JSON.stringify({
          packageIndex: input.packageIndex,
          baseTokens: tokenPackage.tokens,
          bonusTokens: tokenPackage.bonus,
        }),
      },
    });
    
    return updatedBalance;
  }
  
  /**
   * Refund tokens to user
   */
  static async refundTokens(input: TokenRefundInput) {
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId: input.userId },
    });
    
    if (!tokenBalance) {
      throw new Error('Token balance not found');
    }
    
    // Add tokens back
    const newBalance = tokenBalance.currentBalance + input.amount;
    const newTotalEarned = tokenBalance.totalEarned + input.amount;
    
    const updatedBalance = await prisma.tokenBalance.update({
      where: { id: tokenBalance.id },
      data: {
        currentBalance: newBalance,
        totalEarned: newTotalEarned,
      },
    });
    
    // Create transaction record
    await prisma.tokenTransaction.create({
      data: {
        tokenBalanceId: tokenBalance.id,
        type: 'REFUND',
        amount: input.amount,
        balanceBefore: tokenBalance.currentBalance,
        balanceAfter: newBalance,
        description: `Refund: ${input.reason}`,
        referenceId: input.referenceId,
        referenceType: 'Refund',
      },
    });
    
    return updatedBalance;
  }
  
  /**
   * Add bonus tokens (promotional, referral, etc.)
   */
  static async addBonusTokens(
    userId: string,
    amount: number,
    reason: string
  ) {
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId },
    });
    
    if (!tokenBalance) {
      throw new Error('Token balance not found');
    }
    
    const newBalance = tokenBalance.currentBalance + amount;
    const newTotalEarned = tokenBalance.totalEarned + amount;
    
    const updatedBalance = await prisma.tokenBalance.update({
      where: { id: tokenBalance.id },
      data: {
        currentBalance: newBalance,
        totalEarned: newTotalEarned,
      },
    });
    
    await prisma.tokenTransaction.create({
      data: {
        tokenBalanceId: tokenBalance.id,
        type: 'BONUS',
        amount,
        balanceBefore: tokenBalance.currentBalance,
        balanceAfter: newBalance,
        description: reason,
      },
    });
    
    return updatedBalance;
  }
  
  /**
   * Track free upload usage
   */
  static async trackFreeUploadUsage(
    userId: string,
    bytesUsed: number
  ) {
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId },
      include: { subscription: true },
    });
    
    if (!tokenBalance) {
      throw new Error('Token balance not found');
    }
    
    const tierConfig = getTierConfig(tokenBalance.subscription.tier as SubscriptionTier);
    const currentUsed = tokenBalance.freeUploadUsed;
    const newUsed = currentUsed + bytesUsed;
    
    // Check if exceeds limit
    if (newUsed > tierConfig.freeUploadLimit) {
      throw new Error(
        `Free upload limit exceeded. Limit: ${tierConfig.freeUploadLimit} bytes, Used: ${newUsed} bytes`
      );
    }
    
    const updatedBalance = await prisma.tokenBalance.update({
      where: { id: tokenBalance.id },
      data: {
        freeUploadUsed: newUsed,
      },
    });
    
    return updatedBalance;
  }
  
  /**
   * Check if user can afford an operation
   */
  static async canAfford(userId: string, tokensRequired: number): Promise<boolean> {
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId },
    });
    
    if (!tokenBalance) {
      return false;
    }
    
    return tokenBalance.currentBalance >= tokensRequired;
  }
  
  /**
   * Get token transaction history
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId },
    });
    
    if (!tokenBalance) {
      throw new Error('Token balance not found');
    }
    
    const transactions = await prisma.tokenTransaction.findMany({
      where: { tokenBalanceId: tokenBalance.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    const total = await prisma.tokenTransaction.count({
      where: { tokenBalanceId: tokenBalance.id },
    });
    
    return {
      transactions,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }
  
  /**
   * Get token usage analytics
   */
  static async getUsageAnalytics(userId: string, days: number = 30) {
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId },
    });
    
    if (!tokenBalance) {
      throw new Error('Token balance not found');
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const transactions = await prisma.tokenTransaction.findMany({
      where: {
        tokenBalanceId: tokenBalance.id,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    // Calculate daily usage
    const dailyUsage: Record<string, number> = {};
    const usageByType: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const date = tx.createdAt.toISOString().split('T')[0];
      
      if (tx.amount < 0) {
        // Deduction
        dailyUsage[date] = (dailyUsage[date] || 0) + Math.abs(tx.amount);
        
        const type = tx.referenceType || 'OTHER';
        usageByType[type] = (usageByType[type] || 0) + Math.abs(tx.amount);
      }
    });
    
    // Calculate statistics
    const totalUsed = Object.values(dailyUsage).reduce((sum, val) => sum + val, 0);
    const averageDaily = totalUsed / days;
    const projectedMonthly = averageDaily * 30;
    
    return {
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      usage: {
        total: totalUsed,
        averageDaily,
        projectedMonthly,
      },
      dailyUsage: Object.entries(dailyUsage).map(([date, tokens]) => ({
        date,
        tokens,
      })),
      usageByType: Object.entries(usageByType)
        .map(([type, tokens]) => ({
          type,
          tokens,
          percentage: (tokens / totalUsed) * 100,
        }))
        .sort((a, b) => b.tokens - a.tokens),
    };
  }
  
  /**
   * Get token balance summary for all users (admin only)
   */
  static async getGlobalStats() {
    const [
      totalBalances,
      totalTokensInCirculation,
      totalTokensEarned,
      totalTokensUsed,
      totalTokensPurchased,
    ] = await Promise.all([
      prisma.tokenBalance.count(),
      prisma.tokenBalance.aggregate({
        _sum: { currentBalance: true },
      }),
      prisma.tokenBalance.aggregate({
        _sum: { totalEarned: true },
      }),
      prisma.tokenBalance.aggregate({
        _sum: { totalUsed: true },
      }),
      prisma.tokenBalance.aggregate({
        _sum: { totalPurchased: true },
      }),
    ]);
    
    return {
      totalBalances,
      totalTokensInCirculation: totalTokensInCirculation._sum.currentBalance || 0,
      totalTokensEarned: totalTokensEarned._sum.totalEarned || 0,
      totalTokensUsed: totalTokensUsed._sum.totalUsed || 0,
      totalTokensPurchased: totalTokensPurchased._sum.totalPurchased || 0,
    };
  }
}