/**
 * Staff Portal Layout
 * Layout for employee/staff portal with separate navigation
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { EmployeeService } from '@/lib/services/rbac/EmployeeService';
import { StaffSidebar } from '@/components/staff/StaffSidebar';
import { StaffHeader } from '@/components/staff/StaffHeader';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/staff/dashboard');
  }

  // Check if user is an employee
  const employee = await EmployeeService.getEmployeeByUserId(session.user.id);

  if (!employee) {
    // User is not an employee - redirect to patient portal
    redirect('/dashboard?error=not_employee');
  }

  if (employee.employmentStatus !== 'ACTIVE') {
    // Employee account is not active
    redirect('/dashboard?error=employee_inactive');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Staff Header */}
      <StaffHeader employee={employee} />

      <div className="flex">
        {/* Staff Sidebar */}
        <StaffSidebar employee={employee} />

        {/* Main Content */}
        <main className="flex-1 p-8 ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}