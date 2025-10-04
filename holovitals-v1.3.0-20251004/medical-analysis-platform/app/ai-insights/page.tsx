'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain,
  Heart,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Calendar,
  Pill,
  TestTube
} from 'lucide-react';
import Link from 'next/link';

export default function AIInsightsPage() {
  // Mock data - will be replaced with real API calls
  const healthScore = 87;
  const riskAssessments = [
    { id: 1, type: 'Cardiovascular', risk: 'Low', score: 15, color: 'green' },
    { id: 2, type: 'Diabetes', risk: 'Moderate', score: 45, color: 'yellow' },
    { id: 3, type: 'Hypertension', risk: 'Low', score: 20, color: 'green' },
  ];

  const insights = [
    {
      id: 1,
      title: 'Your cholesterol levels are improving',
      description: 'Your LDL cholesterol has decreased by 15% over the past 3 months. Keep up the good work with your current diet and exercise routine.',
      type: 'positive',
      date: 'Today',
      icon: CheckCircle2,
      color: 'green',
    },
    {
      id: 2,
      title: 'Blood pressure trending upward',
      description: 'Your blood pressure readings have been slightly elevated over the past 2 weeks. Consider reducing sodium intake and monitoring stress levels.',
      type: 'warning',
      date: 'Yesterday',
      icon: AlertTriangle,
      color: 'yellow',
    },
    {
      id: 3,
      title: 'Time for your annual checkup',
      description: 'It has been 11 months since your last physical exam. Schedule an appointment with your primary care physician.',
      type: 'reminder',
      date: '2 days ago',
      icon: Calendar,
      color: 'blue',
    },
  ];

  const recommendations = [
    {
      id: 1,
      category: 'Exercise',
      title: 'Increase cardiovascular activity',
      description: 'Aim for 150 minutes of moderate aerobic activity per week',
      priority: 'high',
    },
    {
      id: 2,
      category: 'Nutrition',
      title: 'Reduce sodium intake',
      description: 'Limit sodium to less than 2,300mg per day',
      priority: 'medium',
    },
    {
      id: 3,
      category: 'Sleep',
      title: 'Improve sleep consistency',
      description: 'Maintain a regular sleep schedule of 7-9 hours',
      priority: 'medium',
    },
  ];

  const trends = [
    { id: 1, metric: 'Weight', value: '165 lbs', change: '-3 lbs', trend: 'down', color: 'green' },
    { id: 2, metric: 'Blood Pressure', value: '125/82', change: '+5 mmHg', trend: 'up', color: 'yellow' },
    { id: 3, metric: 'Heart Rate', value: '72 bpm', change: '-2 bpm', trend: 'down', color: 'green' },
    { id: 4, metric: 'Blood Sugar', value: '95 mg/dL', change: 'Stable', trend: 'stable', color: 'green' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">AI Health Insights</h1>
        <p className="text-gray-700">Personalized health analysis powered by advanced AI</p>
      </div>

      {/* Health Score Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Heart className="w-6 h-6 text-red-600" />
            Your Health Score
          </CardTitle>
          <CardDescription className="text-gray-700">Overall health assessment based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-6xl font-bold text-gray-900">{healthScore}</div>
              <p className="text-sm text-gray-600 mt-2">Out of 100</p>
              <p className="text-sm text-green-600 mt-1">+3 from last month</p>
            </div>
            <div className="text-right">
              <div className="w-32 h-32 rounded-full border-8 border-blue-600 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">{healthScore}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessments */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Risk Assessments</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {riskAssessments.map((assessment) => (
            <Card key={assessment.id} className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">{assessment.type}</CardTitle>
                <CardDescription className="text-gray-600">Risk Level: {assessment.risk}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{assessment.score}%</div>
                    <p className="text-xs text-gray-600 mt-1">Risk Score</p>
                  </div>
                  <div className={`w-16 h-16 rounded-full bg-${assessment.color}-100 flex items-center justify-center`}>
                    <Activity className={`w-8 h-8 text-${assessment.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Insights */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Recent Insights</h2>
        <div className="space-y-4">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <Card key={insight.id} className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full bg-${insight.color}-100 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 text-${insight.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{insight.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Health Trends */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Health Trends</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {trends.map((trend) => (
            <Card key={trend.id} className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">{trend.metric}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{trend.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className={`w-4 h-4 text-${trend.color}-600 ${trend.trend === 'up' ? '' : 'rotate-180'}`} />
                  <span className={`text-xs text-${trend.color}-600`}>{trend.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Personalized Recommendations</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-gray-900">{rec.category}</CardTitle>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  )}>
                    {rec.priority}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium text-gray-900 mb-2">{rec.title}</h4>
                <p className="text-sm text-gray-600">{rec.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Want more detailed insights?</h3>
              <p className="text-gray-700">Upload more medical documents to get comprehensive AI analysis</p>
            </div>
            <Link href="/dashboard/documents">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Upload Documents
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}