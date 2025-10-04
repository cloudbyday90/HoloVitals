import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/config/stripe';
import { prisma } from '@/lib/prisma';
import { AuditLoggingService } from '@/lib/services/AuditLoggingService';


// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
const auditService = new AuditLoggingService();

// Webhook event handlers
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    throw new Error('Missing userId or planId in session metadata');
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update user subscription in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: subscription.status,
      subscriptionPlan: planId,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Log audit event
  await auditService.logEvent({
    userId,
    action: 'SUBSCRIPTION_CREATED',
    resourceType: 'SUBSCRIPTION',
    resourceId: subscriptionId,
    details: {
      planId,
      status: subscription.status,
      amount: session.amount_total,
    },
    ipAddress: '',
    userAgent: '',
  });

  console.log(`✅ Subscription created for user ${userId}: ${subscriptionId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Update subscription status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Log audit event
  await auditService.logEvent({
    userId: user.id,
    action: 'SUBSCRIPTION_UPDATED',
    resourceType: 'SUBSCRIPTION',
    resourceId: subscription.id,
    details: {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
    },
    ipAddress: '',
    userAgent: '',
  });

  console.log(`✅ Subscription updated for user ${user.id}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Update subscription status to canceled
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
    },
  });

  // Log audit event
  await auditService.logEvent({
    userId: user.id,
    action: 'SUBSCRIPTION_CANCELED',
    resourceType: 'SUBSCRIPTION',
    resourceId: subscription.id,
    details: {
      canceledAt: subscription.canceled_at,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    ipAddress: '',
    userAgent: '',
  });

  console.log(`✅ Subscription canceled for user ${user.id}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Log audit event
  await auditService.logEvent({
    userId: user.id,
    action: 'INVOICE_PAID',
    resourceType: 'INVOICE',
    resourceId: invoice.id,
    details: {
      amount: invoice.amount_paid,
      currency: invoice.currency,
      invoiceNumber: invoice.number,
    },
    ipAddress: '',
    userAgent: '',
  });

  console.log(`✅ Invoice paid for user ${user.id}: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Log audit event
  await auditService.logEvent({
    userId: user.id,
    action: 'INVOICE_PAYMENT_FAILED',
    resourceType: 'INVOICE',
    resourceId: invoice.id,
    details: {
      amount: invoice.amount_due,
      currency: invoice.currency,
      attemptCount: invoice.attempt_count,
    },
    ipAddress: '',
    userAgent: '',
  });

  console.log(`❌ Invoice payment failed for user ${user.id}: ${invoice.id}`);
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer as string;

  if (!customerId) {
    return;
  }

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Log audit event
  await auditService.logEvent({
    userId: user.id,
    action: 'PAYMENT_METHOD_ATTACHED',
    resourceType: 'PAYMENT_METHOD',
    resourceId: paymentMethod.id,
    details: {
      type: paymentMethod.type,
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
    },
    ipAddress: '',
    userAgent: '',
  });

  console.log(`✅ Payment method attached for user ${user.id}: ${paymentMethod.id}`);
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer as string;

  if (!customerId) {
    return;
  }

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  // Log audit event
  await auditService.logEvent({
    userId: user.id,
    action: 'PAYMENT_METHOD_DETACHED',
    resourceType: 'PAYMENT_METHOD',
    resourceId: paymentMethod.id,
    details: {
      type: paymentMethod.type,
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
    },
    ipAddress: '',
    userAgent: '',
  });

  console.log(`✅ Payment method detached for user ${user.id}: ${paymentMethod.id}`);
}

// Main webhook handler
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}