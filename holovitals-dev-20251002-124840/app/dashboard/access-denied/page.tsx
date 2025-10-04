/**
 * Access Denied Page
 * Shown when users try to access routes they don't have permission for
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccessDeniedPage() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get('required') || 'ADMIN';
  const currentRole = searchParams.get('current') || 'PATIENT';
  const attemptedPath = searchParams.get('path') || '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Access Denied
        </h1>

        {/* Subtitle */}
        <p className="text-center text-gray-600 mb-8">
          You don't have permission to access this resource
        </p>

        {/* Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            {/* Attempted Path */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Attempted Path
                </span>
              </div>
              <code className="block bg-gray-50 px-3 py-2 rounded text-sm text-gray-800 font-mono">
                {attemptedPath}
              </code>
            </div>

            {/* Role Information */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  Your Role
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentRole}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  Required Role
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {requiredRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Why am I seeing this?
          </h3>
          <p className="text-sm text-blue-800">
            {getExplanation(requiredRole, currentRole)}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <Button className="w-full" variant="default">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>

          {currentRole === 'PATIENT' && requiredRole === 'OWNER' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need access to administrative features?{' '}
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getExplanation(requiredRole: string, currentRole: string): string {
  if (requiredRole === 'OWNER') {
    return 'This page contains sensitive financial and administrative information that is only accessible to the platform owner. This includes operating costs, revenue data, and system-wide statistics.';
  }

  if (requiredRole === 'ADMIN') {
    return 'This page requires administrative privileges. Administrative features include user management, system configuration, and access to aggregated data across all users.';
  }

  if (requiredRole === 'DOCTOR') {
    return 'This page is restricted to medical professionals. If you are a healthcare provider and need access, please contact the administrator to upgrade your account.';
  }

  return `This page requires ${requiredRole} role, but your current role is ${currentRole}. Please contact your administrator if you need access to this resource.`;
}