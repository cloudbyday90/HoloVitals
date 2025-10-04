'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Heart,
  Brain,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Mock data - will be replaced with real API calls
  const stats = {
    documents: 12,
    aiConversations: 8,
    healthInsights: 15,
    healthScore: 87,
    tokensSaved: 45000,
    costSaved: 18.50,
  };

  const recentActivity = [
    { id: 1, type: 'document', title: 'Blood Test Results.pdf uploaded', time: '2 hours ago', status: 'completed' },
    { id: 2, type: 'chat', title: 'Asked about cholesterol levels', time: '3 hours ago', status: 'completed' },
    { id: 3, type: 'insight', title: 'New health insight generated', time: '5 hours ago', status: 'completed' },
    { id: 4, type: 'document', title: 'MRI Report.pdf analyzed', time: '6 hours ago', status: 'completed' },
  ];

  const healthInsights = [
    { id: 1, title: 'Your cholesterol levels are improving', type: 'positive', date: 'Today' },
    { id: 2, title: 'Consider scheduling your annual checkup', type: 'reminder', date: 'Yesterday' },
    { id: 3, title: 'Blood pressure readings are stable', type: 'positive', date: '2 days ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Welcome back!</h1>
        <p className="text-gray-700">Here's your personal health overview and AI insights.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Documents */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              My Documents
            </CardTitle>
            <FileText className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.documents}</div>
            <p className="text-xs text-gray-600 mt-1">
              Medical records uploaded
            </p>
          </CardContent>
        </Card>

        {/* AI Conversations */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              AI Conversations
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.aiConversations}</div>
            <p className="text-xs text-gray-600 mt-1">
              Questions answered
            </p>
          </CardContent>
        </Card>

        {/* Health Insights */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Health Insights
            </CardTitle>
            <Brain className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.healthInsights}</div>
            <p className="text-xs text-gray-600 mt-1">
              AI-generated insights
            </p>
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Health Score
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

      {/* Cost Savings Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Your Savings
          </CardTitle>
          <CardDescription className="text-gray-700">Smart AI optimization is saving you money!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-700 mb-1">AI Tokens Saved</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.tokensSaved.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-1">40% reduction in costs</p>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-1">Money Saved</p>
              <p className="text-3xl font-bold text-gray-900">
                ${stats.costSaved}
              </p>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & AI Insights */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600">What would you like to do?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/documents">
              <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Upload Medical Document
                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-500" />
              </Button>
            </Link>
            <Link href="/dashboard/chat">
              <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                Ask AI About My Health
                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-500" />
              </Button>
            </Link>
            <Link href="/ai-insights">
              <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-600" />
                View AI Health Insights
                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-500" />
              </Button>
            </Link>
            <Link href="/clinical">
              <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
                <Activity className="w-4 h-4 mr-2 text-green-600" />
                View My Health Data
                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-500" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent AI Insights */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent AI Insights</CardTitle>
            <CardDescription className="text-gray-600">Personalized health insights for you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="mt-1">
                    {insight.type === 'positive' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : insight.type === 'reminder' ? (
                      <Clock className="w-4 h-4 text-blue-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{insight.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-900 border-gray-300">
              View All Insights
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Activity</CardTitle>
          <CardDescription className="text-gray-600">Your latest actions and updates</CardDescription>
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
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
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
    </div>
  );
}