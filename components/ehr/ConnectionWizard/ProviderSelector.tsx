/**
 * Provider Selector Component
 * 
 * Allows users to select an EHR provider from the list of supported systems
 */

'use client';

import { EHRProvider } from '@/lib/types/ehr';
import { EHR_PROVIDERS, PROVIDER_LIST } from '@/lib/constants/ehr-providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink } from 'lucide-react';

interface ProviderSelectorProps {
  selectedProvider?: EHRProvider;
  onSelect: (provider: EHRProvider) => void;
}

export function ProviderSelector({ selectedProvider, onSelect }: ProviderSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Connect to Your EHR System</h2>
        <p className="text-muted-foreground">
          Select your Electronic Health Record provider to get started
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDER_LIST.map((provider) => (
          <Card
            key={provider.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedProvider === provider.id
                ? 'ring-2 ring-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onSelect(provider.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{provider.displayName}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {provider.marketShare} Market Share
                  </Badge>
                </div>
                {selectedProvider === provider.id && (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm">
                {provider.description}
              </CardDescription>
              
              <div className="flex items-center gap-2">
                <a
                  href={provider.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          disabled={!selectedProvider}
          onClick={() => selectedProvider && onSelect(selectedProvider)}
        >
          Continue with {selectedProvider ? EHR_PROVIDERS[selectedProvider].displayName : 'Selected Provider'}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Don't see your EHR provider?{' '}
          <a href="/contact" className="text-primary hover:underline">
            Contact us
          </a>{' '}
          to request support.
        </p>
      </div>
    </div>
  );
}