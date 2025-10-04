'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function DevLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">System Logs</h2>
        <p className="text-gray-600 mt-1">View and search system logs</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Log Viewer</CardTitle>
          <CardDescription>Coming soon - System log viewer and search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Logs</h3>
            <p className="text-gray-600 mb-4">
              This page will include application logs, access logs, audit logs, and log search.
            </p>
            <p className="text-sm text-gray-500">Implementation in progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
