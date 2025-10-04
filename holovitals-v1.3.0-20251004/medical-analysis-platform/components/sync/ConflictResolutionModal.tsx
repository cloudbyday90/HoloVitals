'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, AlertTriangle, Clock } from 'lucide-react';

interface ConflictResolutionModalProps {
  open: boolean;
  onClose: () => void;
  onResolve: (resolution: ConflictResolution) => Promise<void>;
  conflict: DataConflict | null;
}

interface DataConflict {
  id: string;
  type: string;
  severity: string;
  resourceType: string;
  resourceId: string;
  field: string;
  localValue: any;
  remoteValue: any;
  localTimestamp: string;
  remoteTimestamp: string;
  detectedAt: string;
}

interface ConflictResolution {
  strategy: 'USE_LOCAL' | 'USE_REMOTE' | 'MERGE' | 'MANUAL' | 'IGNORE';
  resolvedValue?: any;
  reason?: string;
}

export function ConflictResolutionModal({
  open,
  onClose,
  onResolve,
  conflict,
}: ConflictResolutionModalProps) {
  const [strategy, setStrategy] = useState<ConflictResolution['strategy']>('USE_REMOTE');
  const [manualValue, setManualValue] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!conflict) return null;

  const handleResolve = async () => {
    try {
      setLoading(true);
      setError(null);

      const resolution: ConflictResolution = {
        strategy,
        reason: reason || undefined,
      };

      if (strategy === 'MANUAL') {
        if (!manualValue) {
          setError('Please provide a manual value');
          return;
        }
        try {
          resolution.resolvedValue = JSON.parse(manualValue);
        } catch {
          setError('Invalid JSON format for manual value');
          return;
        }
      }

      await onResolve(resolution);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve conflict');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      CRITICAL: 'destructive',
      HIGH: 'destructive',
      MEDIUM: 'secondary',
      LOW: 'outline',
    };

    return (
      <Badge variant={variants[severity.toUpperCase()] || 'outline'}>
        {severity}
      </Badge>
    );
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {getSeverityIcon(conflict.severity)}
            <div>
              <DialogTitle className="text-gray-900">Resolve Data Conflict</DialogTitle>
              <DialogDescription className="text-gray-600">
                {conflict.type} conflict in {conflict.resourceType}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Conflict Details */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Severity</span>
              {getSeverityBadge(conflict.severity)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Resource</span>
              <span className="text-sm text-gray-900">
                {conflict.resourceType} ({conflict.resourceId})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Field</span>
              <span className="text-sm font-mono text-gray-900">{conflict.field}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Detected</span>
              <span className="text-sm text-gray-900">{formatTimestamp(conflict.detectedAt)}</span>
            </div>
          </div>

          {/* Value Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-900">Local Value</Label>
                <span className="text-xs text-gray-600">
                  {formatTimestamp(conflict.localTimestamp)}
                </span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {formatValue(conflict.localValue)}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-900">Remote Value</Label>
                <span className="text-xs text-gray-600">
                  {formatTimestamp(conflict.remoteTimestamp)}
                </span>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {formatValue(conflict.remoteValue)}
                </pre>
              </div>
            </div>
          </div>

          {/* Resolution Strategy */}
          <div className="space-y-3">
            <Label className="text-gray-900">Resolution Strategy</Label>
            <RadioGroup value={strategy} onValueChange={(value: any) => setStrategy(value)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="USE_LOCAL" id="local" />
                  <Label htmlFor="local" className="flex-1 cursor-pointer text-gray-900">
                    <div className="font-medium">Use Local Value</div>
                    <div className="text-sm text-gray-600">
                      Keep the value from your local database
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="USE_REMOTE" id="remote" />
                  <Label htmlFor="remote" className="flex-1 cursor-pointer text-gray-900">
                    <div className="font-medium">Use Remote Value</div>
                    <div className="text-sm text-gray-600">
                      Accept the value from the EHR system
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="MERGE" id="merge" />
                  <Label htmlFor="merge" className="flex-1 cursor-pointer text-gray-900">
                    <div className="font-medium">Merge Values</div>
                    <div className="text-sm text-gray-600">
                      Attempt to combine both values intelligently
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="MANUAL" id="manual" />
                  <Label htmlFor="manual" className="flex-1 cursor-pointer text-gray-900">
                    <div className="font-medium">Manual Resolution</div>
                    <div className="text-sm text-gray-600">
                      Provide a custom value
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="IGNORE" id="ignore" />
                  <Label htmlFor="ignore" className="flex-1 cursor-pointer text-gray-900">
                    <div className="font-medium">Ignore Conflict</div>
                    <div className="text-sm text-gray-600">
                      Skip this conflict and continue
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Manual Value Input */}
          {strategy === 'MANUAL' && (
            <div className="space-y-2">
              <Label htmlFor="manualValue" className="text-gray-900">Manual Value (JSON)</Label>
              <Textarea
                id="manualValue"
                placeholder='{"key": "value"}'
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                rows={5}
                className="font-mono text-sm bg-white border-gray-300 text-gray-900"
              />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-gray-900">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you chose this resolution..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="bg-white border-gray-300 text-gray-900"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resolve Conflict
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}