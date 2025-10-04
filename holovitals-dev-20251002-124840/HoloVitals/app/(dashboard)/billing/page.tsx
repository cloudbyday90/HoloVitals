import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BillingDashboard } from '@/components/billing/BillingDashboard';

export const metadata = {
  title: 'Billing & Subscription | HoloVitals',
  description: 'Manage your subscription, payment methods, and billing information',
};

async function getUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionCurrentPeriodEnd: true,
    },
  });

  return user;
}

async function getUserUsage(userId: string) {
  // Get current usage statistics
  const [customerCount, ehrConnectionCount] = await Promise.all([
    prisma.patient.count({
      where: { userId },
    }),
    prisma.eHRConnection.count({
      where: { userId, status: 'active' },
    }),
  ]);

  // Get AI insights count for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const aiInsightsCount = await prisma.aIHealthInsight.count({
    where: {
      patientId: {
        in: (
          await prisma.patient.findMany({
            where: { userId },
            select: { id: true },
          })
        ).map((p) => p.id),
      },
      generatedAt: {
        gte: startOfMonth,
      },
    },
  });

  // Calculate storage usage (in GB)
  // This is a simplified calculation - in production, you'd track actual file sizes
  const documentCount = await prisma.fHIRResource.count({
    where: {
      patientId: {
        in: (
          await prisma.patient.findMany({
            where: { userId },
            select: { id: true },
          })
        ).map((p) => p.id),
      },
      resourceType: 'DocumentReference',
    },
  });

  // Estimate: average document is 2MB
  const storageUsed = (documentCount * 2) / 1024; // Convert MB to GB

  return {
    patients: customerCount,
    storage: Math.round(storageUsed * 100) / 100, // Round to 2 decimal places
    aiInsights: aiInsightsCount,
    ehrConnections: ehrConnectionCount,
  };
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const [subscription, usage] = await Promise.all([
    getUserSubscription(session.user.id),
    getUserUsage(session.user.id),
  ]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, payment methods, and view your invoices
        </p>
      </div>

      <BillingDashboard
        userId={session.user.id}
        currentPlan={subscription?.subscriptionPlan || 'free'}
        subscriptionStatus={subscription?.subscriptionStatus}
        currentPeriodEnd={subscription?.subscriptionCurrentPeriodEnd}
        usage={usage}
      />
    </div>
  );
}