'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Analytics & Reports</h2>
        <p className="text-gray-600 mt-1">Data insights and reporting</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Analytics Dashboard</CardTitle>
          <CardDescription>Coming soon - Charts, graphs, and detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Reports</h3>
            <p className="text-gray-600 mb-4">
              This page will include user growth charts, revenue trends, cost breakdown, and usage patterns.
            </p>
            <p className="text-sm text-gray-500">Implementation in progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
