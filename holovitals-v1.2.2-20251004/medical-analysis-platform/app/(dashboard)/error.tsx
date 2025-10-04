'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Database, RefreshCw, Terminal } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  const isDatabaseError = error.message?.includes('PrismaClient') || 
                          error.message?.includes('database') ||
                          error.message?.includes('connect ECONNREFUSED');

  if (isDatabaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-gray-900">Database Not Available</CardTitle>
                <CardDescription className="text-gray-600">
                  The application cannot connect to the database
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                PostgreSQL database is not running or not accessible
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Terminal className="h-4 w-4 mr-2" />
                Quick Setup Instructions
              </h3>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg space-y-2 text-sm font-mono">
                <p className="text-gray-400"># Option 1: Using Docker (Recommended)</p>
                <p>docker run -d --name holovitals-postgres \</p>
                <p className="pl-4">-p 5432:5432 \</p>
                <p className="pl-4">-e POSTGRES_PASSWORD=holovitals_dev_password_2024 \</p>
                <p className="pl-4">postgres:15</p>
                
                <p className="text-gray-400 mt-4"># Create databases</p>
                <p>docker exec holovitals-postgres psql -U postgres \</p>
                <p className="pl-4">-c "CREATE DATABASE holovitals;"</p>
                <p>docker exec holovitals-postgres psql -U postgres \</p>
                <p className="pl-4">-c "CREATE DATABASE holovitals_shadow;"</p>
                
                <p className="text-gray-400 mt-4"># Run migrations</p>
                <p>cd medical-analysis-platform</p>
                <p>npx prisma migrate dev</p>
                
                <p className="text-gray-400 mt-4"># Restart the application</p>
                <p>npm run dev</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Alternative: Local PostgreSQL</h4>
                <p className="text-sm text-blue-800">
                  If you prefer to install PostgreSQL locally, download it from{' '}
                  <a 
                    href="https://www.postgresql.org/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600"
                  >
                    postgresql.org/download
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={reset} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
            </div>

            <div className="text-xs text-gray-500 pt-2">
              <p><strong>Error Details:</strong> {error.message}</p>
              {error.digest && <p><strong>Error ID:</strong> {error.digest}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generic error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <CardTitle className="text-gray-900">Something went wrong</CardTitle>
              <CardDescription className="text-gray-600">
                An unexpected error occurred
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </Button>
          </div>

          {error.digest && (
            <div className="text-xs text-gray-500">
              <p><strong>Error ID:</strong> {error.digest}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}