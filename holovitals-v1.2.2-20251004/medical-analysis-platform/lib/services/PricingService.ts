/**
 * Pricing Service
 * 
 * Handles all pricing calculations, cost estimations, and token conversions
 */

import {
  SubscriptionTier,
  TIER_CONFIGS,
  TOKEN_COSTS,
  TOKEN_PACKAGES,
  FILE_ESTIMATION,
  PRICING_RULES,
  getTierConfig,
  formatTokens,
  formatFileSize,
} from '../config/pricing';

export interface CostEstimation {
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  estimatedTokens: number;
  estimatedTokensFormatted: string;
  estimatedCost: number;
  estimatedCostFormatted: string;
  requiresOCR: boolean;
  requiresAnalysis: boolean;
  canAfford: boolean;
  currentBalance: number;
  balanceAfter: number;
  useFreeUpload: boolean;
  freeUploadRemaining: number;
  processingTime: string;
  recommendation: string;
}

export interface MultiMonthEstimation {
  totalTokens: number;
  monthlyAllocation: number;
  monthsRequired: number;
  monthlyProcessing: Array<{
    month: number;
    tokens: number;
    percentage: number;
  }>;
  estimatedCompletionDate: Date;
}

export class PricingService {
  /**
   * Estimate cost for file upload and processing
   */
  static estimateFileCost(
    fileSize: number,
    mimeType: string,
    currentBalance: number,
    tier: SubscriptionTier,
    freeUploadUsed: number,
    requiresOCR: boolean = true,
    requiresAnalysis: boolean = true
  ): CostEstimation {
    const tierConfig = getTierConfig(tier);
    const fileSizeMB = fileSize / (1024 * 1024);
    
    // Check if this upload qualifies for free upload limit
    const freeUploadRemaining = Math.max(0, tierConfig.freeUploadLimit - freeUploadUsed);
    const useFreeUpload = fileSize <= freeUploadRemaining;
    
    // Get file estimation config
    const estimationConfig = FILE_ESTIMATION[mimeType] || FILE_ESTIMATION['default'];
    
    // Calculate base tokens
    let estimatedTokens = Math.ceil(fileSizeMB * estimationConfig.baseTokensPerMB);
    
    // Apply multipliers
    if (requiresOCR) {
      estimatedTokens = Math.ceil(estimatedTokens * estimationConfig.ocrMultiplier);
    }
    if (requiresAnalysis) {
      estimatedTokens = Math.ceil(estimatedTokens * estimationConfig.analysisMultiplier);
    }
    
    // If using free upload, tokens are free
    if (useFreeUpload) {
      estimatedTokens = 0;
    }
    
    // Calculate cost (tokens to USD)
    const estimatedCost = (estimatedTokens / PRICING_RULES.TOKENS_PER_DOLLAR);
    
    // Check if user can afford
    const canAfford = currentBalance >= estimatedTokens;
    const balanceAfter = currentBalance - estimatedTokens;
    
    // Estimate processing time (rough estimate: 1 minute per 10MB)
    const processingMinutes = Math.ceil(fileSizeMB / 10);
    const processingTime = processingMinutes < 60
      ? `${processingMinutes} minutes`
      : `${Math.ceil(processingMinutes / 60)} hours`;
    
    // Generate recommendation
    let recommendation = '';
    if (useFreeUpload) {
      recommendation = 'This upload qualifies for your free upload limit. No tokens will be charged.';
    } else if (canAfford) {
      recommendation = 'You have sufficient tokens to process this file immediately.';
    } else {
      const tokensNeeded = estimatedTokens - currentBalance;
      recommendation = `You need ${formatTokens(tokensNeeded)} more tokens. Consider purchasing a token package or upgrading your subscription.`;
    }
    
    return {
      fileSize,
      fileSizeFormatted: formatFileSize(fileSize),
      mimeType,
      estimatedTokens,
      estimatedTokensFormatted: formatTokens(estimatedTokens),
      estimatedCost,
      estimatedCostFormatted: `$${estimatedCost.toFixed(2)}`,
      requiresOCR,
      requiresAnalysis,
      canAfford,
      currentBalance,
      balanceAfter,
      useFreeUpload,
      freeUploadRemaining,
      processingTime,
      recommendation,
    };
  }
  
