'use client';

import React, { useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BetaCodeInputProps {
  onSuccess?: () => void;
  onSkip?: () => void;
}

export function BetaCodeInput({ onSuccess, onSkip }: BetaCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Please enter a beta code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First validate the code
      const validateResponse = await fetch('/api/beta/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok || !validateData.valid) {
        setError(validateData.error || 'Invalid beta code');
        setLoading(false);
        return;
      }

      // Then redeem the code
      const redeemResponse = await fetch('/api/beta/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const redeemData = await redeemResponse.json();

      if (!redeemResponse.ok) {
        setError(redeemData.error || 'Failed to redeem beta code');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      console.error('Error validating beta code:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              Welcome to the Beta Program!
            </h3>
            <p className="text-green-700 mb-4">
              Your beta code has been activated successfully.
            </p>
            <div className="text-sm text-green-600">
              Redirecting to your dashboard...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Beta Access Code</CardTitle>
        </div>
        <CardDescription>
          Enter your beta code to unlock unlimited access during our testing phase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="beta-code">Beta Code</Label>
          <Input
            id="beta-code"
            placeholder="HOLO-XXXXXXXX"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="font-mono text-lg tracking-wider"
            maxLength={13}
          />
          <p className="text-xs text-muted-foreground">
            Format: HOLO-XXXXXXXX (case insensitive)
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleValidate}
            disabled={loading || !code.trim()}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Activate Beta Access'
            )}
          </Button>
          {onSkip && (
            <Button variant="outline" onClick={onSkip} disabled={loading}>
              Skip for Now
            </Button>
          )}
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm">
          <h4 className="font-semibold mb-2">Beta Program Benefits:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• 3 million AI tokens for testing</li>
            <li>• 500 MB file upload storage</li>
            <li>• Unlimited AI conversations</li>
            <li>• All premium features unlocked</li>
            <li>• Priority support</li>
            <li>• Special thank you rewards after testing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}