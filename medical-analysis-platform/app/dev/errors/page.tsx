'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function DevErrorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Error Logs</h2>
        <p className="text-gray-600 mt-1">Monitor and track system errors</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Error Monitoring</CardTitle>
          <CardDescription>Coming soon - Error logs and tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Logs</h3>
            <p className="text-gray-600 mb-4">
              This page will include error list, filtering, stack traces, and error grouping.
            </p>
            <p className="text-sm text-gray-500">Implementation in progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
