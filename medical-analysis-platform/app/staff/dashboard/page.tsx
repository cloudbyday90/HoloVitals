/**
 * Staff Dashboard
 * Main dashboard for employee/staff portal
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { EmployeeService } from '@/lib/services/rbac/EmployeeService';
import { DepartmentService } from '@/lib/services/rbac/DepartmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Shield, Activity } from 'lucide-react';

export default async function StaffDashboardPage() {
  const session = await getServerSession(authOptions);
  const employee = await EmployeeService.getEmployeeByUserId(session!.user.id);

  if (!employee) {
    return <div>Employee not found</div>;
  }

  // Get statistics
  const employeeStats = await EmployeeService.getEmployeeStatistics();
  const departmentStats = await DepartmentService.getAllDepartmentStatistics();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {employee.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {employee.jobTitle} • {employee.department.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {employeeStats.activeEmployees} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Departments
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Onboarding
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.onboardingEmployees}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Roles
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.roles.length}</div>
            <p className="text-xs text-muted-foreground">
              {employee.roles[0]?.role.name || 'No roles'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Your Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>Your employee profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Employee ID</p>
              <p className="text-base font-semibold">{employee.employeeId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base font-semibold">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="text-base font-semibold">{employee.department.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Job Title</p>
              <p className="text-base font-semibold">{employee.jobTitle}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Hire Date</p>
              <p className="text-base font-semibold">
                {new Date(employee.hireDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-base font-semibold">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {employee.employmentStatus}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Your Roles & Permissions</CardTitle>
          <CardDescription>Roles assigned to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employee.roles.map((employeeRole) => (
              <div
                key={employeeRole.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-semibold">{employeeRole.role.name}</p>
                  <p className="text-sm text-gray-600">
                    {employeeRole.role.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Level {employeeRole.role.level} • {employeeRole.role.permissions.length} permissions
                  </p>
                </div>
                {employeeRole.isPrimary && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Primary Role
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/staff/employees"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-semibold">Employee Directory</p>
              <p className="text-sm text-gray-600">View all employees</p>
            </a>
            <a
              href="/staff/profile"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Shield className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-semibold">My Profile</p>
              <p className="text-sm text-gray-600">Update your information</p>
            </a>
            <a
              href="/dashboard"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-semibold">Patient Portal</p>
              <p className="text-sm text-gray-600">Switch to patient view</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}