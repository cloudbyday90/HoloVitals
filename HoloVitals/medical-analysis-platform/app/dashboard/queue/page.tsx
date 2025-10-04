'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ListTodo,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Task {
  id: string;
  type: 'DOCUMENT_ANALYSIS' | 'CHAT_RESPONSE' | 'BATCH_PROCESSING' | 'REPORT_GENERATION';
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  title: string;
  description: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
}

export default function QueuePage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      type: 'DOCUMENT_ANALYSIS',
      priority: 'HIGH',
      status: 'PROCESSING',
      progress: 65,
      title: 'Analyzing Blood Test Results',
      description: 'Processing Blood_Test_Results_2024.pdf',
      createdAt: new Date('2024-09-30T10:00:00'),
      startedAt: new Date('2024-09-30T10:01:00'),
      estimatedDuration: 120,
      retryCount: 0,
      maxRetries: 3,
    },
    {
      id: '2',
      type: 'CHAT_RESPONSE',
      priority: 'URGENT',
      status: 'PROCESSING',
      progress: 85,
      title: 'Generating AI Response',
      description: 'Answering question about cholesterol levels',
      createdAt: new Date('2024-09-30T10:05:00'),
      startedAt: new Date('2024-09-30T10:05:30'),
      estimatedDuration: 30,
      retryCount: 0,
      maxRetries: 3,
    },
    {
      id: '3',
      type: 'BATCH_PROCESSING',
      priority: 'NORMAL',
      status: 'PENDING',
      progress: 0,
      title: 'Batch Document Processing',
      description: 'Processing 5 medical documents',
      createdAt: new Date('2024-09-30T10:10:00'),
      estimatedDuration: 300,
      retryCount: 0,
      maxRetries: 2,
    },
    {
      id: '4',
      type: 'REPORT_GENERATION',
      priority: 'LOW',
      status: 'COMPLETED',
      progress: 100,
      title: 'Monthly Health Report',
      description: 'Generated comprehensive health summary',
      createdAt: new Date('2024-09-30T09:00:00'),
      startedAt: new Date('2024-09-30T09:01:00'),
      completedAt: new Date('2024-09-30T09:15:00'),
      estimatedDuration: 600,
      actualDuration: 840,
      retryCount: 0,
      maxRetries: 3,
    },
    {
      id: '5',
      type: 'DOCUMENT_ANALYSIS',
      priority: 'HIGH',
      status: 'FAILED',
      progress: 45,
      title: 'MRI Scan Analysis',
      description: 'Failed to process MRI_Scan.pdf',
      createdAt: new Date('2024-09-30T08:30:00'),
      startedAt: new Date('2024-09-30T08:31:00'),
      completedAt: new Date('2024-09-30T08:35:00'),
      estimatedDuration: 180,
      actualDuration: 240,
      retryCount: 3,
      maxRetries: 3,
      errorMessage: 'OCR processing failed: Unable to extract text from image',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  const handleCancelTask = (id: string) => {
    if (confirm('Cancel this task?')) {
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, status: 'CANCELLED' as const } : task
      ));
    }
  };

  const handleRetryTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { 
        ...task, 
        status: 'PENDING' as const, 
        progress: 0,
        retryCount: task.retryCount + 1,
        errorMessage: undefined
      } : task
    ));
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Delete this task?')) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['PENDING', 'PROCESSING'].includes(task.status);
    if (filter === 'completed') return task.status === 'COMPLETED';
    if (filter === 'failed') return task.status === 'FAILED';
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    processing: tasks.filter(t => t.status === 'PROCESSING').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    failed: tasks.filter(t => t.status === 'FAILED').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'PROCESSING':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT_ANALYSIS':
        return '📄';
      case 'CHAT_RESPONSE':
        return '💬';
      case 'BATCH_PROCESSING':
        return '📦';
      case 'REPORT_GENERATION':
        return '📊';
      default:
        return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Analysis Queue</h1>
        <p className="text-gray-600">Monitor and manage your analysis tasks</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tasks
            </CardTitle>
            <ListTodo className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Processing
            </CardTitle>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Failed
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Tasks
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
            <Button
              variant={filter === 'failed' ? 'default' : 'outline'}
              onClick={() => setFilter('failed')}
            >
              Failed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
              <p className="text-gray-600">
                {filter !== 'all' ? 'Try changing the filter' : 'No tasks in the queue'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-3xl">{getTypeIcon(task.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span>Created: {task.createdAt.toLocaleString()}</span>
                          {task.startedAt && (
                            <span>Started: {task.startedAt.toLocaleString()}</span>
                          )}
                          {task.completedAt && (
                            <span>Completed: {task.completedAt.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {['PENDING', 'PROCESSING'].includes(task.status) && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                      {task.estimatedDuration && (
                        <p className="text-xs text-gray-500">
                          Estimated time: {Math.ceil(task.estimatedDuration / 60)} minutes
                        </p>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {task.status === 'FAILED' && task.errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900 mb-1">Error</p>
                          <p className="text-sm text-red-700">{task.errorMessage}</p>
                          <p className="text-xs text-red-600 mt-1">
                            Retry attempts: {task.retryCount}/{task.maxRetries}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Duration Info */}
                  {task.actualDuration && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Duration: {Math.ceil(task.actualDuration / 60)} minutes
                      </span>
                      {task.estimatedDuration && task.actualDuration > task.estimatedDuration && (
                        <span className="text-yellow-600">
                          ({Math.ceil((task.actualDuration - task.estimatedDuration) / 60)} min over estimate)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    {task.status === 'FAILED' && task.retryCount < task.maxRetries && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryTask(task.id)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    )}
                    {['PENDING', 'PROCESSING'].includes(task.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelTask(task.id)}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                    {['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}