'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

export default function AdminDatabasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Database Management</h2>
        <p className="text-gray-600 mt-1">Database statistics and management</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Database Overview</CardTitle>
          <CardDescription>Coming soon - Database statistics and management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Management</h3>
            <p className="text-gray-600 mb-4">
              This page will include database statistics, connection pool info, and management tools.
            </p>
            <p className="text-sm text-gray-500">Implementation in progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
