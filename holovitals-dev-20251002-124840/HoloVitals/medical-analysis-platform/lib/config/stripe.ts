/**
 * Stripe Configuration
 * Centralized configuration for Stripe integration
 */

import { SubscriptionPlanDetails } from '@/lib/types/payment';

// Stripe API Keys
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'usd',
  trialDays: 14,
};

// Subscription Plans
export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out HoloVitals',
    price: 0,
    interval: 'month',
    currency: 'usd',
    stripePriceId: '', // No Stripe price for free plan
    features: [
      'Up to 10 patients',
      '1 GB storage',
      '10 AI insights per month',
      '1 user',
      'Basic EHR integration',
      'Email support',
    ],
    limits: {
      patients: 10,
      storage: 1,
      aiInsights: 10,
      users: 1,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For small practices getting started',
    price: 49,
    interval: 'month',
    currency: 'usd',
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || '',
    features: [
      'Up to 100 patients',
      '10 GB storage',
      '100 AI insights per month',
      '3 users',
      'Full EHR integration',
      'Priority email support',
      'Basic analytics',
    ],
    limits: {
      patients: 100,
      storage: 10,
      aiInsights: 100,
      users: 3,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing practices',
    price: 149,
    interval: 'month',
    currency: 'usd',
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
    popular: true,
    features: [
      'Up to 500 patients',
      '50 GB storage',
      'Unlimited AI insights',
      '10 users',
      'Advanced EHR integration',
      'Priority phone & email support',
      'Advanced analytics',
      'Custom reports',
      'API access',
    ],
    limits: {
      patients: 500,
      storage: 50,
      aiInsights: -1, // Unlimited
      users: 10,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large healthcare organizations',
    price: 499,
    interval: 'month',
    currency: 'usd',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    features: [
      'Unlimited patients',
      'Unlimited storage',
      'Unlimited AI insights',
      'Unlimited users',
      'Enterprise EHR integration',
      'Dedicated account manager',
      'Custom analytics',
      'White-label options',
      'SLA guarantee',
      'Custom integrations',
      'On-premise deployment option',
    ],
    limits: {
      patients: -1, // Unlimited
      storage: -1, // Unlimited
      aiInsights: -1, // Unlimited
      users: -1, // Unlimited
    },
  },
];

// Payment Method Configuration
export const PAYMENT_METHODS = {
  card: {
    enabled: true,
    name: 'Credit/Debit Card',
    icon: 'CreditCard',
  },
  paypal: {
    enabled: true,
    name: 'PayPal',
    icon: 'Wallet',
  },
  google_pay: {
    enabled: true,
    name: 'Google Pay',
    icon: 'Smartphone',
  },
  apple_pay: {
    enabled: true,
    name: 'Apple Pay',
    icon: 'Apple',
  },
};

// Webhook Events to Handle
export const WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.finalized',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_method.attached',
  'payment_method.detached',
  'charge.succeeded',
  'charge.failed',
  'charge.refunded',
];

// Usage Limits and Overage Pricing
export const USAGE_LIMITS = {
  free: {
    patients: 10,
    storage: 1, // GB
    aiInsights: 10,
    users: 1,
  },
  basic: {
    patients: 100,
    storage: 10,
    aiInsights: 100,
    users: 3,
  },
  professional: {
    patients: 500,
    storage: 50,
    aiInsights: -1, // Unlimited
    users: 10,
  },
  enterprise: {
    patients: -1, // Unlimited
    storage: -1,
    aiInsights: -1,
    users: -1,
  },
};

export const OVERAGE_PRICING = {
  patients: 0.5, // $0.50 per additional patient
  storage: 2, // $2 per additional GB
  aiInsights: 1, // $1 per additional AI insight
  users: 10, // $10 per additional user
};

// Helper Functions
export function getPlanById(planId: string): SubscriptionPlanDetails | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}

export function getPlanByStripePriceId(priceId: string): SubscriptionPlanDetails | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.stripePriceId === priceId);
}

export function formatPrice(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function calculateProration(
  currentPlan: SubscriptionPlanDetails,
  newPlan: SubscriptionPlanDetails,
  daysRemaining: number
): number {
  const daysInMonth = 30;
  const currentDailyRate = currentPlan.price / daysInMonth;
  const newDailyRate = newPlan.price / daysInMonth;
  
  const unusedCredit = currentDailyRate * daysRemaining;
  const newCharge = newDailyRate * daysRemaining;
  
  return Math.max(0, newCharge - unusedCredit);
}

export function isFeatureAvailable(
  plan: SubscriptionPlanDetails,
  feature: keyof typeof USAGE_LIMITS.free
): boolean {
  const limit = plan.limits[feature];
  return limit === -1 || limit > 0;
}

export function hasReachedLimit(
  plan: SubscriptionPlanDetails,
  feature: keyof typeof USAGE_LIMITS.free,
  currentUsage: number
): boolean {
  const limit = plan.limits[feature];
  if (limit === -1) return false; // Unlimited
  return currentUsage >= limit;
}