'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, CreditCard, PieChart } from 'lucide-react';

export default function AdminFinancialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Overview</h2>
        <p className="text-gray-600 mt-1">Revenue, costs, and financial analytics</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$45,678</div>
            <p className="text-xs text-gray-600 mt-1">+18% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$12,345</div>
            <p className="text-xs text-gray-600 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Costs</CardTitle>
            <CreditCard className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$8,234</div>
            <p className="text-xs text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Profit Margin</CardTitle>
            <PieChart className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">80.1%</div>
            <p className="text-xs text-green-600 mt-1">Excellent</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Financial Analytics</CardTitle>
          <CardDescription>Coming soon - Detailed financial reports and charts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Management</h3>
            <p className="text-gray-600 mb-4">
              This page will include revenue charts, cost breakdown, subscription analytics, and payment history.
            </p>
            <p className="text-sm text-gray-500">Implementation in progress...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}