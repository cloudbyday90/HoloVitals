'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OnboardingStage } from '@prisma/client';

interface OnboardingRecord {
  id: string;
  currentStage: OnboardingStage;
  invitationToken?: string;
  invitationSentAt?: string;
  completedAt?: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department: {
      name: string;
    };
  };
}

export default function OnboardingPage() {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [stageFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (stageFilter) params.append('stage', stageFilter);

      const response = await fetch(`/api/staff/onboarding?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch onboarding records');
      
      const data = await response.json();
      setRecords(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStageBadgeColor = (stage: OnboardingStage) => {
    switch (stage) {
      case 'INVITATION_SENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCOUNT_CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'PROFILE_COMPLETED':
        return 'bg-indigo-100 text-indigo-800';
      case 'DOCUMENTS_UPLOADED':
        return 'bg-purple-100 text-purple-800';
      case 'TRAINING_STARTED':
        return 'bg-pink-100 text-pink-800';
      case 'TRAINING_COMPLETED':
        return 'bg-orange-100 text-orange-800';
      case 'REVIEW_PENDING':
        return 'bg-red-100 text-red-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageProgress = (stage: OnboardingStage) => {
    const stages = [
      'INVITATION_SENT',
      'ACCOUNT_CREATED',
      'PROFILE_COMPLETED',
      'DOCUMENTS_UPLOADED',
      'TRAINING_STARTED',
      'TRAINING_COMPLETED',
      'REVIEW_PENDING',
      'ACTIVE',
    ];
    const index = stages.indexOf(stage);
    return ((index + 1) / stages.length) * 100;
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
          <h1 className="text-3xl font-bold text-gray-900">Employee Onboarding</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage employee onboarding progress
          </p>
        </div>
        <Link
          href="/staff/onboarding/invite"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Send Invitation
        </Link>
      </div>

      {/* Stage Filter */}
      <div className="mb-6">
        <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
          Filter by Stage
        </label>
        <select
          id="stage"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Stages</option>
          <option value="INVITATION_SENT">Invitation Sent</option>
          <option value="ACCOUNT_CREATED">Account Created</option>
          <option value="PROFILE_COMPLETED">Profile Completed</option>
          <option value="DOCUMENTS_UPLOADED">Documents Uploaded</option>
          <option value="TRAINING_STARTED">Training Started</option>
          <option value="TRAINING_COMPLETED">Training Completed</option>
          <option value="REVIEW_PENDING">Review Pending</option>
          <option value="ACTIVE">Active</option>
        </select>
      </div>

      {records.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-12 text-center">
          <p className="text-sm text-gray-500">No onboarding records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="overflow-hidden bg-white shadow sm:rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {record.employee.firstName} {record.employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{record.employee.email}</p>
                    <p className="text-xs text-gray-400">
                      {record.employee.department.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStageBadgeColor(
                          record.currentStage
                        )}`}
                      >
                        {record.currentStage.replace(/_/g, ' ')}
                      </span>
                      {record.completedAt && (
                        <p className="mt-1 text-xs text-gray-500">
                          Completed: {new Date(record.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/staff/onboarding/${record.id}`}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{Math.round(getStageProgress(record.currentStage))}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${getStageProgress(record.currentStage)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}