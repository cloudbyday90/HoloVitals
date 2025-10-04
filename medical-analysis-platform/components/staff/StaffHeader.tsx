'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, Settings, LogOut, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';

interface StaffHeaderProps {
  employee: any;
}

export function StaffHeader({ employee }: StaffHeaderProps) {
  const router = useRouter();

  const switchToPatientView = async () => {
    try {
      const response = await fetch('/api/view-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'patient' }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(data.redirectUrl);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to switch view:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <Link href="/staff/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HV</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">HoloVitals</h1>
              <p className="text-xs text-gray-600">Staff Portal</p>
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees, departments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Launch Console Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Rocket className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-900">Launch Console</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={switchToPatientView} className="focus:bg-gray-100 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900">Patient Portal</p>
                    <p className="text-xs text-gray-600">Switch to patient view</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
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
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/staff/profile">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {employee.firstName} {employee.lastName}
              </p>
              <p className="text-xs text-gray-600">{employee.jobTitle}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}