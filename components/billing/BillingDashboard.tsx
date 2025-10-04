'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';
import { PaymentMethodCard } from './PaymentMethodCard';
import { InvoiceList } from './InvoiceList';
import { UsageTracker } from './UsageTracker';
import { SUBSCRIPTION_PLANS } from '@/lib/config/stripe';
import { PaymentMethod, Invoice } from '@/lib/types/payment';
import { formatDate } from '@/lib/utils';

interface BillingDashboardProps {
  userId: string;
  currentPlan: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: Date;
  usage: {
    customers: number;
    storage: number;
    aiInsights: number;
    ehrConnections: number;
  };
}

export function BillingDashboard({
  userId,
  currentPlan,
  subscriptionStatus,
  currentPeriodEnd,
  usage,
}: BillingDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  const currentPlanDetails = SUBSCRIPTION_PLANS.find((p) => p.id === currentPlan);

  useEffect(() => {
    loadPaymentMethods();
    loadInvoices();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      const response = await fetch('/api/payments/payment-methods');
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const response = await fetch('/api/payments/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/create-billing-portal', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice?.invoicePdf) {
      window.open(invoice.invoicePdf, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {currentPlan !== 'free' && subscriptionStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{currentPlanDetails?.name}</h3>
                <p className="text-muted-foreground mt-1">
                  Status: <span className="capitalize font-medium">{subscriptionStatus}</span>
                </p>
                {currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Renews on {formatDate(currentPeriodEnd)}
                  </p>
                )}
              </div>
              <Button onClick={handleManageBilling} disabled={loading}>
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Warning */}
      {currentPlanDetails && (
        <>
          {usage.customers >= currentPlanDetails.limits.customers * 0.9 &&
            currentPlanDetails.limits.customers !== -1 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Approaching Customer Limit</AlertTitle>
                <AlertDescription>
                  You're using {usage.customers} of {currentPlanDetails.limits.customers} customers.
                  Consider upgrading your plan to add more customers.
                </AlertDescription>
              </Alert>
            )}
        </>
      )}

      {/* Usage Tracker */}
      {currentPlanDetails && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Usage Overview</h2>
          <UsageTracker usage={usage} limits={currentPlanDetails.limits} />
        </div>
      )}

      {/* Tabs for Plans, Payment Methods, and Invoices */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">
            <TrendingUp className="h-4 w-4 mr-2" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="payment-methods">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
            <p className="text-muted-foreground mb-6">
              Select the plan that best fits your practice needs
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <SubscriptionPlanCard
                key={plan.id}
                plan={plan}
                currentPlan={currentPlan}
                onSelect={handleSelectPlan}
                loading={loading}
                popular={plan.id === 'professional'}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Payment Methods</h2>
              <p className="text-muted-foreground">
                Manage your payment methods for subscriptions
              </p>
            </div>
            {currentPlan !== 'free' && (
              <Button onClick={handleManageBilling} disabled={loading}>
                Add Payment Method
              </Button>
            )}
          </div>

          {loadingPaymentMethods ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading payment methods...</p>
                </div>
              </CardContent>
            </Card>
          ) : paymentMethods.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                  Add a payment method to subscribe to a paid plan
                </p>
                {currentPlan !== 'free' && (
                  <Button onClick={handleManageBilling}>Add Payment Method</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  paymentMethod={method}
                  isDefault={method.id === paymentMethods[0]?.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Invoices</h2>
            <p className="text-muted-foreground">
              View and download your billing invoices
            </p>
          </div>

          {loadingInvoices ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading invoices...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <InvoiceList
              invoices={invoices}
              onDownload={handleDownloadInvoice}
              loading={loading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}