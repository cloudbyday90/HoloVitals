'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp,
  Heart,
  Apple,
  Dumbbell,
  Moon,
  Brain,
  Shield,
  Pill,
  Activity
} from 'lucide-react';
import { PersonalizedRecommendations, Recommendation } from '@/lib/types/ai-insights';

interface RecommendationsPanelProps {
  recommendations: PersonalizedRecommendations;
  loading?: boolean;
  onUpdateStatus?: (recommendationId: string, status: Recommendation['status']) => void;
}

export function RecommendationsPanel({ 
  recommendations, 
  loading = false,
  onUpdateStatus 
}: RecommendationsPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { categories, priorityActions, generatedDate } = recommendations;

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="outline" className="text-green-600">Easy</Badge>;
      case 'moderate':
        return <Badge variant="outline" className="text-yellow-600">Moderate</Badge>;
      case 'challenging':
        return <Badge variant="outline" className="text-red-600">Challenging</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'lifestyle':
        return <Heart className="h-5 w-5" />;
      case 'nutrition':
        return <Apple className="h-5 w-5" />;
      case 'exercise':
        return <Dumbbell className="h-5 w-5" />;
      case 'sleep':
        return <Moon className="h-5 w-5" />;
      case 'stress management':
        return <Brain className="h-5 w-5" />;
      case 'preventive care':
        return <Shield className="h-5 w-5" />;
      case 'medication adherence':
        return <Pill className="h-5 w-5" />;
      case 'monitoring':
        return <Activity className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  const handleStatusChange = (recommendationId: string, completed: boolean) => {
    if (onUpdateStatus) {
      onUpdateStatus(recommendationId, completed ? 'completed' : 'pending');
    }
  };

  const RecommendationCard = ({ recommendation }: { recommendation: Recommendation }) => {
    const isExpanded = expandedIds.has(recommendation.id);
    const isCompleted = recommendation.status === 'completed';

    return (
      <div className={`border rounded-lg p-4 ${isCompleted ? 'bg-gray-50' : 'bg-white'}`}>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => handleStatusChange(recommendation.id, checked as boolean)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className={`font-semibold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {recommendation.title}
              </h4>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={getPriorityColor(recommendation.priority)}>
                  {recommendation.priority}
                </Badge>
                {getDifficultyBadge(recommendation.difficulty)}
              </div>
            </div>

            <p className={`text-sm mb-2 ${isCompleted ? 'text-gray-500' : 'text-gray-600'}`}>
              {recommendation.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
              <span>⏱️ {recommendation.timeframe}</span>
              <span>📈 {recommendation.expectedBenefit}</span>
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-3 pt-3 border-t">
                {/* Action Steps */}
                {recommendation.steps.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Action Steps:</p>
                    <ol className="space-y-1">
                      {recommendation.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-blue-600 font-medium">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Evidence */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Evidence Level</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {recommendation.evidence.level.replace(/-/g, ' ')}
                    </Badge>
                    <span className="text-xs text-gray-600">
                      Confidence: {recommendation.evidence.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(recommendation.id)}
              className="mt-2 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Details
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Personalized Health Recommendations</CardTitle>
        <CardDescription>
          Generated on {new Date(generatedDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Priority Actions */}
        {priorityActions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              Top Priority Actions
            </h3>
            <div className="space-y-2">
              {priorityActions.map((action) => (
                <RecommendationCard key={action.id} recommendation={action} />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <Tabs defaultValue={categories[0]?.name || 'all'} className="w-full">
          <TabsList className="w-full flex-wrap h-auto">
            {categories.map((category) => (
              <TabsTrigger
                key={category.name}
                value={category.name}
                className="flex items-center gap-2"
              >
                {getCategoryIcon(category.name)}
                <span>{category.name}</span>
                <Badge variant="secondary" className="ml-1">
                  {category.recommendations.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.name} value={category.name} className="space-y-4 mt-4">
              {/* Category Progress */}
              {category.progress !== undefined && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Category Progress</span>
                    <span className="text-sm font-semibold text-blue-600">{category.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${category.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-3">
                {category.recommendations.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-8">
                    No recommendations in this category
                  </p>
                ) : (
                  category.recommendations.map((recommendation) => (
                    <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {categories.reduce((sum, cat) => sum + cat.recommendations.length, 0)}
            </p>
            <p className="text-xs text-gray-600">Total Recommendations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {categories.reduce((sum, cat) => 
                sum + cat.recommendations.filter(r => r.status === 'completed').length, 0
              )}
            </p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {categories.reduce((sum, cat) => 
                sum + cat.recommendations.filter(r => r.status === 'in-progress').length, 0
              )}
            </p>
            <p className="text-xs text-gray-600">In Progress</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}