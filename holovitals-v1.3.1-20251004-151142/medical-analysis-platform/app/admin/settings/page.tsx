'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Admin Settings</h2>
        <p className="text-gray-600 mt-1">Configure system settings</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Configuration</CardTitle>
          <CardDescription>Coming soon - System configuration and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Settings</h3>
            <p className="text-gray-600 mb-4">
              This page will include system configuration, feature flags, and admin preferences.
            </p>
            <p className="text-sm text-gray-500">Implementation in progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