  /**
   * Calculate multi-month processing schedule
   */
  static calculateMultiMonthProcessing(
    totalTokensNeeded: number,
    currentBalance: number,
    monthlyAllocation: number
  ): MultiMonthEstimation {
    const remainingTokens = totalTokensNeeded - currentBalance;
    const monthsRequired = Math.ceil(remainingTokens / monthlyAllocation);
    
    const monthlyProcessing: Array<{
      month: number;
      tokens: number;
      percentage: number;
    }> = [];
    
    let tokensRemaining = totalTokensNeeded;
    let month = 0;
    
    // First month: use current balance
    if (currentBalance > 0) {
      const tokensThisMonth = Math.min(currentBalance, tokensRemaining);
      monthlyProcessing.push({
        month: month + 1,
        tokens: tokensThisMonth,
        percentage: (tokensThisMonth / totalTokensNeeded) * 100,
      });
      tokensRemaining -= tokensThisMonth;
      month++;
    }
    
    // Subsequent months: use monthly allocation
    while (tokensRemaining > 0) {
      const tokensThisMonth = Math.min(monthlyAllocation, tokensRemaining);
      monthlyProcessing.push({
        month: month + 1,
        tokens: tokensThisMonth,
        percentage: (tokensThisMonth / totalTokensNeeded) * 100,
      });
      tokensRemaining -= tokensThisMonth;
      month++;
    }
    
    // Calculate estimated completion date
    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setMonth(estimatedCompletionDate.getMonth() + monthsRequired);
    
    return {
      totalTokens: totalTokensNeeded,
      monthlyAllocation,
      monthsRequired,
      monthlyProcessing,
      estimatedCompletionDate,
    };
  }
  
  /**
   * Get recommended token package for a specific need
   */
  static getRecommendedPackage(tokensNeeded: number): typeof TOKEN_PACKAGES[0] | null {
    // Find the smallest package that covers the need
    const suitablePackages = TOKEN_PACKAGES.filter(
      pkg => (pkg.tokens + pkg.bonus) >= tokensNeeded
    );
    
    if (suitablePackages.length === 0) {
      // Return largest package if none cover the full need
      return TOKEN_PACKAGES[TOKEN_PACKAGES.length - 1];
    }
    
    // Return the smallest suitable package
    return suitablePackages[0];
  }
  
  /**
   * Get recommended tier upgrade based on usage
   */
  static getRecommendedTierUpgrade(
    currentTier: SubscriptionTier,
    monthlyTokenUsage: number
  ): SubscriptionTier | null {
    const currentConfig = getTierConfig(currentTier);
    
    // If usage is within current tier, no upgrade needed
    if (monthlyTokenUsage <= currentConfig.monthlyTokens) {
      return null;
    }
    
    // Check if PROFESSIONAL tier would be sufficient
    if (currentTier === SubscriptionTier.BASIC) {
      const professionalConfig = getTierConfig(SubscriptionTier.PROFESSIONAL);
      if (monthlyTokenUsage <= professionalConfig.monthlyTokens) {
        return SubscriptionTier.PROFESSIONAL;
      }
    }
    
    // Check if ENTERPRISE tier would be sufficient
    if (currentTier !== SubscriptionTier.ENTERPRISE) {
      const enterpriseConfig = getTierConfig(SubscriptionTier.ENTERPRISE);
      if (monthlyTokenUsage <= enterpriseConfig.monthlyTokens) {
        return SubscriptionTier.ENTERPRISE;
      }
    }
    
    // Already at highest tier or usage exceeds all tiers
    return null;
  }
  
