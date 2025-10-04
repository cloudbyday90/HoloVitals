'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Heart, Activity, Brain, Droplet, Dumbbell } from 'lucide-react';
import { HealthScore } from '@/lib/types/ai-insights';

interface HealthScoreCardProps {
  healthScore: HealthScore;
  loading?: boolean;
}

export function HealthScoreCard({ healthScore, loading = false }: HealthScoreCardProps) {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Health Score</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { overall, categories, trend, lastUpdated } = healthScore;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 75) return 'bg-blue-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getTrendIcon = () => {
    if (trend === 'improving') return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  const getTrendText = () => {
    if (trend === 'improving') return 'Improving';
    if (trend === 'declining') return 'Declining';
    return 'Stable';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardiovascular':
        return <Heart className="h-5 w-5" />;
      case 'metabolic':
        return <Activity className="h-5 w-5" />;
      case 'respiratory':
        return <Droplet className="h-5 w-5" />;
      case 'mental':
        return <Brain className="h-5 w-5" />;
      case 'lifestyle':
        return <Dumbbell className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Overall Health Score</CardTitle>
            <CardDescription>
              Last updated: {new Date(lastUpdated).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm font-medium">{getTrendText()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center justify-center">
          <div className={`relative w-40 h-40 rounded-full ${getScoreBackground(overall)} flex items-center justify-center`}>
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(overall)}`}>
                {overall}
              </div>
              <div className="text-sm text-gray-600 mt-1">out of 100</div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Health Categories</h3>
          
          {Object.entries(categories).map(([key, category]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(key)}
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={category.status === 'excellent' ? 'default' : category.status === 'good' ? 'secondary' : 'destructive'}>
                    {category.grade}
                  </Badge>
                  <span className={`text-sm font-semibold ${getScoreColor(category.score)}`}>
                    {category.score}
                  </span>
                </div>
              </div>
              <Progress value={category.score} className="h-2" />
              <div className="text-xs text-gray-600">
                {category.contributors.slice(0, 2).join(' • ')}
              </div>
            </div>
          ))}
        </div>

        {/* Key Factors */}
        {healthScore.factors && healthScore.factors.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Key Health Factors</h3>
            <div className="space-y-2">
              {healthScore.factors.slice(0, 5).map((factor, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className={factor.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                    {factor.impact === 'positive' ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700">{factor.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}