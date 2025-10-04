'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function AdminSystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">System Health</h2>
        <p className="text-gray-600 mt-1">Monitor system performance and health</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">System Monitoring</CardTitle>
          <CardDescription>Coming soon - Real-time system health monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Health</h3>
            <p className="text-gray-600 mb-4">
              This page will include system health monitoring, performance metrics, and alerts.
            </p>
            <p className="text-sm text-gray-500">Implementation in progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
