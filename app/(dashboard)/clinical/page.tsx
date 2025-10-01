'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/lib/types/clinical-data';
import {
  FlaskConical,
  Pill,
  Activity,
  AlertCircle,
  FileText,
  Calendar,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ClinicalDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/clinical/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const quickStats = [
    {
      title: 'Lab Results',
      value: stats?.totalLabResults || 0,
      recent: stats?.recentLabResults || 0,
      icon: FlaskConical,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/clinical/labs',
    },
    {
      title: 'Abnormal Results',
      value: stats?.abnormalResults || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/clinical/labs?filter=abnormal',
    },
    {
      title: 'Active Medications',
      value: stats?.activeMedications || 0,
      icon: Pill,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/clinical/medications',
    },
    {
      title: 'Active Conditions',
      value: stats?.activeConditions || 0,
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      href: '/clinical/conditions',
    },
    {
      title: 'Allergies',
      value: stats?.allergies || 0,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      href: '/clinical/allergies',
    },
    {
      title: 'Recent Documents',
      value: stats?.recentDocuments || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/clinical/documents',
    },
    {
      title: 'Upcoming Appointments',
      value: stats?.upcomingAppointments || 0,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      href: '/clinical/appointments',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Clinical Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your health records
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.recent !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.recent} in last 30 days
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link href="/clinical/labs">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" />
                  View Lab Results
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/clinical/medications">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Manage Medications
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/clinical/timeline">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Health Timeline
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/clinical/documents">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  View Documents
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Health Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Health Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Health</span>
              <span className="text-sm font-medium">Good</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Checkup</span>
              <span className="text-sm font-medium">2 months ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next Appointment</span>
              <span className="text-sm font-medium">Not scheduled</span>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Schedule Checkup
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/clinical/timeline">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats && stats.recentLabResults > 0 && (
              <div className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FlaskConical className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New lab results available</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.recentLabResults} new result{stats.recentLabResults > 1 ? 's' : ''} in the last 30 days
                  </p>
                </div>
                <Link href="/clinical/labs">
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </div>
            )}
            {stats && stats.recentDocuments > 0 && (
              <div className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New documents available</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.recentDocuments} new document{stats.recentDocuments > 1 ? 's' : ''} in the last 30 days
                  </p>
                </div>
                <Link href="/clinical/documents">
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </div>
            )}
            {(!stats || (stats.recentLabResults === 0 && stats.recentDocuments === 0)) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}