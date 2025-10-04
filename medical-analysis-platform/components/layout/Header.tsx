'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, User, Search, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const router = useRouter();
  const [isEmployee, setIsEmployee] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEmployeeStatus();
  }, []);

  const checkEmployeeStatus = async () => {
    try {
      const response = await fetch('/api/view-mode');
      if (response.ok) {
        const data = await response.json();
        setIsEmployee(data.isEmployee);
      }
    } catch (error) {
      console.error('Failed to check employee status:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchToStaffView = async () => {
    try {
      const response = await fetch('/api/view-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'staff' }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(data.redirectUrl);
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to switch to staff view');
      }
    } catch (error) {
      console.error('Failed to switch view:', error);
      alert('Failed to switch to staff view');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-64 lg:w-96 border border-gray-200">
            <Search className="w-4 h-4 text-gray-700" />
            <input
              type="text"
              placeholder="Search documents, chats..."
              className="bg-transparent border-none outline-none text-sm w-full text-gray-900"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
            {/* Launch Console Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Rocket className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
                <DropdownMenuLabel className="text-gray-900">Launch Console</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                {!loading && isEmployee && (
                  <>
                    <DropdownMenuItem onClick={switchToStaffView} className="focus:bg-gray-100 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <div>
                          <p className="font-medium text-gray-900">Staff Portal</p>
                          <p className="text-xs text-gray-600">Employee access</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200" />
                  </>
                )}
                <DropdownMenuItem asChild className="focus:bg-gray-100">
                  <a href="/admin" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <div>
                        <p className="font-medium text-gray-900">Admin Console</p>
                        <p className="text-xs text-gray-600">Full system access</p>
                      </div>
                    </div>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-gray-100">
                  <a href="/dev" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div>
                        <p className="font-medium text-gray-900">Dev Console</p>
                        <p className="text-xs text-gray-600">Development tools</p>
                      </div>
                    </div>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-900">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              <div className="p-4 text-sm text-gray-700 text-center">
                No new notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-900">
                <div>
                  <p className="font-medium text-gray-900">John Doe</p>
                  <p className="text-xs text-gray-600">john@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem className="text-gray-900 focus:bg-gray-100">Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 focus:bg-gray-100">Settings</DropdownMenuItem>
              <DropdownMenuItem className="text-gray-900 focus:bg-gray-100">Billing</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem className="text-red-600 focus:bg-red-50">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}