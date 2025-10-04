'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';

export default function DevDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">API Documentation</h2>
        <p className="text-gray-600 mt-1">API reference and documentation</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">API Reference</CardTitle>
          <CardDescription>Coming soon - Complete API documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Documentation</h3>
            <p className="text-gray-600 mb-4">
              This page will include complete API documentation with examples and interactive testing.
            </p>
            <p className="text-sm text-gray-500">Implementation in progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
