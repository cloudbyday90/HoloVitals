/**
 * 404 Not Found Page
 * Displayed when a route doesn't exist
 */

import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full">
        {/* 404 Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <FileQuestion className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {/* 404 Title */}
        <h1 className="text-6xl font-bold text-center text-gray-900 mb-2">
          404
        </h1>

        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-center text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="default" className="flex items-center gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </Link>

          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>

        {/* Popular Pages */}
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">
            Popular Pages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/dashboard"
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-center"
            >
              <div className="text-sm font-medium text-gray-900">Dashboard</div>
              <div className="text-xs text-gray-500 mt-1">Overview</div>
            </Link>

            <Link
              href="/dashboard/documents"
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-center"
            >
              <div className="text-sm font-medium text-gray-900">Documents</div>
              <div className="text-xs text-gray-500 mt-1">Manage files</div>
            </Link>

            <Link
              href="/dashboard/chat"
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-center"
            >
              <div className="text-sm font-medium text-gray-900">AI Chat</div>
              <div className="text-xs text-gray-500 mt-1">Get help</div>
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <Link
              href="/support"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}