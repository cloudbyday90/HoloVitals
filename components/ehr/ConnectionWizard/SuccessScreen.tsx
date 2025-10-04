/**
 * Success Screen Component
 * 
 * Displays success message after successful EHR connection
 */

'use client';

import { EHRProvider, EHRConnectionResponse } from '@/lib/types/ehr';
import { EHR_PROVIDERS } from '@/lib/constants/ehr-providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SuccessScreenProps {
  provider: EHRProvider;
  connectionResult: EHRConnectionResponse;
  onReset?: () => void;
}

export function SuccessScreen({ provider, connectionResult, onReset }: SuccessScreenProps) {
  const router = useRouter();
  const providerInfo = EHR_PROVIDERS[provider];

  const handleViewData = () => {
    router.push('/ehr/clinical');
  };

  const handleSyncNow = () => {
    router.push('/ehr/sync');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Connection Successful!</h2>
        <p className="text-muted-foreground">
          You're now connected to {providerInfo.displayName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Your EHR connection is active and ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Details */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium">{providerInfo.displayName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-primary">Connected</span>
            </div>
            {connectionResult.data?.connectedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connected At</span>
                <span className="font-medium">
                  {new Date(connectionResult.data.connectedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSyncNow}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Customer Data Now
            </Button>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleViewData}
            >
              View Clinical Data
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {onReset && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={onReset}
              >
                Connect Another Provider
              </Button>
            )}
          </div>

          {/* Next Steps */}
          <div className="pt-4 space-y-2">
            <h4 className="font-semibold text-sm">Recommended Next Steps:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Sync your customer data to get the latest information</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Review your clinical data including encounters, medications, and lab results</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Set up automatic sync schedules for continuous updates</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Need help?{' '}
          <a href="/docs/ehr-usage" className="text-primary hover:underline">
            View usage guide
          </a>
        </p>
      </div>
    </div>
  );
}