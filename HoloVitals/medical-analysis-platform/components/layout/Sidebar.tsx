'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  ListTodo, 
  Server, 
  DollarSign, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Lock,
  Sparkles,
  Users,
  Activity,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OwnerOnly, AdminOnly } from '@/components/ui/RoleGuard';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home, public: true },
  { name: 'AI Insights', href: '/dashboard/ai-insights', icon: Sparkles, public: true },
  { name: 'Patients', href: '/dashboard/patients', icon: Users, public: true },
  { name: 'Clinical Data', href: '/dashboard/clinical', icon: Activity, public: true },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText, public: true },
  { name: 'AI Chat', href: '/dashboard/chat', icon: MessageSquare, public: true },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard, public: true },
  { name: 'Queue', href: '/dashboard/queue', icon: ListTodo, adminOnly: true },
  { name: 'Instances', href: '/dashboard/instances', icon: Server, adminOnly: true },
  { name: 'Beta Codes', href: '/dashboard/admin/beta-codes', icon: Settings, adminOnly: true },
  { name: 'Costs', href: '/dashboard/costs', icon: DollarSign, ownerOnly: true },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">HoloVitals</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            // Render public items
            if (item.public) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            }

            // Render owner-only items
            if (item.ownerOnly) {
              return (
                <OwnerOnly key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    <Lock className="w-3 h-3 text-gray-400" />
                  </Link>
                </OwnerOnly>
              );
            }

            // Render admin-only items
            if (item.adminOnly) {
              return (
                <AdminOnly key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    <Lock className="w-3 h-3 text-gray-400" />
                  </Link>
                </AdminOnly>
              );
            }

            return null;
          })}
        </nav>

        {/* Settings (bottom) */}
        <div className="border-t border-gray-200 p-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}