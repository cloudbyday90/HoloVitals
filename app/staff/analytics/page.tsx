'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  terminatedEmployees: number;
  departmentStats: Array<{
    name: string;
    count: number;
    budget?: number;
  }>;
  roleStats: Array<{
    name: string;
    count: number;
  }>;
  onboardingStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
  recentActivity: Array<{
    action: string;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call a dedicated analytics API
      // For now, we'll fetch data from multiple endpoints
      const [employeesRes, departmentsRes, rolesRes, onboardingRes] = await Promise.all([
        fetch('/api/staff/employees'),
        fetch('/api/staff/departments'),
        fetch('/api/staff/roles'),
        fetch('/api/staff/onboarding'),
      ]);

      const employees = await employeesRes.json();
      const departments = await departmentsRes.json();
      const roles = await rolesRes.json();
      const onboarding = await onboardingRes.json();

      // Calculate statistics
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter((e: any) => e.status === 'ACTIVE').length;
      const onLeaveEmployees = employees.filter((e: any) => e.status === 'ON_LEAVE').length;
      const terminatedEmployees = employees.filter((e: any) => e.status === 'TERMINATED').length;

      const departmentStats = departments.map((dept: any) => ({
        name: dept.name,
        count: dept._count?.employees || 0,
        budget: dept.budget,
      }));

      const roleStats = roles.map((role: any) => ({
        name: role.name,
        count: role._count?.employees || 0,
      }));

      const onboardingStats = {
        total: onboarding.length,
        completed: onboarding.filter((o: any) => o.currentStage === 'ACTIVE').length,
        inProgress: onboarding.filter((o: any) => o.currentStage !== 'ACTIVE').length,
      };

      setData({
        totalEmployees,
        activeEmployees,
        onLeaveEmployees,
        terminatedEmployees,
        departmentStats,
        roleStats,
        onboardingStats,
        recentActivity: [],
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error || 'Failed to load analytics'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Staff Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of employee statistics and organizational metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Total Employees</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {data.totalEmployees}
            </dd>
          </div>
        </div>

        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Active</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">
              {data.activeEmployees}
            </dd>
          </div>
        </div>

        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">On Leave</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-600">
              {data.onLeaveEmployees}
            </dd>
          </div>
        </div>

        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Terminated</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600">
              {data.terminatedEmployees}
            </dd>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Department Statistics */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Employees by Department
            </h3>
            <div className="mt-4 space-y-4">
              {data.departmentStats.map((dept) => (
                <div key={dept.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{dept.name}</span>
                    <span className="text-gray-500">
                      {dept.count} employees
                      {dept.budget && ` • ${formatCurrency(dept.budget)}`}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-600"
                      style={{
                        width: `${(dept.count / data.totalEmployees) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Statistics */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Employees by Role
            </h3>
            <div className="mt-4 space-y-4">
              {data.roleStats
                .filter((role) => role.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((role) => (
                  <div key={role.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{role.name}</span>
                      <span className="text-gray-500">{role.count} employees</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-indigo-600"
                        style={{
                          width: `${(role.count / data.totalEmployees) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Onboarding Statistics */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Onboarding Progress
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Total Onboarding</span>
                <span className="text-2xl font-semibold text-gray-900">
                  {data.onboardingStats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Completed</span>
                <span className="text-lg font-semibold text-green-600">
                  {data.onboardingStats.completed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">In Progress</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {data.onboardingStats.inProgress}
                </span>
              </div>
              {data.onboardingStats.total > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-gray-500">Completion Rate</div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-green-600"
                      style={{
                        width: `${
                          (data.onboardingStats.completed / data.onboardingStats.total) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-right text-xs text-gray-500">
                    {Math.round(
                      (data.onboardingStats.completed / data.onboardingStats.total) * 100
                    )}
                    %
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}