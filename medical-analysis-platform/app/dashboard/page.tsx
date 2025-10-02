'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users,
  TrendingUp, 
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Heart,
  Calendar,
  Pill,
  TestTube
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Mock data - will be replaced with real API calls
  const stats = {
    totalPatients: 1247,
    activePatients: 89,
    upcomingAppointments: 12,
    pendingLabResults: 5,
    criticalAlerts: 2,
    healthScore: 87,
  };

  const recentActivity = [
    { id: 1, type: 'patient', title: 'New patient registered: John Doe', time: '2 hours ago', status: 'completed' },
    { id: 2, type: 'lab', title: 'Lab results received for Jane Smith', time: '3 hours ago', status: 'completed' },
    { id: 3, type: 'appointment', title: 'Appointment scheduled with Dr. Johnson', time: '5 hours ago', status: 'completed' },
    { id: 4, type: 'alert', title: 'Critical lab value flagged', time: '6 hours ago', status: 'alert' },
  ];

  const upcomingAppointments = [
    { id: 1, patient: 'Sarah Johnson', time: '10:00 AM', type: 'Follow-up' },
    { id: 2, patient: 'Michael Chen', time: '11:30 AM', type: 'Annual Physical' },
    { id: 3, patient: 'Emily Davis', time: '2:00 PM', type: 'Lab Review' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Welcome back!</h1>
        <p className="text-gray-700">Here's what's happening with your patients today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Patients */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Total Patients
            </CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalPatients}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-green-600">+{stats.activePatients}</span> active this month
            </p>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Appointments
            </CardTitle>
            <Calendar className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</div>
            <p className="text-xs text-gray-600 mt-1">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        {/* Lab Results */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Lab Results
            </CardTitle>
            <TestTube className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingLabResults}</div>
            <p className="text-xs text-gray-600 mt-1">
              Pending review
            </p>
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Avg Health Score
            </CardTitle>
            <Heart className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.healthScore}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-green-600">+3</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {stats.criticalAlerts > 0 && (
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Critical Alerts
            </CardTitle>
            <CardDescription className="text-gray-700">Requires immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">High blood pressure reading</p>
                  <p className="text-sm text-gray-600">Patient: Robert Martinez - 180/110 mmHg</p>
                </div>
                <Button size="sm" variant="destructive">
                  Review
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">Abnormal lab results</p>
                  <p className="text-sm text-gray-600">Patient: Lisa Anderson - Elevated glucose</p>
                </div>
                <Button size="sm" variant="destructive">
                  Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Upcoming Appointments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/patients">
              <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                <Users className="w-4 h-4 mr-2 text-blue-600" />
                Search Patients
                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-500" />
              </Button>
            </Link>
            <Link href="/clinical">
              <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                <FileText className="w-4 h-4 mr-2 text-green-600" />
                View Clinical Data
                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-500" />
              </Button>
            </Link>
            <Link href="/clinical/labs">
              <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                <TestTube className="w-4 h-4 mr-2 text-purple-600" />
                Review Lab Results
                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-500" />
              </Button>
            </Link>
            <Link href="/ai-insights">
              <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                <Activity className="w-4 h-4 mr-2 text-orange-600" />
                AI Health Insights
                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-500" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Today's Appointments</CardTitle>
            <CardDescription className="text-gray-600">Scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{appointment.patient}</p>
                      <p className="text-sm text-gray-600">{appointment.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
              View All Appointments
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Activity</CardTitle>
          <CardDescription className="text-gray-600">Latest updates and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mt-1">
                  {activity.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : activity.status === 'processing' ? (
                    <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Insights Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Platform Health
          </CardTitle>
          <CardDescription className="text-gray-700">Overall system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-1">Data Sync Status</p>
              <p className="text-2xl font-bold text-gray-900">100%</p>
              <p className="text-xs text-green-600 mt-1">All systems operational</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-1">EHR Connections</p>
              <p className="text-2xl font-bold text-gray-900">7/7</p>
              <p className="text-xs text-green-600 mt-1">All providers connected</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-1">AI Analysis</p>
              <p className="text-2xl font-bold text-gray-900">Active</p>
              <p className="text-xs text-green-600 mt-1">Processing insights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}