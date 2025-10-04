'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Activity, Server, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusData {
  totalCost: number;
  activeTasks: number;
  activeInstances: number;
  lastUpdate: string;
}

export default function StatusBar() {
  const [status, setStatus] = useState<StatusData>({
    totalCost: 0,
    activeTasks: 0,
    activeInstances: 0,
    lastUpdate: new Date().toLocaleTimeString(),
  });

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString(),
      }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className={cn(
        'flex items-center justify-between px-4 py-2 text-sm',
        'lg:ml-64 transition-all duration-300'
      )}>
        {/* Left Section - Status Indicators */}
        <div className="flex items-center gap-4">
          {/* Online Status */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isOnline ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-gray-600 hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Active Tasks */}
          <div className="flex items-center gap-2 text-gray-600">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">
              {status.activeTasks} active {status.activeTasks === 1 ? 'task' : 'tasks'}
            </span>
            <span className="sm:hidden">{status.activeTasks}</span>
          </div>

          {/* Active Instances */}
          <div className="flex items-center gap-2 text-gray-600">
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">
              {status.activeInstances} {status.activeInstances === 1 ? 'instance' : 'instances'}
            </span>
            <span className="sm:hidden">{status.activeInstances}</span>
          </div>
        </div>

        {/* Right Section - Cost & Time */}
        <div className="flex items-center gap-4">
          {/* Total Cost */}
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">
              ${status.totalCost.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 hidden md:inline">today</span>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2 text-gray-500 text-xs hidden lg:flex">
            <Clock className="w-3 h-3" />
            <span>Updated {status.lastUpdate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}