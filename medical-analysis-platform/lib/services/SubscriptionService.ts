/**
 * Subscription Management Service
 * 
 * Handles subscription creation, upgrades, downgrades, and lifecycle management
 */

import { PrismaClient } from '@prisma/client';
import {
  SubscriptionTier,
  getTierConfig,
  PRICING_RULES,
} from '../config/pricing';

const prisma = new PrismaClient();

export interface SubscriptionCreateInput {
  userId: string;
  tier: SubscriptionTier;
  paymentMethodId?: string;
  trialPeriod?: boolean;
}

export interface SubscriptionUpgradeInput {
  userId: string;
  newTier: SubscriptionTier;
  immediate?: boolean; // Apply immediately or at next billing cycle
}

export interface SubscriptionCancellationInput {
  userId: string;
  reason?: string;
  immediate?: boolean; // Cancel immediately or at end of billing cycle
}

export class SubscriptionService {
  /**
   * Create a new subscription for a user
   */
  static async createSubscription(input: SubscriptionCreateInput) {
    const tierConfig = getTierConfig(input.tier);
    const now = new Date();
    
    // Calculate billing cycle dates
    const billingCycleStart = now;
    const billingCycleEnd = new Date(now);
    billingCycleEnd.setMonth(billingCycleEnd.getMonth() + 1);
    
    const nextBillingDate = new Date(billingCycleEnd);
    
    // Calculate trial end date if applicable
    let trialEndsAt: Date | null = null;
    let status: 'ACTIVE' | 'TRIAL' = 'ACTIVE';
    
    if (input.trialPeriod) {
      trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + PRICING_RULES.TRIAL_PERIOD_DAYS);
      status = 'TRIAL';
    }
    
    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: input.userId,
        tier: input.tier,
        status,
        monthlyPrice: tierConfig.monthlyPrice,
        billingCycleStart,
        billingCycleEnd,
        nextBillingDate,
        trialEndsAt,
        metadata: JSON.stringify({
          paymentMethodId: input.paymentMethodId,
          createdVia: 'web',
        }),
      },
    });
    
    // Create token balance
    const initialTokens = input.trialPeriod
      ? PRICING_RULES.TRIAL_TOKENS
      : tierConfig.monthlyTokens;
    
    const tokenBalance = await prisma.tokenBalance.create({
      data: {
        userId: input.userId,
        subscriptionId: subscription.id,
        currentBalance: initialTokens,
        totalEarned: initialTokens,
        lastRefreshDate: now,
      },
    });
    
    // Create initial token transaction
    await prisma.tokenTransaction.create({
      data: {
        tokenBalanceId: tokenBalance.id,
        type: input.trialPeriod ? 'BONUS' : 'INITIAL_DEPOSIT',
        amount: initialTokens,
        balanceBefore: 0,
        balanceAfter: initialTokens,
        description: input.trialPeriod
          ? `Trial period tokens (${PRICING_RULES.TRIAL_PERIOD_DAYS} days)`
          : `Initial ${tierConfig.displayName} subscription tokens`,
      },
    });
    
    // Create subscription history entry
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        toTier: input.tier,
        toStatus: status,
        reason: input.trialPeriod ? 'Trial subscription created' : 'Subscription created',
      },
    });
    
    return {
      subscription,
      tokenBalance,
    };
  }
  
  /**
   * Upgrade or downgrade a subscription
   */
  static async changeSubscriptionTier(input: SubscriptionUpgradeInput) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: input.userId },
      include: { tokenBalance: true },
    });
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    const oldTier = subscription.tier as SubscriptionTier;
    const newTier = input.newTier;
    const oldConfig = getTierConfig(oldTier);
    const newConfig = getTierConfig(newTier);
    
    // Determine if this is an upgrade or downgrade
    const isUpgrade = newConfig.monthlyPrice > oldConfig.monthlyPrice;
    
    // Calculate token adjustment
    const tokenDifference = newConfig.monthlyTokens - oldConfig.monthlyTokens;
    
    if (input.immediate) {
      // Apply change immediately
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          tier: newTier,
          monthlyPrice: newConfig.monthlyPrice,
        },
      });
      
      // Adjust tokens if upgrade (add difference), if downgrade (no adjustment)
      if (isUpgrade && tokenDifference > 0 && subscription.tokenBalance) {
        const currentBalance = subscription.tokenBalance.currentBalance;
        const newBalance = currentBalance + tokenDifference;
        
        await prisma.tokenBalance.update({
          where: { id: subscription.tokenBalance.id },
          data: {
            currentBalance: newBalance,
            totalEarned: subscription.tokenBalance.totalEarned + tokenDifference,
          },
        });
        
        await prisma.tokenTransaction.create({
          data: {
            tokenBalanceId: subscription.tokenBalance.id,
            type: 'BONUS',
            amount: tokenDifference,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: `Upgrade bonus: ${oldConfig.displayName} → ${newConfig.displayName}`,
          },
        });
      }
      
      // Create history entry
      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          fromTier: oldTier,
          toTier: newTier,
          fromStatus: subscription.status,
          toStatus: subscription.status,
          reason: isUpgrade ? 'Immediate upgrade' : 'Immediate downgrade',
        },
      });
      
      return updatedSubscription;
    } else {
      // Schedule change for next billing cycle
      const metadata = JSON.parse(subscription.metadata || '{}');
      metadata.scheduledTierChange = {
        newTier,
        effectiveDate: subscription.nextBillingDate,
        scheduledAt: new Date(),
      };
      
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          metadata: JSON.stringify(metadata),
        },
      });
      
      // Create history entry
      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          fromTier: oldTier,
          toTier: newTier,
          fromStatus: subscription.status,
          toStatus: subscription.status,
          reason: `Scheduled ${isUpgrade ? 'upgrade' : 'downgrade'} for ${subscription.nextBillingDate?.toLocaleDateString()}`,
        },
      });
      
      return updatedSubscription;
    }
  }
  
  /**
   * Cancel a subscription
   */
  static async cancelSubscription(input: SubscriptionCancellationInput) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: input.userId },
    });
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    const now = new Date();
    
    if (input.immediate) {
      // Cancel immediately
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
        },
      });
      
      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          fromTier: subscription.tier,
          toTier: subscription.tier,
          fromStatus: subscription.status,
          toStatus: 'CANCELLED',
          reason: input.reason || 'Immediate cancellation',
        },
      });
      
      return updatedSubscription;
    } else {
      // Cancel at end of billing cycle
      const metadata = JSON.parse(subscription.metadata || '{}');
      metadata.scheduledCancellation = {
        effectiveDate: subscription.billingCycleEnd,
        scheduledAt: now,
        reason: input.reason,
      };
      
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          metadata: JSON.stringify(metadata),
        },
      });
      
      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          fromTier: subscription.tier,
          toTier: subscription.tier,
          fromStatus: subscription.status,
          toStatus: subscription.status,
          reason: `Scheduled cancellation for ${subscription.billingCycleEnd.toLocaleDateString()}`,
        },
      });
      
      return updatedSubscription;
    }
  }
  
  /**
   * Refresh monthly tokens (called by cron job)
   */
  static async refreshMonthlyTokens(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { tokenBalance: true },
    });
    
    if (!subscription || !subscription.tokenBalance) {
      throw new Error('Subscription or token balance not found');
    }
    
    // Check if subscription is active
    if (subscription.status !== 'ACTIVE') {
      throw new Error('Subscription is not active');
    }
    
    const tierConfig = getTierConfig(subscription.tier as SubscriptionTier);
    const now = new Date();
    
    // Check if it's time for refresh
    const lastRefresh = subscription.tokenBalance.lastRefreshDate;
    if (lastRefresh) {
      const daysSinceRefresh = Math.floor(
        (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceRefresh < 30) {
        throw new Error('Not time for monthly refresh yet');
      }
    }
    
    // Add monthly tokens
    const currentBalance = subscription.tokenBalance.currentBalance;
    const newBalance = currentBalance + tierConfig.monthlyTokens;
    
    const updatedBalance = await prisma.tokenBalance.update({
      where: { id: subscription.tokenBalance.id },
      data: {
        currentBalance: newBalance,
        totalEarned: subscription.tokenBalance.totalEarned + tierConfig.monthlyTokens,
        lastRefreshDate: now,
      },
    });
    
    // Create transaction
    await prisma.tokenTransaction.create({
      data: {
        tokenBalanceId: subscription.tokenBalance.id,
        type: 'MONTHLY_REFRESH',
        amount: tierConfig.monthlyTokens,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Monthly token refresh: ${tierConfig.displayName} tier`,
      },
    });
    
    // Update billing cycle
    const newBillingCycleStart = subscription.billingCycleEnd;
    const newBillingCycleEnd = new Date(newBillingCycleStart);
    newBillingCycleEnd.setMonth(newBillingCycleEnd.getMonth() + 1);
    
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        billingCycleStart: newBillingCycleStart,
        billingCycleEnd: newBillingCycleEnd,
        nextBillingDate: newBillingCycleEnd,
      },
    });
    
    return updatedBalance;
  }
  
  /**
   * Handle expired subscriptions (called by cron job)
   */
  static async handleExpiredSubscriptions() {
    const now = new Date();
    const gracePeriodEnd = new Date(now);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - PRICING_RULES.GRACE_PERIOD_DAYS);
    
    // Find subscriptions past grace period
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
        billingCycleEnd: {
          lt: gracePeriodEnd,
        },
      },
    });
    
    // Mark as expired
    for (const subscription of expiredSubscriptions) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'EXPIRED',
        },
      });
      
      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          fromTier: subscription.tier,
          toTier: subscription.tier,
          fromStatus: 'PAST_DUE',
          toStatus: 'EXPIRED',
          reason: 'Subscription expired after grace period',
        },
      });
    }
    
    return expiredSubscriptions.length;
  }
  
  /**
   * Get subscription details with token balance
   */
  static async getSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        tokenBalance: true,
        subscriptionHistory: {
          orderBy: { changedAt: 'desc' },
          take: 10,
        },
      },
    });
    
    if (!subscription) {
      return null;
    }
    
    const tierConfig = getTierConfig(subscription.tier as SubscriptionTier);
    
    return {
      ...subscription,
      tierConfig,
    };
  }
  
  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    
    return subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL';
  }
  
  /**
   * Get subscription statistics
   */
  static async getSubscriptionStats() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      tierDistribution,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      prisma.subscription.groupBy({
        by: ['tier'],
        _count: true,
      }),
    ]);
    
    return {
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      tierDistribution: tierDistribution.map(t => ({
        tier: t.tier,
        count: t._count,
      })),
    };
  }
}