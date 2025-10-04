'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  level: number;
  parentRoleId?: string;
  parentRole?: {
    id: string;
    name: string;
  };
  permissions: Permission[];
  _count?: {
    employees: number;
  };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      
      const data = await response.json();
      setRoles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;

    try {
      const response = await fetch(`/api/staff/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete role');

      fetchRoles();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Build role hierarchy
  const buildHierarchy = (roles: Role[]): Role[] => {
    const roleMap = new Map<string, Role & { children: Role[] }>();
    const rootRoles: (Role & { children: Role[] })[] = [];

    // Initialize all roles with children array
    roles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] });
    });

    // Build hierarchy
    roles.forEach(role => {
      const roleWithChildren = roleMap.get(role.id)!;
      if (role.parentRoleId) {
        const parent = roleMap.get(role.parentRoleId);
        if (parent) {
          parent.children.push(roleWithChildren);
        } else {
          rootRoles.push(roleWithChildren);
        }
      } else {
        rootRoles.push(roleWithChildren);
      }
    });

    return rootRoles;
  };

  const RoleCard = ({ role, depth = 0 }: { role: Role & { children?: Role[] }; depth?: number }) => (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : 'mt-4'}`}>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {role.name}
                <span className="ml-2 text-sm text-gray-500">Level {role.level}</span>
              </h3>
              {role.description && (
                <p className="mt-1 text-sm text-gray-500">{role.description}</p>
              )}
              {role.parentRole && (
                <p className="mt-1 text-xs text-gray-400">
                  Reports to: {role.parentRole.name}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/staff/roles/${role.id}`}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                View
              </Link>
              <Link
                href={`/staff/roles/${role.id}/edit`}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(role.id, role.name)}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              {role.permissions.length} permissions
            </div>
            {role._count && (
              <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                {role._count.employees} employees
              </div>
            )}
          </div>
        </div>
      </div>
      {role.children && role.children.length > 0 && (
        <div>
          {role.children.map((child) => (
            <RoleCard key={child.id} role={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

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

  const hierarchy = buildHierarchy(roles);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage roles and their associated permissions
          </p>
        </div>
        <Link
          href="/staff/roles/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Create Role
        </Link>
      </div>

      {roles.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-12 text-center">
          <p className="text-sm text-gray-500">No roles found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hierarchy.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}