/**
 * Admin Settings Page
 * Manage external services and GitHub PAT configuration
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ServiceConfig {
  id: string;
  serviceName: string;
  enabled: boolean;
  configuration: any;
  updatedAt: string;
}

interface GitHubPATConfig {
  id: string;
  tokenName: string | null;
  scopes: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [githubPATs, setGithubPATs] = useState<GitHubPATConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // OpenAI state
  const [openaiEnabled, setOpenaiEnabled] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-3.5-turbo');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  // GitHub PAT state
  const [githubPAT, setGithubPAT] = useState('');
  const [githubTokenName, setGithubTokenName] = useState('');
  const [githubExpiresAt, setGithubExpiresAt] = useState('');
  const [showGithubPAT, setShowGithubPAT] = useState(false);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);

      // Fetch service configurations
      const servicesRes = await fetch('/api/admin/services');
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.data || []);

        // Set OpenAI configuration
        const openaiConfig = servicesData.data?.find((s: ServiceConfig) => s.serviceName === 'openai');
        if (openaiConfig) {
          setOpenaiEnabled(openaiConfig.enabled);
          setOpenaiModel(openaiConfig.configuration?.model || 'gpt-3.5-turbo');
        }
      }

      // Fetch GitHub PAT configurations
      const githubRes = await fetch('/api/admin/github-pat');
      if (githubRes.ok) {
        const githubData = await githubRes.json();
        setGithubPATs(githubData.data || []);
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
      setMessage({ type: 'error', text: 'Failed to load configurations' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOpenAI = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: 'openai',
          enabled: openaiEnabled,
          configuration: openaiEnabled ? {
            apiKey: openaiApiKey,
            model: openaiModel,
          } : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'OpenAI configuration saved successfully' });
        setOpenaiApiKey(''); // Clear the API key input for security
        await fetchConfigurations();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save OpenAI configuration' });
      }
    } catch (error) {
      console.error('Error saving OpenAI configuration:', error);
      setMessage({ type: 'error', text: 'Failed to save OpenAI configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGitHubPAT = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/admin/github-pat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalAccessToken: githubPAT,
          tokenName: githubTokenName || undefined,
          expiresAt: githubExpiresAt || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'GitHub PAT saved successfully' });
        setGithubPAT(''); // Clear the PAT input for security
        setGithubTokenName('');
        setGithubExpiresAt('');
        await fetchConfigurations();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save GitHub PAT' });
      }
    } catch (error) {
      console.error('Error saving GitHub PAT:', error);
      setMessage({ type: 'error', text: 'Failed to save GitHub PAT' });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateGitHubPAT = async (id: string) => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/admin/github-pat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, activate: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'GitHub PAT activated successfully' });
        await fetchConfigurations();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to activate GitHub PAT' });
      }
    } catch (error) {
      console.error('Error activating GitHub PAT:', error);
      setMessage({ type: 'error', text: 'Failed to activate GitHub PAT' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGitHubPAT = async (id: string) => {
    if (!confirm('Are you sure you want to delete this GitHub PAT?')) {
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(`/api/admin/github-pat?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'GitHub PAT deleted successfully' });
        await fetchConfigurations();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete GitHub PAT' });
      }
    } catch (error) {
      console.error('Error deleting GitHub PAT:', error);
      setMessage({ type: 'error', text: 'Failed to delete GitHub PAT' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage external services and integrations
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="openai" className="space-y-6">
        <TabsList>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="github">GitHub PAT</TabsTrigger>
        </TabsList>

        <TabsContent value="openai">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI Configuration</CardTitle>
              <CardDescription>
                Configure OpenAI API for AI-powered features. Enable this service to use chat and analysis features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="openai-enabled">Enable OpenAI</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on to enable AI features
                  </p>
                </div>
                <Switch
                  id="openai-enabled"
                  checked={openaiEnabled}
                  onCheckedChange={setOpenaiEnabled}
                />
              </div>

              {openaiEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="openai-api-key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="openai-api-key"
                        type={showOpenaiKey ? 'text' : 'password'}
                        placeholder="sk-..."
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      >
                        {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your OpenAI API key (starts with sk-)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openai-model">Model</Label>
                    <Input
                      id="openai-model"
                      placeholder="gpt-3.5-turbo"
                      value={openaiModel}
                      onChange={(e) => setOpenaiModel(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      OpenAI model to use (e.g., gpt-3.5-turbo, gpt-4)
                    </p>
                  </div>
                </>
              )}

              <Button
                onClick={handleSaveOpenAI}
                disabled={saving || (openaiEnabled && !openaiApiKey)}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save OpenAI Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="github">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add GitHub Personal Access Token</CardTitle>
                <CardDescription>
                  Add a GitHub PAT for repository operations. Required for private repositories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Create a PAT at{' '}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      github.com/settings/tokens
                    </a>
                    . Required scopes: repo, workflow
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="github-pat">Personal Access Token</Label>
                  <div className="relative">
                    <Input
                      id="github-pat"
                      type={showGithubPAT ? 'text' : 'password'}
                      placeholder="ghp_..."
                      value={githubPAT}
                      onChange={(e) => setGithubPAT(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowGithubPAT(!showGithubPAT)}
                    >
                      {showGithubPAT ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your GitHub Personal Access Token (starts with ghp_)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github-token-name">Token Name (Optional)</Label>
                  <Input
                    id="github-token-name"
                    placeholder="Production Token"
                    value={githubTokenName}
                    onChange={(e) => setGithubTokenName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    A friendly name to identify this token
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github-expires-at">Expiration Date (Optional)</Label>
                  <Input
                    id="github-expires-at"
                    type="date"
                    value={githubExpiresAt}
                    onChange={(e) => setGithubExpiresAt(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    When this token expires
                  </p>
                </div>

                <Button
                  onClick={handleSaveGitHubPAT}
                  disabled={saving || !githubPAT}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save GitHub PAT
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved GitHub PATs</CardTitle>
                <CardDescription>
                  Manage your saved GitHub Personal Access Tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                {githubPATs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No GitHub PATs configured</p>
                ) : (
                  <div className="space-y-4">
                    {githubPATs.map((pat) => (
                      <div
                        key={pat.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {pat.tokenName || 'Unnamed Token'}
                            </p>
                            {pat.isActive && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          {pat.scopes && (
                            <p className="text-sm text-muted-foreground">
                              Scopes: {pat.scopes}
                            </p>
                          )}
                          {pat.expiresAt && (
                            <p className="text-sm text-muted-foreground">
                              Expires: {new Date(pat.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(pat.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!pat.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateGitHubPAT(pat.id)}
                              disabled={saving}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteGitHubPAT(pat.id)}
                            disabled={saving}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}