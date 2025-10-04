'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Zap,
} from 'lucide-react';

interface ProviderInfo {
  id: string;
  name: string;
  npi?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  specialty?: string;
  ehrSystem?: string;
  ehrSystemConfidence?: number;
}

interface ConnectionField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

export default function ProviderOnboardingPage() {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
  const [detectedEHR, setDetectedEHR] = useState<string | null>(null);
  const [ehrConfidence, setEhrConfidence] = useState<number>(0);
  const [connectionFields, setConnectionFields] = useState<ConnectionField[]>([]);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Step 1: Search for provider
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/providers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 10 }),
      });

      const data = await response.json();

      if (data.success) {
        setProviders(data.providers);
      } else {
        setError(data.error || 'Failed to search providers');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search providers');
    } finally {
      setSearching(false);
    }
  };

  // Step 2: Select provider and detect EHR
  const handleSelectProvider = async (provider: ProviderInfo) => {
    setSelectedProvider(provider);
    setError(null);

    // If EHR is already detected, use it
    if (provider.ehrSystem && provider.ehrSystemConfidence) {
      setDetectedEHR(provider.ehrSystem);
      setEhrConfidence(provider.ehrSystemConfidence);
      setStep(3);
      await loadConnectionRequirements(provider.ehrSystem);
    } else {
      // Detect EHR system
      try {
        const response = await fetch('/api/providers/detect-ehr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider }),
        });

        const data = await response.json();

        if (data.success) {
          setDetectedEHR(data.ehrSystem);
          setEhrConfidence(data.confidence);
          setStep(3);
          await loadConnectionRequirements(data.ehrSystem);
        } else {
          setError('Could not detect EHR system. Please select manually.');
          setStep(3);
        }
      } catch (err: any) {
        setError('Could not detect EHR system. Please select manually.');
        setStep(3);
      }
    }
  };

  // Step 3: Load connection requirements
  const loadConnectionRequirements = async (ehrSystem: string) => {
    try {
      const response = await fetch('/api/providers/connection-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ehrSystem }),
      });

      const data = await response.json();

      if (data.success) {
        setConnectionFields(data.requirements.fields);
      }
    } catch (err: any) {
      setError('Failed to load connection requirements');
    }
  };

  // Step 4: Test connection
  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);

    try {
      const response = await fetch('/api/providers/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ehrSystem: detectedEHR,
          credentials,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(5);
      } else {
        setError(data.message || 'Connection test failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  // Step 5: Save connection
  const handleSaveConnection = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/providers/save-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerInfo: selectedProvider,
          ehrSystem: detectedEHR,
          credentials,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setStep(6);
      } else {
        setError(data.error || 'Failed to save connection');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save connection');
    } finally {
      setSaving(false);
    }
  };

  const getEHRDisplayName = (ehrSystem: string) => {
    const names: Record<string, string> = {
      epic: 'Epic Systems',
      cerner: 'Oracle Cerner',
      meditech: 'MEDITECH',
      allscripts: 'Allscripts/Veradigm',
      nextgen: 'NextGen Healthcare',
      athenahealth: 'athenahealth',
      eclinicalworks: 'eClinicalWorks',
    };
    return names[ehrSystem] || ehrSystem;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Connect Your Healthcare Provider</h1>
        <p className="text-gray-600 mt-2">
          Search for your provider and we'll automatically detect their EHR system
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[
          { num: 1, label: 'Search' },
          { num: 2, label: 'Select' },
          { num: 3, label: 'Configure' },
          { num: 4, label: 'Test' },
          { num: 5, label: 'Complete' },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= s.num
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > s.num ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <span className="font-semibold">{s.num}</span>
              )}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">{s.label}</span>
            {idx < 4 && (
              <div className="w-12 h-0.5 bg-gray-300 mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Search */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Search for Your Provider</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your doctor's name, clinic name, or NPI number
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Dr. Smith, Mayo Clinic, 1234567890"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-white border-gray-300 text-gray-900"
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {providers.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium text-gray-700">
                  Found {providers.length} providers:
                </p>
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      handleSelectProvider(provider);
                      setStep(2);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                        <p className="text-sm text-gray-600">{provider.specialty}</p>
                        {provider.address && (
                          <p className="text-sm text-gray-600 mt-1">
                            {provider.address}, {provider.city}, {provider.state} {provider.zip}
                          </p>
                        )}
                        {provider.npi && (
                          <p className="text-xs text-gray-500 mt-1">NPI: {provider.npi}</p>
                        )}
                      </div>
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Provider Selected */}
      {step === 2 && selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Detecting EHR System...</CardTitle>
            <CardDescription className="text-gray-600">
              Please wait while we identify the EHR system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure Connection */}
      {step === 3 && selectedProvider && detectedEHR && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Configure Connection</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your credentials for {getEHRDisplayName(detectedEHR)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* EHR Detection Result */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Detected EHR System</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {getEHRDisplayName(detectedEHR)}
                  </p>
                </div>
                <Badge variant="secondary">
                  {Math.round(ehrConfidence * 100)}% confidence
                </Badge>
              </div>
            </div>

            {/* Connection Fields */}
            {connectionFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name} className="text-gray-900">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={credentials[field.name] || ''}
                  onChange={(e) =>
                    setCredentials({ ...credentials, [field.name]: e.target.value })
                  }
                  required={field.required}
                  className="bg-white border-gray-300 text-gray-900"
                />
                {field.helpText && (
                  <p className="text-sm text-gray-600">{field.helpText}</p>
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Test Connection */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Test Connection</CardTitle>
            <CardDescription className="text-gray-600">
              Verify your credentials work correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-900 font-medium mb-2">Ready to Test Connection</p>
              <p className="text-sm text-gray-600">
                We'll verify your credentials can connect to {getEHRDisplayName(detectedEHR || '')}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleTestConnection} disabled={testing} className="flex-1">
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Save Connection */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Connection Successful!</CardTitle>
            <CardDescription className="text-gray-600">
              Save this connection to start syncing your health data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-900 font-medium mb-2">Connection Test Passed</p>
              <p className="text-sm text-gray-600">
                Your credentials are valid and ready to use
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleSaveConnection} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Connection
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Complete */}
      {step === 6 && success && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">All Set!</CardTitle>
            <CardDescription className="text-gray-600">
              Your provider connection has been saved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <CheckCircle2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">
                Connection Saved Successfully!
              </p>
              <p className="text-gray-600 mb-4">
                You can now sync your health data from {selectedProvider?.name}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.href = '/sync'}>
                  Go to Sync Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}