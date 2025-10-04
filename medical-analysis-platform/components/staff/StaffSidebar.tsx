'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Building2,
  Shield,
  FileText,
  Settings,
  BarChart3,
  UserPlus,
  ClipboardList,
} from 'lucide-react';

interface StaffSidebarProps {
  employee: any;
}

export function StaffSidebar({ employee }: StaffSidebarProps) {
  const pathname = usePathname();

  // Base navigation for all staff
  const navigation = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: Home },
    { name: 'Employee Directory', href: '/staff/employees', icon: Users },
    { name: 'Departments', href: '/staff/departments', icon: Building2 },
    { name: 'My Profile', href: '/staff/profile', icon: Settings },
  ];

  // Add admin-only items based on roles
  const hasAdminRole = employee.roles.some((r: any) =>
    ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(r.role.code)
  );

  if (hasAdminRole) {
    navigation.push(
      { name: 'Manage Employees', href: '/staff/admin/employees', icon: UserPlus },
      { name: 'Roles & Permissions', href: '/staff/admin/roles', icon: Shield },
      { name: 'Onboarding', href: '/staff/admin/onboarding', icon: ClipboardList },
      { name: 'Audit Logs', href: '/staff/admin/audit', icon: FileText },
      { name: 'Analytics', href: '/staff/admin/analytics', icon: BarChart3 }
    );
  }

  // Add HIPAA compliance items
  const hasHIPAARole = employee.roles.some((r: any) =>
    ['COMPLIANCE_OFFICER', 'PRIVACY_OFFICER', 'SECURITY_OFFICER'].includes(r.role.code)
  );

  if (hasHIPAARole) {
    navigation.push({
      name: 'HIPAA Compliance',
      href: '/staff/hipaa',
      icon: Shield,
    });
  }

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Employee Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="font-semibold text-gray-900">{employee.firstName} {employee.lastName}</p>
          <p>{employee.jobTitle}</p>
          <p className="mt-1">{employee.department.name}</p>
        </div>
      </div>
    </aside>
  );
}