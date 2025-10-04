'use client';

import { useState, useEffect } from 'react';
import EmployeeForm from '@/components/staff/EmployeeForm';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  departmentId: string;
  roleId: string;
  employmentType: string;
  startDate: string;
  salary?: number;
  emergencyContact?: any;
}

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/staff/employees/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch employee');
      
      const data = await response.json();
      setEmployee(data);
    } catch (err) {
      console.error('Error fetching employee:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">Employee not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update employee information
        </p>
      </div>

      <EmployeeForm
        initialData={{
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          departmentId: employee.departmentId,
          roleId: employee.roleId,
          employmentType: employee.employmentType as any,
          startDate: employee.startDate.split('T')[0],
          jobTitle: employee.jobTitle,
          salary: employee.salary?.toString(),
          emergencyContact: employee.emergencyContact,
        }}
        isEdit={true}
        employeeId={params.id}
      />
    </div>
  );
}