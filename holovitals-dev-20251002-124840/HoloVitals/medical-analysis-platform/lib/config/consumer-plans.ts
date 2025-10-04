/**
 * Consumer-Focused Subscription Plans for HoloVitals
 * Target Audience: Individual patients seeking personal health AI assistant
 */

export interface ConsumerPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  stripePriceId?: string;
  limits: {
    aiTokens: number;              // -1 = unlimited
    documentsPerMonth: number;     // -1 = unlimited
    conversationsPerMonth: number; // -1 = unlimited
    storageGB: number;             // Total storage in GB
    familyMembers: number;         // Number of family members
  };
  features: string[];
  popular?: boolean;
}

export const CONSUMER_PLANS: ConsumerPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out HoloVitals',
    price: 0,
    interval: 'month',
    limits: {
      aiTokens: 50000,              // ~50 conversations
      documentsPerMonth: 10,         // 10 documents
      conversationsPerMonth: 50,     // 50 AI chats
      storageGB: 1,                  // 1GB
      familyMembers: 1,              // Self only
    },
    features: [
      'Basic AI health assistant',
      '50 AI conversations per month',
      '10 document uploads per month',
      '1GB storage',
      'Basic health insights',
      'Community support',
    ],
  },
  {
    id: 'personal',
    name: 'Personal',
    description: 'For individuals managing their health',
    price: 14.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PERSONAL_PRICE_ID,
    limits: {
      aiTokens: 500000,             // ~500 conversations
      documentsPerMonth: 100,        // 100 documents
      conversationsPerMonth: -1,     // Unlimited
      storageGB: 10,                 // 10GB
      familyMembers: 1,              // Self only
    },
    features: [
      'Unlimited AI conversations',
      '100 document uploads per month',
      '10GB storage',
      'Advanced health insights',
      'Personalized recommendations',
      'Priority support',
      'Export health data',
      'Health timeline tracking',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    description: 'For families managing health together',
    price: 29.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_FAMILY_PRICE_ID,
    popular: true,
    limits: {
      aiTokens: 1500000,            // ~1500 conversations
      documentsPerMonth: 300,        // 300 documents
      conversationsPerMonth: -1,     // Unlimited
      storageGB: 50,                 // 50GB
      familyMembers: 5,              // Up to 5 family members
    },
    features: [
      'Everything in Personal',
      'Up to 5 family members',
      '300 document uploads per month',
      '50GB shared storage',
      'Family health tracking',
      'Shared health insights',
      'Family health reports',
      'Medication interaction alerts',
      'Appointment reminders',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For power users who want it all',
    price: 49.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    limits: {
      aiTokens: -1,                 // Unlimited
      documentsPerMonth: -1,         // Unlimited
      conversationsPerMonth: -1,     // Unlimited
      storageGB: 200,                // 200GB
      familyMembers: 10,             // Up to 10 family members
    },
    features: [
      'Everything in Family',
      'Unlimited AI conversations',
      'Unlimited document uploads',
      '200GB storage',
      'Up to 10 family members',
      'Expert AI analysis',
      'Personalized health plans',
      'Priority AI processing',
      'Dedicated support',
      'Early access to new features',
      'Custom health reports',
      'API access (coming soon)',
    ],
  },
  {
    id: 'beta-tester',
    name: 'Beta Tester',
    description: 'Special access for beta testers',
    price: 0,
    interval: 'month',
    limits: {
      aiTokens: 3000000,            // 3M tokens
      documentsPerMonth: -1,         // Unlimited
      conversationsPerMonth: -1,     // Unlimited
      storageGB: 0.5,                // 500MB (0.5GB)
      familyMembers: 1,              // Self only
    },
    features: [
      'Unlimited AI conversations',
      'Unlimited document uploads',
      '500MB storage',
      'All premium features',
      'Priority support',
      'Beta tester badge',
      'Early access to new features',
      'Direct feedback channel',
      'Special thank you rewards',
    ],
  },
  {
    id: 'beta-reward',
    name: 'Beta Tester Reward',
    description: 'Thank you for helping us test!',
    price: 9.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_BETA_REWARD_PRICE_ID,
    limits: {
      aiTokens: 1000000,            // 1M tokens
      documentsPerMonth: 200,        // 200 documents
      conversationsPerMonth: -1,     // Unlimited
      storageGB: 50,                 // 50GB
      familyMembers: 3,              // Up to 3 family members
    },
    features: [
      'Thank you for beta testing!',
      'Unlimited AI conversations',
      '200 document uploads per month',
      '50GB storage',
      'Up to 3 family members',
      'All premium features',
      'Beta tester badge',
      'Lifetime 50% discount',
      '1 year special pricing',
    ],
  },
];

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): ConsumerPlan | undefined {
  return CONSUMER_PLANS.find((plan) => plan.id === planId);
}

/**
 * Get plan limits by ID
 */
export function getPlanLimits(planId: string) {
  const plan = getPlanById(planId);
  return plan?.limits || CONSUMER_PLANS[0].limits; // Default to free plan
}

/**
 * Check if user has reached limit
 */
export function hasReachedLimit(current: number, limit: number): boolean {
  if (limit === -1) return false; // Unlimited
  return current >= limit;
}

/**
 * Calculate percentage used
 */
export function calculatePercentageUsed(current: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  if (limit === 0) return 100;
  return Math.min((current / limit) * 100, 100);
}

/**
 * Format limit display
 */
export function formatLimit(limit: number, unit: string = ''): string {
  if (limit === -1) return 'Unlimited';
  if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M ${unit}`.trim();
  if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K ${unit}`.trim();
  return `${limit} ${unit}`.trim();
}

/**
 * Get upgrade suggestions based on usage
 */
export function getUpgradeSuggestion(
  currentPlanId: string,
  usage: {
    aiTokens: number;
    documents: number;
    storage: number;
    familyMembers: number;
  }
): ConsumerPlan | null {
  const currentPlan = getPlanById(currentPlanId);
  if (!currentPlan) return null;

  // Check if user is approaching limits
  const tokenPercentage = calculatePercentageUsed(usage.aiTokens, currentPlan.limits.aiTokens);
  const documentPercentage = calculatePercentageUsed(usage.documents, currentPlan.limits.documentsPerMonth);
  const storagePercentage = calculatePercentageUsed(usage.storage, currentPlan.limits.storageGB);

  // If any metric is above 75%, suggest upgrade
  if (tokenPercentage > 75 || documentPercentage > 75 || storagePercentage > 75) {
    // Find next tier plan
    const currentIndex = CONSUMER_PLANS.findIndex((p) => p.id === currentPlanId);
    if (currentIndex < CONSUMER_PLANS.length - 1) {
      return CONSUMER_PLANS[currentIndex + 1];
    }
  }

  return null;
}