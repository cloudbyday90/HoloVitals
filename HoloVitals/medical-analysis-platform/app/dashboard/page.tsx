'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  DollarSign,
  Server,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Mock data - will be replaced with real API calls
  const stats = {
    documents: 12,
    conversations: 8,
    activeTasks: 3,
    activeInstances: 1,
    todayCost: 2.45,
    monthlyCost: 67.89,
    tokensSaved: 45000,
    costSaved: 18.50,
  };

  const recentActivity = [
    { id: 1, type: 'document', title: 'Blood Test Results.pdf', time: '2 hours ago', status: 'completed' },
    { id: 2, type: 'chat', title: 'Analysis of cholesterol levels', time: '3 hours ago', status: 'completed' },
    { id: 3, type: 'task', title: 'Document processing', time: '5 hours ago', status: 'processing' },
    { id: 4, type: 'instance', title: 'Azure NC6 provisioned', time: '6 hours ago', status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-gray-600">Here's what's happening with your medical analysis platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Documents
            </CardTitle>
            <FileText className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600">+2</span> from last week
            </p>
          </CardContent>
        </Card>

        {/* Conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              AI Conversations
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600">+3</span> from last week
            </p>
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Tasks
            </CardTitle>
            <Activity className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeInstances} instance running
            </p>
          </CardContent>
        </Card>

        {/* Today's Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today's Cost
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todayCost}</div>
            <p className="text-xs text-gray-500 mt-1">
              ${stats.monthlyCost} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Savings Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Cost Savings
          </CardTitle>
          <CardDescription>Your optimization is working!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tokens Saved</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.tokensSaved.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">40% reduction</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Cost Saved</p>
              <p className="text-3xl font-bold text-green-600">
                ${stats.costSaved}
              </p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/documents">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Upload Document
                <ArrowUpRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/dashboard/chat">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start AI Chat
                <ArrowUpRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/dashboard/instances">
              <Button variant="outline" className="w-full justify-start">
                <Server className="w-4 h-4 mr-2" />
                Provision Instance
                <ArrowUpRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/dashboard/costs">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                View Cost Report
                <ArrowUpRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    {activity.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : activity.status === 'processing' ? (
                      <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>All systems operational</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">Chatbot Service</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">Context Optimizer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">Analysis Queue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">Instance Provisioner</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}