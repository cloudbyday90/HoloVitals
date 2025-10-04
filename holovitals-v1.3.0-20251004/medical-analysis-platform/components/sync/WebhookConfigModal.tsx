'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface WebhookConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: WebhookConfig) => Promise<void>;
  ehrProvider: string;
  ehrConnectionId: string;
}

interface WebhookConfig {
  endpoint: string;
  secret: string;
  events: string[];
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  signatureAlgorithm: string;
}

const AVAILABLE_EVENTS = [
  'patient.created',
  'patient.updated',
  'patient.deleted',
  'observation.created',
  'observation.updated',
  'medication.created',
  'medication.updated',
  'allergy.created',
  'allergy.updated',
  'condition.created',
  'condition.updated',
  'encounter.created',
  'encounter.updated',
  'document.created',
  'document.updated',
];

export function WebhookConfigModal({
  open,
  onClose,
  onSave,
  ehrProvider,
  ehrConnectionId,
}: WebhookConfigModalProps) {
  const [config, setConfig] = useState<WebhookConfig>({
    endpoint: '',
    secret: '',
    events: [],
    retryAttempts: 3,
    retryDelay: 2000,
    timeout: 30000,
    signatureAlgorithm: 'sha256',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate
      if (!config.endpoint) {
        setError('Endpoint URL is required');
        return;
      }
      if (!config.secret) {
        setError('Secret key is required');
        return;
      }
      if (config.events.length === 0) {
        setError('Please select at least one event');
        return;
      }

      await onSave(config);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save webhook configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (event: string) => {
    setConfig((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const selectAllEvents = () => {
    setConfig((prev) => ({
      ...prev,
      events: AVAILABLE_EVENTS,
    }));
  };

  const deselectAllEvents = () => {
    setConfig((prev) => ({
      ...prev,
      events: [],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Configure Webhook</DialogTitle>
          <DialogDescription className="text-gray-600">
            Set up webhook notifications for {ehrProvider} data changes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="endpoint" className="text-gray-900">Endpoint URL</Label>
            <Input
              id="endpoint"
              type="url"
              placeholder="https://your-app.com/webhooks/ehr"
              value={config.endpoint}
              onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              className="bg-white border-gray-300 text-gray-900"
            />
            <p className="text-sm text-gray-600">
              The URL where webhook events will be sent
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret" className="text-gray-900">Secret Key</Label>
            <Input
              id="secret"
              type="password"
              placeholder="Enter a secure secret key"
              value={config.secret}
              onChange={(e) => setConfig({ ...config, secret: e.target.value })}
              className="bg-white border-gray-300 text-gray-900"
            />
            <p className="text-sm text-gray-600">
              Used to sign webhook payloads for verification
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-900">Events to Subscribe</Label>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllEvents}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deselectAllEvents}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {AVAILABLE_EVENTS.map((event) => (
                <div key={event} className="flex items-center space-x-2">
                  <Checkbox
                    id={event}
                    checked={config.events.includes(event)}
                    onCheckedChange={() => toggleEvent(event)}
                  />
                  <label
                    htmlFor={event}
                    className="text-sm text-gray-900 cursor-pointer"
                  >
                    {event}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retryAttempts" className="text-gray-900">Retry Attempts</Label>
              <Input
                id="retryAttempts"
                type="number"
                min="0"
                max="10"
                value={config.retryAttempts}
                onChange={(e) =>
                  setConfig({ ...config, retryAttempts: parseInt(e.target.value) })
                }
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retryDelay" className="text-gray-900">Retry Delay (ms)</Label>
              <Input
                id="retryDelay"
                type="number"
                min="1000"
                max="60000"
                step="1000"
                value={config.retryDelay}
                onChange={(e) =>
                  setConfig({ ...config, retryDelay: parseInt(e.target.value) })
                }
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout" className="text-gray-900">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                min="5000"
                max="120000"
                step="5000"
                value={config.timeout}
                onChange={(e) =>
                  setConfig({ ...config, timeout: parseInt(e.target.value) })
                }
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signatureAlgorithm" className="text-gray-900">Signature Algorithm</Label>
              <Select
                value={config.signatureAlgorithm}
                onValueChange={(value) =>
                  setConfig({ ...config, signatureAlgorithm: value })
                }
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="sha256">SHA-256</SelectItem>
                  <SelectItem value="sha512">SHA-512</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}