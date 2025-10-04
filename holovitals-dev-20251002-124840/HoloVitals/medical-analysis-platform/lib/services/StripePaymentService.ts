/**
 * Stripe Payment Service
 * Handles all Stripe payment operations
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { STRIPE_CONFIG, SUBSCRIPTION_PLANS, getPlanById } from '@/lib/config/stripe';
import {
  Subscription,
  PaymentMethod,
  Invoice,
  CreateCheckoutSessionRequest,
  CreateBillingPortalRequest,
  SubscriptionPlan,
  CreatePaymentIntentRequest,
} from '@/lib/types/payment';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2024-11-20.acacia',
});

const prisma = new PrismaClient();

export class StripePaymentService {
  /**
   * Create or get Stripe customer
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    // Check if customer already exists
    const existingCustomer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (existingCustomer) {
      return existingCustomer.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    // Save to database
    await prisma.stripeCustomer.create({
      data: {
        userId,
        stripeCustomerId: customer.id,
        email,
        name,
      },
    });

    return customer.id;
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    email: string,
    request: CreateCheckoutSessionRequest
  ): Promise<{ sessionId: string; url: string }> {
    const { plan, successUrl, cancelUrl, trialDays, couponCode } = request;

    // Get plan details
    const planDetails = getPlanById(plan);
    if (!planDetails || !planDetails.stripePriceId) {
      throw new Error('Invalid plan or plan not available for checkout');
    }

    // Get or create customer
    const customerId = await this.getOrCreateCustomer(userId, email);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planDetails.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: trialDays || STRIPE_CONFIG.trialDays,
        metadata: {
          userId,
          plan,
        },
      },
      discounts: couponCode ? [{ coupon: couponCode }] : undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
      },
      metadata: {
        userId,
        plan,
      },
    });

    // Save checkout session to database
    await prisma.checkoutSession.create({
      data: {
        stripeSessionId: session.id,
        userId,
        plan,
        successUrl,
        cancelUrl,
        status: 'open',
        expiresAt: new Date(session.expires_at * 1000),
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(
    userId: string,
    request: CreateBillingPortalRequest
  ): Promise<string> {
    // Get customer
    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: request.returnUrl,
    });

    return session.url;
  }

  /**
   * Create payment intent for one-time payment
   */
  async createPaymentIntent(
    userId: string,
    request: CreatePaymentIntentRequest
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const { amount, currency = 'usd', description, metadata } = request;

    // Get customer
    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customer?.stripeCustomerId,
      description,
      metadata: {
        userId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save to database
    await prisma.paymentIntent.create({
      data: {
        stripePaymentIntentId: paymentIntent.id,
        userId,
        amount,
        currency,
        status: paymentIntent.status as any,
        clientSecret: paymentIntent.client_secret!,
        description,
        metadata: metadata as any,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Get subscription by user ID
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing', 'past_due'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscription as any;
  }

  /**
   * Change subscription plan
   */
  async changeSubscriptionPlan(
    userId: string,
    newPlan: SubscriptionPlan,
    immediate: boolean = false
  ): Promise<Subscription> {
    // Get current subscription
    const currentSubscription = await this.getSubscription(userId);
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    // Get new plan details
    const planDetails = getPlanById(newPlan);
    if (!planDetails || !planDetails.stripePriceId) {
      throw new Error('Invalid plan');
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId
    );

    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: planDetails.stripePriceId,
          },
        ],
        proration_behavior: immediate ? 'always_invoice' : 'create_prorations',
        billing_cycle_anchor: immediate ? undefined : 'unchanged',
      }
    );

    // Update database
    const updated = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        plan: newPlan,
        status: updatedSubscription.status as any,
        currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        updatedAt: new Date(),
      },
    });

    return updated as any;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    userId: string,
    immediate: boolean = false
  ): Promise<Subscription> {
    // Get current subscription
    const currentSubscription = await this.getSubscription(userId);
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    if (immediate) {
      // Cancel immediately
      await stripe.subscriptions.cancel(currentSubscription.stripeSubscriptionId);

      const updated = await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return updated as any;
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      const updated = await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        },
      });

      return updated as any;
    }
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(userId: string): Promise<Subscription> {
    const currentSubscription = await this.getSubscription(userId);
    if (!currentSubscription) {
      throw new Error('No subscription found');
    }

    if (!currentSubscription.cancelAtPeriodEnd) {
      throw new Error('Subscription is not scheduled for cancellation');
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update database
    const updated = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      },
    });

    return updated as any;
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return [];
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.stripeCustomerId,
      type: 'card',
    });

    return paymentMethods.data.map((pm) => ({
      id: pm.id,
      userId,
      stripePaymentMethodId: pm.id,
      type: 'card' as any,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
            country: pm.card.country,
          }
        : undefined,
      isDefault: pm.id === customer.defaultPaymentMethod,
      createdAt: new Date(pm.created * 1000),
      updatedAt: new Date(),
    }));
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Update in Stripe
    await stripe.customers.update(customer.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Update in database
    await prisma.stripeCustomer.update({
      where: { userId },
      data: {
        defaultPaymentMethod: paymentMethodId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await stripe.paymentMethods.detach(paymentMethodId);
  }

  /**
   * Get invoices
   */
  async getInvoices(userId: string, limit: number = 10): Promise<Invoice[]> {
    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return [];
    }

    const invoices = await stripe.invoices.list({
      customer: customer.stripeCustomerId,
      limit,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      userId,
      stripeInvoiceId: invoice.id,
      subscriptionId: invoice.subscription as string,
      amount: invoice.amount_due / 100,
      amountPaid: invoice.amount_paid / 100,
      amountDue: invoice.amount_due / 100,
      currency: invoice.currency,
      status: invoice.status as any,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
      lineItems: invoice.lines.data.map((line) => ({
        id: line.id,
        description: line.description || '',
        amount: line.amount / 100,
        quantity: line.quantity || 1,
        currency: line.currency,
      })),
      createdAt: new Date(invoice.created * 1000),
      updatedAt: new Date(),
    }));
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(userId: string): Promise<Invoice | null> {
    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return null;
    }

    try {
      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: customer.stripeCustomerId,
      });

      return {
        id: 'upcoming',
        userId,
        stripeInvoiceId: 'upcoming',
        subscriptionId: invoice.subscription as string,
        amount: invoice.amount_due / 100,
        amountPaid: 0,
        amountDue: invoice.amount_due / 100,
        currency: invoice.currency,
        status: 'draft' as any,
        dueDate: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
        lineItems: invoice.lines.data.map((line) => ({
          id: line.id,
          description: line.description || '',
          amount: line.amount / 100,
          quantity: line.quantity || 1,
          currency: line.currency,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Create refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  ): Promise<void> {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
    });
  }
}

export default new StripePaymentService();