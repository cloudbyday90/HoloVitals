'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  AlertCircle,
  Activity,
  Database,
  FileText,
  TestTube,
  Settings,
  ChevronLeft,
  Menu,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const devNavItems = [
  {
    title: 'Dashboard',
    href: '/dev',
    icon: LayoutDashboard,
  },
  {
    title: 'Error Logs',
    href: '/dev/errors',
    icon: AlertCircle,
  },
  {
    title: 'API Monitoring',
    href: '/dev/api',
    icon: Activity,
  },
  {
    title: 'Database',
    href: '/dev/database',
    icon: Database,
  },
  {
    title: 'System Logs',
    href: '/dev/logs',
    icon: FileText,
  },
  {
    title: 'Testing Tools',
    href: '/dev/testing',
    icon: TestTube,
  },
  {
    title: 'API Docs',
    href: '/dev/docs',
    icon: Code,
  },
  {
    title: 'Settings',
    href: '/dev/settings',
    icon: Settings,
  },
];

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-800"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Developer Console</h1>
              <p className="text-xs text-blue-100">Development & Monitoring Tools</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white hover:bg-blue-800">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-30',
            sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
          )}
        >
          <nav className="p-4 space-y-2">
            {devNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            sidebarOpen ? 'ml-64' : 'ml-0'
          )}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}