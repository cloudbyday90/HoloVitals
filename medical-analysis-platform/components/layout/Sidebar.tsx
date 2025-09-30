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
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'AI Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Queue', href: '/dashboard/queue', icon: ListTodo },
  { name: 'Instances', href: '/dashboard/instances', icon: Server },
  { name: 'Costs', href: '/dashboard/costs', icon: DollarSign },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col',
          'bg-white border-r border-gray-200 transition-all duration-300',
          isOpen ? 'lg:w-64' : 'lg:w-20'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {isOpen ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HoloVitals
              </span>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  'hover:bg-gray-100',
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700',
                  !isOpen && 'justify-center'
                )}
                title={!isOpen ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={onToggle}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg w-full',
              'hover:bg-gray-100 text-gray-700 transition-colors',
              !isOpen && 'justify-center'
            )}
          >
            {isOpen ? (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}