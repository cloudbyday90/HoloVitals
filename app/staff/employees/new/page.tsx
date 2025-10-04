'use client';

import EmployeeForm from '@/components/staff/EmployeeForm';

export default function NewEmployeePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new employee record in the system
        </p>
      </div>

      <EmployeeForm />
    </div>
  );
}