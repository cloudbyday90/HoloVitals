/**
 * Pricing Configuration for HoloVitals
 * 
 * Defines subscription tiers, token costs, and pricing rules
 */

export enum SubscriptionTier {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export interface TierConfig {
  name: string;
  displayName: string;
  monthlyPrice: number; // USD
  monthlyTokens: number; // Tokens per month
  freeUploadLimit: number; // Bytes (first upload only)
  features: string[];
  maxFileSize: number; // Bytes
  priority: number; // Queue priority (1-5, higher = better)
  supportLevel: 'email' | 'priority' | 'dedicated';
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  [SubscriptionTier.BASIC]: {
    name: 'BASIC',
    displayName: 'Basic',
    monthlyPrice: 9.99,
    monthlyTokens: 100_000, // 100K tokens/month
    freeUploadLimit: 10 * 1024 * 1024, // 10MB
    features: [
      '100K tokens per month',
      '10MB free initial upload',
      'Basic AI chat support',
      'Document analysis',
      'Email support',
      'Up to 100MB file uploads',
    ],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    priority: 1,
    supportLevel: 'email',
  },
  [SubscriptionTier.PROFESSIONAL]: {
    name: 'PROFESSIONAL',
    displayName: 'Professional',
    monthlyPrice: 29.99,
    monthlyTokens: 500_000, // 500K tokens/month
    freeUploadLimit: 25 * 1024 * 1024, // 25MB
    features: [
      '500K tokens per month',
      '25MB free initial upload',
      'Advanced AI analysis',
      'Priority processing',
      'Batch document processing',
      'Priority email support',
      'Up to 500MB file uploads',
    ],
    maxFileSize: 500 * 1024 * 1024, // 500MB
    priority: 3,
    supportLevel: 'priority',
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    monthlyPrice: 99.99,
    monthlyTokens: 2_000_000, // 2M tokens/month
    freeUploadLimit: 100 * 1024 * 1024, // 100MB
    features: [
      '2M tokens per month',
      '100MB free initial upload',
      'Premium AI models (GPT-4, Claude 3.5)',
      'Highest priority processing',
      'Unlimited batch processing',
      'Advanced analytics',
      'Dedicated support',
      'Up to 1GB file uploads',
      'Custom integrations',
    ],
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    priority: 5,
    supportLevel: 'dedicated',
  },
};

/**
 * Token costs for different operations
 * Based on average token usage per operation type
 */
export interface TokenCosts {
  // Per MB of document processing
  documentProcessing: number;
  
  // Per chat message (average)
  chatMessage: number;
  
  // Per document analysis (full report)
  documentAnalysis: number;
  
  // Per context optimization operation
  contextOptimization: number;
  
  // Per batch processing job
  batchProcessing: number;
}

export const TOKEN_COSTS: TokenCosts = {
  // Document processing: ~1,000 tokens per MB (OCR + extraction)
  documentProcessing: 1_000,
  
  // Chat message: ~500 tokens average (prompt + response)
  chatMessage: 500,
  
  // Full document analysis: ~5,000 tokens (comprehensive report)
  documentAnalysis: 5_000,
  
  // Context optimization: ~100 tokens (compression analysis)
  contextOptimization: 100,
  
  // Batch processing: ~10,000 tokens per job
  batchProcessing: 10_000,
};

/**
 * Token purchase packages (one-time add-ons)
 */
export interface TokenPackage {
  tokens: number;
  price: number; // USD
  bonus: number; // Bonus tokens
  displayName: string;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    tokens: 50_000,
    price: 4.99,
    bonus: 0,
    displayName: '50K Tokens',
  },
  {
    tokens: 100_000,
    price: 9.99,
    bonus: 5_000,
    displayName: '100K Tokens + 5K Bonus',
  },
  {
    tokens: 250_000,
    price: 24.99,
    bonus: 25_000,
    displayName: '250K Tokens + 25K Bonus',
  },
  {
    tokens: 500_000,
    price: 49.99,
    bonus: 75_000,
    displayName: '500K Tokens + 75K Bonus',
  },
  {
    tokens: 1_000_000,
    price: 99.99,
    bonus: 200_000,
    displayName: '1M Tokens + 200K Bonus',
  },
];

/**
 * File size to token estimation
 * More accurate estimation based on file type and content
 */
export interface FileEstimation {
  baseTokensPerMB: number;
  ocrMultiplier: number; // If OCR is needed
  analysisMultiplier: number; // If full analysis is requested
}

export const FILE_ESTIMATION: Record<string, FileEstimation> = {
  // PDF files
  'application/pdf': {
    baseTokensPerMB: 1_000,
    ocrMultiplier: 1.5, // OCR adds 50% more tokens
    analysisMultiplier: 2.0, // Full analysis doubles token usage
  },
  
  // Image files (require OCR)
  'image/jpeg': {
    baseTokensPerMB: 500,
    ocrMultiplier: 2.0, // OCR is primary operation
    analysisMultiplier: 1.5,
  },
  'image/png': {
    baseTokensPerMB: 500,
    ocrMultiplier: 2.0,
    analysisMultiplier: 1.5,
  },
  
  // Text files (most efficient)
  'text/plain': {
    baseTokensPerMB: 800,
    ocrMultiplier: 1.0, // No OCR needed
    analysisMultiplier: 1.5,
  },
  
  // Default for unknown types
  'default': {
    baseTokensPerMB: 1_000,
    ocrMultiplier: 1.5,
    analysisMultiplier: 2.0,
  },
};

/**
 * Pricing rules and constants
 */
export const PRICING_RULES = {
  // Grace period for expired subscriptions (days)
  GRACE_PERIOD_DAYS: 7,
  
  // Minimum token balance to process files
  MINIMUM_BALANCE: 1_000,
  
  // Maximum months for multi-month processing
  MAX_PROCESSING_MONTHS: 12,
  
  // Token cost per dollar (for display purposes)
  TOKENS_PER_DOLLAR: 10_000,
  
  // Discount for annual subscriptions (%)
  ANNUAL_DISCOUNT: 20,
  
  // Referral bonus tokens
  REFERRAL_BONUS: 10_000,
  
  // Trial period (days)
  TRIAL_PERIOD_DAYS: 14,
  
  // Trial tokens
  TRIAL_TOKENS: 10_000,
};

/**
 * Helper function to get tier configuration
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Helper function to calculate annual price with discount
 */
export function getAnnualPrice(tier: SubscriptionTier): number {
  const config = getTierConfig(tier);
  const annualPrice = config.monthlyPrice * 12;
  const discount = annualPrice * (PRICING_RULES.ANNUAL_DISCOUNT / 100);
  return annualPrice - discount;
}

/**
 * Helper function to format price
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Helper function to format tokens
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`;
  }
  return tokens.toString();
}

/**
 * Helper function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} bytes`;
}