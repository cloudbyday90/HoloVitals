/**
 * Payment System Types
 * Comprehensive type definitions for Stripe payment integration
 */

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid';

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  currency: string;
  features: string[];
  limits: {
    patients: number;
    storage: number; // in GB
    aiInsights: number; // per month
    users: number;
  };
  stripePriceId: string;
  popular?: boolean;
}

// ============================================================================
// PAYMENT METHOD TYPES
// ============================================================================

export interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: PaymentMethodType;
  card?: CardDetails;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethodType = 'card' | 'paypal' | 'google_pay' | 'apple_pay';

export interface CardDetails {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  country?: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface Payment {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  paymentMethod: PaymentMethodType;
  receiptUrl?: string;
  invoiceId?: string;
  subscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus =
  | 'succeeded'
  | 'pending'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'partially_refunded';

// ============================================================================
// INVOICE TYPES
// ============================================================================

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  subscriptionId?: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: InvoiceStatus;
  dueDate?: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  lineItems: InvoiceLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'uncollectible'
  | 'void';

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  currency: string;
}

// ============================================================================
// CHECKOUT TYPES
// ============================================================================

export interface CheckoutSession {
  id: string;
  stripeSessionId: string;
  userId: string;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
  status: CheckoutStatus;
  expiresAt: Date;
  createdAt: Date;
}

export type CheckoutStatus = 'open' | 'complete' | 'expired';

export interface CreateCheckoutSessionRequest {
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  couponCode?: string;
}

export interface CreateCheckoutSessionResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

// ============================================================================
// BILLING PORTAL TYPES
// ============================================================================

export interface BillingPortalSession {
  id: string;
  url: string;
  returnUrl: string;
  createdAt: Date;
}

export interface CreateBillingPortalRequest {
  returnUrl: string;
}

export interface CreateBillingPortalResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// ============================================================================
// USAGE TRACKING TYPES
// ============================================================================

export interface UsageRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  metric: UsageMetric;
  quantity: number;
  timestamp: Date;
  createdAt: Date;
}

export type UsageMetric =
  | 'ai_insights_generated'
  | 'patients_added'
  | 'storage_used'
  | 'api_calls'
  | 'ehr_syncs';

export interface UsageSummary {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    aiInsights: {
      used: number;
      limit: number;
      percentage: number;
    };
    patients: {
      used: number;
      limit: number;
      percentage: number;
    };
    storage: {
      used: number; // in GB
      limit: number;
      percentage: number;
    };
    users: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
  overages: {
    metric: UsageMetric;
    amount: number;
    cost: number;
  }[];
}

// ============================================================================
// COUPON TYPES
// ============================================================================

export interface Coupon {
  id: string;
  stripeCouponId: string;
  code: string;
  name: string;
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
  maxRedemptions?: number;
  timesRedeemed: number;
  valid: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookEvent {
  id: string;
  type: StripeWebhookEventType;
  data: any;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  createdAt: Date;
}

export type StripeWebhookEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'invoice.finalized'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_method.attached'
  | 'payment_method.detached'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.refunded';

// ============================================================================
// PAYMENT INTENT TYPES
// ============================================================================

export interface PaymentIntent {
  id: string;
  stripePaymentIntentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  clientSecret: string;
  paymentMethod?: string;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

// ============================================================================
// REFUND TYPES
// ============================================================================

export interface Refund {
  id: string;
  stripeRefundId: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason?: RefundReason;
  status: RefundStatus;
  createdAt: Date;
}

export type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer';

export type RefundStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';

// ============================================================================
// BILLING HISTORY TYPES
// ============================================================================

export interface BillingHistory {
  payments: Payment[];
  invoices: Invoice[];
  refunds: Refund[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BillingHistoryRequest {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  status?: PaymentStatus[];
}

// ============================================================================
// SUBSCRIPTION CHANGE TYPES
// ============================================================================

export interface SubscriptionChangePreview {
  currentPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  proratedAmount: number;
  nextBillingDate: Date;
  immediateCharge: number;
  currency: string;
}

export interface ChangeSubscriptionRequest {
  newPlan: SubscriptionPlan;
  immediate?: boolean;
}

export interface ChangeSubscriptionResponse {
  success: boolean;
  subscription?: Subscription;
  error?: string;
}

// ============================================================================
// PAYMENT CONFIGURATION TYPES
// ============================================================================

export interface PaymentConfig {
  stripePublishableKey: string;
  enabledPaymentMethods: PaymentMethodType[];
  currency: string;
  taxRate?: number;
  trialDays: number;
  plans: SubscriptionPlanDetails[];
}

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export interface StripeCustomer {
  id: string;
  userId: string;
  stripeCustomerId: string;
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  defaultPaymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaymentApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SubscriptionApiResponse extends PaymentApiResponse<Subscription> {}
export interface PaymentMethodApiResponse extends PaymentApiResponse<PaymentMethod> {}
export interface InvoiceApiResponse extends PaymentApiResponse<Invoice> {}
export interface UsageApiResponse extends PaymentApiResponse<UsageSummary> {}