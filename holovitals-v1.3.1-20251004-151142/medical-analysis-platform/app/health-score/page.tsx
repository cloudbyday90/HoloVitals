'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Heart,
  TrendingUp,
  TrendingDown,
  Activity,
  Utensils,
  Moon,
  Dumbbell,
  Brain,
  Droplet,
  Wind,
  Target,
  Award,
  Calendar,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function HealthScorePage() {
  const overallScore = 87;
  const previousScore = 84;
  const scoreChange = overallScore - previousScore;

  const categoryScores = [
    { id: 1, category: 'Cardiovascular', score: 92, icon: Heart, color: 'red', trend: 'up', change: 3 },
    { id: 2, category: 'Metabolic', score: 85, icon: Activity, color: 'green', trend: 'up', change: 2 },
    { id: 3, category: 'Nutrition', score: 78, icon: Utensils, color: 'orange', trend: 'down', change: -1 },
    { id: 4, category: 'Sleep', score: 82, icon: Moon, color: 'purple', trend: 'stable', change: 0 },
    { id: 5, category: 'Exercise', score: 90, icon: Dumbbell, color: 'blue', trend: 'up', change: 5 },
    { id: 6, category: 'Mental Health', score: 88, icon: Brain, color: 'pink', trend: 'up', change: 2 },
  ];

  const scoreHistory = [
    { month: 'Jan', score: 78 },
    { month: 'Feb', score: 80 },
    { month: 'Mar', score: 79 },
    { month: 'Apr', score: 82 },
    { month: 'May', score: 84 },
    { month: 'Jun', score: 87 },
  ];

  const achievements = [
    { id: 1, title: 'Health Champion', description: 'Maintained score above 85 for 3 months', icon: Award, unlocked: true },
    { id: 2, title: 'Consistency King', description: 'Logged health data for 30 consecutive days', icon: Calendar, unlocked: true },
    { id: 3, title: 'Improvement Star', description: 'Increased score by 10 points', icon: TrendingUp, unlocked: false },
  ];

  const recommendations = [
    {
      id: 1,
      title: 'Improve Nutrition Score',
      description: 'Focus on increasing vegetable intake and reducing processed foods',
      impact: '+5 points',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Maintain Exercise Routine',
      description: 'Your exercise score is excellent. Keep up the great work!',
      impact: 'Maintain',
      priority: 'low',
    },
    {
      id: 3,
      title: 'Optimize Sleep Schedule',
      description: 'Try to maintain consistent sleep and wake times',
      impact: '+3 points',
      priority: 'medium',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Health Score</h1>
        <p className="text-gray-700">Track your overall health and wellness over time</p>
      </div>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Overall Health Score</h2>
              <p className="text-gray-700 mb-4">Based on comprehensive health data analysis</p>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                {scoreChange > 0 ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">+{scoreChange} points from last month</span>
                  </>
                ) : scoreChange < 0 ? (
                  <>
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <span className="text-red-600 font-medium">{scoreChange} points from last month</span>
                  </>
                ) : (
                  <span className="text-gray-600 font-medium">No change from last month</span>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="w-48 h-48 rounded-full border-8 border-blue-600 flex items-center justify-center bg-white shadow-lg">
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600">{overallScore}</div>
                  <div className="text-sm text-gray-600">out of 100</div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Score Breakdown</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoryScores.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id} className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-gray-900">{category.category}</CardTitle>
                    <div className={`w-10 h-10 rounded-full bg-${category.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${category.color}-600`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{category.score}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {category.trend === 'up' ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">+{category.change}</span>
                          </>
                        ) : category.trend === 'down' ? (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600">{category.change}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-600">No change</span>
                        )}
                      </div>
                    </div>
                    <div className="w-16 h-16">
                      <svg className="transform -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${category.score} 100`}
                          className={`text-${category.color}-600`}
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Score History */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Score History</CardTitle>
          <CardDescription className="text-gray-600">Your health score over the past 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {scoreHistory.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-blue-100 rounded-t-lg relative" style={{ height: `${(item.score / 100) * 100}%` }}>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-gray-900">
                    {item.score}
                  </div>
                </div>
                <span className="text-sm text-gray-600">{item.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Achievements</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <Card key={achievement.id} className={cn(
                'border-2',
                achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300' : 'bg-gray-50 border-gray-200'
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      achievement.unlocked ? 'bg-yellow-400' : 'bg-gray-300'
                    )}>
                      <Icon className={cn(
                        'w-6 h-6',
                        achievement.unlocked ? 'text-white' : 'text-gray-500'
                      )} />
                    </div>
                    <div className="flex-1">
                      <h3 className={cn(
                        'font-semibold mb-1',
                        achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                      )}>
                        {achievement.title}
                      </h3>
                      <p className={cn(
                        'text-sm',
                        achievement.unlocked ? 'text-gray-700' : 'text-gray-500'
                      )}>
                        {achievement.description}
                      </p>
                      {achievement.unlocked && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-yellow-200 text-yellow-800">
                          Unlocked
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Recommendations to Improve Your Score</h2>
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">{rec.impact}</div>
                    <div className="text-xs text-gray-500">Potential</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Want to improve your score?</h3>
              <p className="text-gray-700">Get personalized AI insights and recommendations</p>
            </div>
            <Link href="/ai-insights">
              <Button className="bg-purple-600 hover:bg-purple-700">
                View AI Insights
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