'use client';

import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SubscriptionPlan } from '@/lib/types/payment';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  currentPlan?: string;
  onSelect: (planId: string) => void;
  loading?: boolean;
  popular?: boolean;
}

export function SubscriptionPlanCard({
  plan,
  currentPlan,
  onSelect,
  loading = false,
  popular = false,
}: SubscriptionPlanCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.id === 'free';

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        popular && 'border-primary shadow-lg',
        isCurrentPlan && 'border-green-500'
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-4 right-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground">/{plan.interval}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-6 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Patients</span>
            <span className="font-medium">
              {plan.limits.patients === -1 ? 'Unlimited' : plan.limits.patients.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Storage</span>
            <span className="font-medium">
              {plan.limits.storage === -1 ? 'Unlimited' : `${plan.limits.storage} GB`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">AI Insights</span>
            <span className="font-medium">
              {plan.limits.aiInsights === -1 ? 'Unlimited' : `${plan.limits.aiInsights}/month`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">EHR Connections</span>
            <span className="font-medium">
              {plan.limits.ehrConnections === -1 ? 'Unlimited' : plan.limits.ehrConnections}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={popular ? 'default' : 'outline'}
          onClick={() => onSelect(plan.id)}
          disabled={loading || isCurrentPlan || isFree}
        >
          {loading ? (
            'Processing...'
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : isFree ? (
            'Free Forever'
          ) : (
            `Upgrade to ${plan.name}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}