'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function DevApiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">API Monitoring</h2>
        <p className="text-gray-600 mt-1">Track API performance and usage</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">API Analytics</CardTitle>
          <CardDescription>Coming soon - API endpoint monitoring and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Monitoring</h3>
            <p className="text-gray-600 mb-4">
              This page will include endpoint usage, response times, error rates, and rate limiting stats.
            </p>
            <p className="text-sm text-gray-500">Implementation in progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