  /**
   * Calculate savings from tier upgrade
   */
  static calculateUpgradeSavings(
    currentTier: SubscriptionTier,
    targetTier: SubscriptionTier,
    monthlyTokenUsage: number
  ): {
    currentMonthlyCost: number;
    targetMonthlyCost: number;
    monthlySavings: number;
    annualSavings: number;
    breakEvenMonths: number;
  } {
    const currentConfig = getTierConfig(currentTier);
    const targetConfig = getTierConfig(targetTier);
    
    // Calculate current monthly cost (subscription + token purchases)
    const currentTokenShortfall = Math.max(0, monthlyTokenUsage - currentConfig.monthlyTokens);
    const currentTokenPurchaseCost = (currentTokenShortfall / PRICING_RULES.TOKENS_PER_DOLLAR);
    const currentMonthlyCost = currentConfig.monthlyPrice + currentTokenPurchaseCost;
    
    // Calculate target monthly cost
    const targetTokenShortfall = Math.max(0, monthlyTokenUsage - targetConfig.monthlyTokens);
    const targetTokenPurchaseCost = (targetTokenShortfall / PRICING_RULES.TOKENS_PER_DOLLAR);
    const targetMonthlyCost = targetConfig.monthlyPrice + targetTokenPurchaseCost;
    
    // Calculate savings
    const monthlySavings = currentMonthlyCost - targetMonthlyCost;
    const annualSavings = monthlySavings * 12;
    
    // Calculate break-even (how many months to recover upgrade cost)
    const upgradeCost = targetConfig.monthlyPrice - currentConfig.monthlyPrice;
    const breakEvenMonths = monthlySavings > 0 ? Math.ceil(upgradeCost / monthlySavings) : Infinity;
    
    return {
      currentMonthlyCost,
      targetMonthlyCost,
      monthlySavings,
      annualSavings,
      breakEvenMonths,
    };
  }
  
  /**
   * Validate file size against tier limits
   */
  static validateFileSize(
    fileSize: number,
    tier: SubscriptionTier
  ): { valid: boolean; message: string } {
    const tierConfig = getTierConfig(tier);
    
    if (fileSize > tierConfig.maxFileSize) {
      return {
        valid: false,
        message: `File size (${formatFileSize(fileSize)}) exceeds your tier limit (${formatFileSize(tierConfig.maxFileSize)}). Please upgrade to ${tier === SubscriptionTier.BASIC ? 'Professional' : 'Enterprise'} tier or split the file into smaller parts.`,
      };
    }
    
    return {
      valid: true,
      message: 'File size is within your tier limit.',
    };
  }
  
  /**
   * Calculate token usage statistics
   */
  static calculateTokenStats(transactions: Array<{
    type: string;
    amount: number;
    createdAt: Date;
  }>): {
    totalEarned: number;
    totalUsed: number;
    totalPurchased: number;
    averageDaily: number;
    projectedMonthly: number;
    topUsageTypes: Array<{ type: string; tokens: number; percentage: number }>;
  } {
    let totalEarned = 0;
    let totalUsed = 0;
    let totalPurchased = 0;
    const usageByType: Record<string, number> = {};
    
    transactions.forEach(tx => {
      if (tx.amount > 0) {
        if (tx.type === 'PURCHASE') {
          totalPurchased += tx.amount;
        }
        totalEarned += tx.amount;
      } else {
        totalUsed += Math.abs(tx.amount);
        const type = tx.type || 'UNKNOWN';
        usageByType[type] = (usageByType[type] || 0) + Math.abs(tx.amount);
      }
    });
    
    // Calculate daily average (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTransactions = transactions.filter(tx => tx.createdAt >= thirtyDaysAgo);
    const recentUsage = recentTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const averageDaily = recentUsage / 30;
    const projectedMonthly = averageDaily * 30;
    
    // Top usage types
    const topUsageTypes = Object.entries(usageByType)
      .map(([type, tokens]) => ({
        type,
        tokens,
        percentage: (tokens / totalUsed) * 100,
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 5);
    
    return {
      totalEarned,
      totalUsed,
      totalPurchased,
      averageDaily,
      projectedMonthly,
      topUsageTypes,
    };
  }
}