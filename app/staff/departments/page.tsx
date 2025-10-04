'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  costCenter?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    employees: number;
  };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      
      const data = await response.json();
      setDepartments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deptId: string, deptName: string) => {
    if (!confirm(`Are you sure you want to delete the department "${deptName}"?`)) return;

    try {
      const response = await fetch(`/api/staff/departments/${deptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete department');

      fetchDepartments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage organizational departments and their budgets
          </p>
        </div>
        <Link
          href="/staff/departments/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Create Department
        </Link>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-12 text-center">
          <p className="text-sm text-gray-500">No departments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="overflow-hidden bg-white shadow sm:rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {dept.name}
                </h3>
                {dept.description && (
                  <p className="mt-1 text-sm text-gray-500">{dept.description}</p>
                )}
                
                <dl className="mt-4 space-y-2">
                  {dept.manager && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Manager</dt>
                      <dd className="text-sm text-gray-900">
                        {dept.manager.firstName} {dept.manager.lastName}
                      </dd>
                    </div>
                  )}
                  
                  {dept.budget && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Budget</dt>
                      <dd className="text-sm text-gray-900">
                        {formatCurrency(dept.budget)}
                      </dd>
                    </div>
                  )}
                  
                  {dept.costCenter && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Cost Center</dt>
                      <dd className="text-sm text-gray-900">{dept.costCenter}</dd>
                    </div>
                  )}
                  
                  {dept._count && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Employees</dt>
                      <dd className="text-sm text-gray-900">
                        {dept._count.employees}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-6 flex gap-2">
                  <Link
                    href={`/staff/departments/${dept.id}`}
                    className="flex-1 rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    View
                  </Link>
                  <Link
                    href={`/staff/departments/${dept.id}/edit`}
                    className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(dept.id, dept.name)}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}