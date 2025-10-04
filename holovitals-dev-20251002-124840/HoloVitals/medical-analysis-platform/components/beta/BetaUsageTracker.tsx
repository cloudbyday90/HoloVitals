'use client';

import React from 'react';
import { Sparkles, HardDrive, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UsageData {
  tokens: {
    tokensUsed: number;
    tokensLimit: number;
    tokensRemaining: number;
    percentageUsed: number;
  };
  storage: {
    storageUsed: number;
    storageLimit: number;
    storageRemaining: number;
    percentageUsed: number;
  };
  fileCount: number;
}

interface BetaUsageTrackerProps {
  usage: UsageData;
}

export function BetaUsageTracker({ usage }: BetaUsageTrackerProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '[&>div]:bg-red-500';
    if (percentage >= 75) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) {
      return (
        <Badge variant="destructive" className="text-xs">
          Critical
        </Badge>
      );
    }
    if (percentage >= 75) {
      return (
        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
          Warning
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
        Healthy
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Beta Testing Usage</h3>
          <p className="text-sm text-muted-foreground">
            Track your usage during the beta testing phase
          </p>
        </div>
        <Badge className="bg-primary text-primary-foreground">
          <Sparkles className="h-3 w-3 mr-1" />
          Beta Tester
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* AI Tokens */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">AI Tokens</CardTitle>
                  <CardDescription className="text-xs">
                    For AI conversations and analysis
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(usage.tokens.percentageUsed)}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={cn('text-2xl font-bold', getStatusColor(usage.tokens.percentageUsed))}>
                {formatNumber(usage.tokens.tokensUsed)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {formatNumber(usage.tokens.tokensLimit)}
              </span>
            </div>
            <Progress
              value={usage.tokens.percentageUsed}
              className={cn('h-2', getProgressColor(usage.tokens.percentageUsed))}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{usage.tokens.percentageUsed.toFixed(1)}% used</span>
              <span>{formatNumber(usage.tokens.tokensRemaining)} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">Storage</CardTitle>
                  <CardDescription className="text-xs">
                    File upload storage space
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(usage.storage.percentageUsed)}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={cn('text-2xl font-bold', getStatusColor(usage.storage.percentageUsed))}>
                {usage.storage.storageUsed} MB
              </span>
              <span className="text-sm text-muted-foreground">
                / {usage.storage.storageLimit} MB
              </span>
            </div>
            <Progress
              value={usage.storage.percentageUsed}
              className={cn('h-2', getProgressColor(usage.storage.percentageUsed))}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{usage.storage.percentageUsed.toFixed(1)}% used</span>
              <span>{usage.storage.storageRemaining} MB remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* File Count */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Files Uploaded</CardTitle>
                <CardDescription className="text-xs">
                  Total documents uploaded
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {usage.fileCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              documents in your library
            </p>
          </CardContent>
        </Card>

        {/* Beta Progress */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Testing Progress</CardTitle>
                <CardDescription className="text-xs">
                  Your contribution to beta
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {Math.round((usage.tokens.tokensUsed / usage.tokens.tokensLimit) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of allocated tokens used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {usage.tokens.percentageUsed >= 75 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">
                  Approaching Token Limit
                </h4>
                <p className="text-sm text-yellow-700">
                  You've used {usage.tokens.percentageUsed.toFixed(1)}% of your allocated tokens. 
                  If you need more tokens for testing, please contact us and we'll increase your limit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {usage.storage.percentageUsed >= 75 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <HardDrive className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">
                  Approaching Storage Limit
                </h4>
                <p className="text-sm text-yellow-700">
                  You've used {usage.storage.percentageUsed.toFixed(1)}% of your storage space. 
                  If you need more storage for testing, please contact us and we'll increase your limit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}