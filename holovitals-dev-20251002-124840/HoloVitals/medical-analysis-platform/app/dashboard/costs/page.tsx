'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Zap,
  Server,
  MessageSquare,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CostData {
  date: string;
  chatbot: number;
  optimizer: number;
  queue: number;
  instances: number;
  total: number;
}

export default function CostsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  
  // Mock data - would come from API
  const costData: CostData[] = [
    { date: '2024-09-24', chatbot: 1.20, optimizer: 0.50, queue: 0.30, instances: 2.40, total: 4.40 },
    { date: '2024-09-25', chatbot: 1.50, optimizer: 0.60, queue: 0.40, instances: 3.20, total: 5.70 },
    { date: '2024-09-26', chatbot: 1.80, optimizer: 0.70, queue: 0.50, instances: 2.80, total: 5.80 },
    { date: '2024-09-27', chatbot: 1.40, optimizer: 0.55, queue: 0.35, instances: 3.50, total: 5.80 },
    { date: '2024-09-28', chatbot: 1.60, optimizer: 0.65, queue: 0.45, instances: 2.90, total: 5.60 },
    { date: '2024-09-29', chatbot: 1.90, optimizer: 0.75, queue: 0.55, instances: 3.80, total: 7.00 },
    { date: '2024-09-30', chatbot: 2.10, optimizer: 0.80, queue: 0.60, instances: 4.20, total: 7.70 },
  ];

  const currentTotal = costData[costData.length - 1].total;
  const previousTotal = costData[costData.length - 2].total;
  const percentChange = ((currentTotal - previousTotal) / previousTotal) * 100;

  const stats = {
    today: currentTotal,
    yesterday: previousTotal,
    week: costData.reduce((sum, d) => sum + d.total, 0),
    month: costData.reduce((sum, d) => sum + d.total, 0) * 4.3, // Approximate
    chatbot: costData.reduce((sum, d) => sum + d.chatbot, 0),
    optimizer: costData.reduce((sum, d) => sum + d.optimizer, 0),
    queue: costData.reduce((sum, d) => sum + d.queue, 0),
    instances: costData.reduce((sum, d) => sum + d.instances, 0),
  };

  const savings = {
    tokensSaved: 125000,
    costSaved: 52.30,
    percentSaved: 40,
    instanceSavings: 245.80,
    totalSavings: 298.10,
  };

  const breakdown = [
    { 
      name: 'Chatbot Service', 
      cost: stats.chatbot, 
      percentage: (stats.chatbot / stats.week) * 100,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      name: 'Context Optimizer', 
      cost: stats.optimizer, 
      percentage: (stats.optimizer / stats.week) * 100,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    { 
      name: 'Analysis Queue', 
      cost: stats.queue, 
      percentage: (stats.queue / stats.week) * 100,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      name: 'Cloud Instances', 
      cost: stats.instances, 
      percentage: (stats.instances / stats.week) * 100,
      icon: Server,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
  ];

  const maxCost = Math.max(...costData.map(d => d.total));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cost Dashboard</h1>
          <p className="text-gray-600">Track and optimize your platform costs</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.today.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {percentChange >= 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-red-600" />
                  <span className="text-red-600">+{percentChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">{percentChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-gray-500">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Week
            </CardTitle>
            <Calendar className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.week.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Avg ${(stats.week / 7).toFixed(2)}/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Month (Est.)
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.month.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Projected
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Total Savings
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${savings.totalSavings.toFixed(2)}
            </div>
            <p className="text-xs text-green-700 mt-1">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Trend</CardTitle>
          <CardDescription>Daily cost breakdown over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple bar chart */}
            <div className="flex items-end justify-between h-64 gap-2">
              {costData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1">
                    {/* Stacked bars */}
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${(data.chatbot / maxCost) * 200}px` }}
                      title={`Chatbot: $${data.chatbot.toFixed(2)}`}
                    />
                    <div
                      className="w-full bg-purple-500"
                      style={{ height: `${(data.optimizer / maxCost) * 200}px` }}
                      title={`Optimizer: $${data.optimizer.toFixed(2)}`}
                    />
                    <div
                      className="w-full bg-green-500"
                      style={{ height: `${(data.queue / maxCost) * 200}px` }}
                      title={`Queue: $${data.queue.toFixed(2)}`}
                    />
                    <div
                      className="w-full bg-orange-500"
                      style={{ height: `${(data.instances / maxCost) * 200}px` }}
                      title={`Instances: $${data.instances.toFixed(2)}`}
                    />
                  </div>
                  <div className="text-xs text-gray-600 text-center">
                    {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs font-medium">
                    ${data.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-sm text-gray-600">Chatbot</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span className="text-sm text-gray-600">Optimizer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-gray-600">Queue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span className="text-sm text-gray-600">Instances</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown & Savings */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Spending by service (this week)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${item.cost.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.bgColor.replace('100', '500')}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Savings Summary */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Cost Savings</CardTitle>
            <CardDescription className="text-green-700">
              Your optimization is working!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Context Optimization Savings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Context Optimization</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  ${savings.costSaved.toFixed(2)}
                </span>
              </div>
              <div className="space-y-1 text-sm text-green-800">
                <p>{savings.tokensSaved.toLocaleString()} tokens saved</p>
                <p>{savings.percentSaved}% reduction in AI costs</p>
              </div>
            </div>

            {/* Instance Savings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Ephemeral Instances</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  ${savings.instanceSavings.toFixed(2)}
                </span>
              </div>
              <div className="space-y-1 text-sm text-green-800">
                <p>90% savings vs always-on</p>
                <p>Auto-termination working</p>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-green-300">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-green-900">
                  Total Savings This Week
                </span>
                <span className="text-3xl font-bold text-green-600">
                  ${savings.totalSavings.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Projected monthly savings: ${(savings.totalSavings * 4.3).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Optimization Tips</CardTitle>
          <CardDescription>Ways to reduce your costs further</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Use Local Models</h4>
              <p className="text-sm text-blue-800">
                Switch to Llama 3.2 for non-critical tasks to save on API costs. It's completely free!
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Optimize Context</h4>
              <p className="text-sm text-purple-800">
                Enable aggressive optimization for documents to maximize token savings (up to 60% reduction).
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Batch Processing</h4>
              <p className="text-sm text-green-800">
                Process multiple documents together to reduce instance provisioning overhead.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Auto-Termination</h4>
              <p className="text-sm text-orange-800">
                Set shorter auto-terminate times for instances to avoid unnecessary costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}