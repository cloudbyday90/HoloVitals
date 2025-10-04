/**
 * Credentials Form Component
 * 
 * Form for entering EHR connection credentials
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EHRProvider, EHRConnectionConfig } from '@/lib/types/ehr';
import { EHR_PROVIDERS, PROVIDER_CONFIG_FIELDS } from '@/lib/constants/ehr-providers';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Info } from 'lucide-react';

interface CredentialsFormProps {
  provider: EHRProvider;
  onSubmit: (credentials: EHRConnectionConfig) => void;
  onBack: () => void;
  isLoading?: boolean;
}

// Create dynamic schema based on provider
function createFormSchema(provider: EHRProvider) {
  const configFields = PROVIDER_CONFIG_FIELDS[provider];
  
  let schema: any = {
    baseUrl: z.string().url('Please enter a valid URL'),
    clientId: z.string().min(1, 'Client ID is required'),
    clientSecret: z.string().min(1, 'Client Secret is required'),
  };

  // Add additional fields if they exist
  if (configFields.additionalFields) {
    configFields.additionalFields.forEach((field) => {
      if (field.required) {
        schema[field.name] = z.string().min(1, `${field.label} is required`);
      } else {
        schema[field.name] = z.string().optional();
      }
    });
  }

  return z.object(schema);
}

export function CredentialsForm({ provider, onSubmit, onBack, isLoading }: CredentialsFormProps) {
  const providerInfo = EHR_PROVIDERS[provider];
  const configFields = PROVIDER_CONFIG_FIELDS[provider];
  const formSchema = createFormSchema(provider);

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseUrl: '',
      clientId: '',
      clientSecret: '',
    },
  });

  const handleSubmit = (values: FormValues) => {
    const { baseUrl, clientId, clientSecret, ...additionalConfig } = values;
    
    const credentials: EHRConnectionConfig = {
      provider,
      baseUrl,
      clientId,
      clientSecret,
      additionalConfig: Object.keys(additionalConfig).length > 0 ? additionalConfig : undefined,
    };

    onSubmit(credentials);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Connect to {providerInfo.displayName}
          </h2>
          <p className="text-muted-foreground">
            Enter your {providerInfo.displayName} credentials to establish a connection
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your credentials are encrypted and stored securely. We use industry-standard security
          practices to protect your data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
          <CardDescription>
            You can find these credentials in your {providerInfo.displayName} developer portal.{' '}
            <a
              href={providerInfo.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View documentation
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Base URL */}
              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{configFields.baseUrl.label}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={configFields.baseUrl.placeholder}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>{configFields.baseUrl.helpText}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client ID */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{configFields.clientId.label}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={configFields.clientId.placeholder}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>{configFields.clientId.helpText}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Secret */}
              <FormField
                control={form.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{configFields.clientSecret.label}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={configFields.clientSecret.placeholder}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>{configFields.clientSecret.helpText}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional Fields */}
              {configFields.additionalFields?.map((additionalField) => (
                <FormField
                  key={additionalField.name}
                  control={form.control}
                  name={additionalField.name as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {additionalField.label}
                        {!additionalField.required && (
                          <span className="text-muted-foreground ml-1">(Optional)</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={additionalField.placeholder}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>{additionalField.helpText}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Connecting...' : 'Test Connection'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Need help?{' '}
          <a href="/docs/ehr-connection" className="text-primary hover:underline">
            View setup guide
          </a>
        </p>
      </div>
    </div>
  );
}