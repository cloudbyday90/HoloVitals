'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
  BarChart3,
  Shield,
  Database,
  Activity,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Financials',
    href: '/admin/financials',
    icon: DollarSign,
  },
  {
    title: 'Beta Management',
    href: '/admin/beta',
    icon: Shield,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'System Health',
    href: '/admin/system',
    icon: Activity,
  },
  {
    title: 'Database',
    href: '/admin/database',
    icon: Database,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-red-800"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Admin Console</h1>
              <p className="text-xs text-red-100">Full System Access</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white hover:bg-red-800 text-sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex relative">
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 z-50 w-64',
            'lg:translate-x-0 lg:static lg:z-30',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Close button for mobile */}
          <div className="lg:hidden flex justify-end p-4 border-b border-gray-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeSidebar}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="p-4 space-y-2 overflow-y-auto h-full">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={closeSidebar}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-red-50 text-red-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full lg:w-auto min-w-0">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}