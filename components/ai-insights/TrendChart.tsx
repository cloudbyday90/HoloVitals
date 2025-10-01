'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { TrendAnalysis } from '@/lib/types/ai-insights';

interface TrendChartProps {
  trend: TrendAnalysis;
  loading?: boolean;
}

export function TrendChart({ trend, loading = false }: TrendChartProps) {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const { metric, dataPoints, trend: direction, changeRate, prediction, anomalies, insights } = trend;

  const getTrendIcon = () => {
    if (direction === 'improving') return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (direction === 'declining') return <TrendingDown className="h-5 w-5 text-red-600" />;
    if (direction === 'fluctuating') return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (direction === 'improving') return 'text-green-600';
    if (direction === 'declining') return 'text-red-600';
    if (direction === 'fluctuating') return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getChangeColor = () => {
    if (changeRate > 0) return 'text-red-600';
    if (changeRate < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  // Calculate chart dimensions
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find min and max values
  const values = dataPoints.map(dp => dp.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Create scale functions
  const xScale = (index: number) => (index / (dataPoints.length - 1)) * innerWidth;
  const yScale = (value: number) => innerHeight - ((value - minValue) / valueRange) * innerHeight;

  // Generate path for line chart
  const linePath = dataPoints
    .map((dp, i) => {
      const x = xScale(i);
      const y = yScale(dp.value);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Generate area path
  const areaPath = `${linePath} L ${xScale(dataPoints.length - 1)} ${innerHeight} L ${xScale(0)} ${innerHeight} Z`;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize">{metric.replace(/_/g, ' ')}</CardTitle>
            <CardDescription>{trend.timeframe} trend analysis</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {direction.charAt(0).toUpperCase() + direction.slice(1)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="w-full overflow-x-auto">
          <svg width={chartWidth} height={chartHeight} className="mx-auto">
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = innerHeight * ratio;
                return (
                  <line
                    key={ratio}
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Area fill */}
              <path
                d={areaPath}
                fill="url(#gradient)"
                opacity={0.3}
              />

              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {dataPoints.map((dp, i) => {
                const x = xScale(i);
                const y = yScale(dp.value);
                const isAnomaly = anomalies.some(a => 
                  new Date(a.date).getTime() === new Date(dp.date).getTime()
                );

                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isAnomaly ? 6 : 4}
                      fill={isAnomaly ? '#ef4444' : '#3b82f6'}
                      stroke="white"
                      strokeWidth={2}
                    />
                    {isAnomaly && (
                      <circle
                        cx={x}
                        cy={y}
                        r={8}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    )}
                  </g>
                );
              })}

              {/* Y-axis labels */}
              {[0, 0.5, 1].map((ratio) => {
                const y = innerHeight * ratio;
                const value = maxValue - (valueRange * ratio);
                return (
                  <text
                    key={ratio}
                    x={-10}
                    y={y}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fontSize={12}
                    fill="#6b7280"
                  >
                    {value.toFixed(1)}
                  </text>
                );
              })}

              {/* X-axis labels (first, middle, last) */}
              {[0, Math.floor(dataPoints.length / 2), dataPoints.length - 1].map((index) => {
                if (index >= dataPoints.length) return null;
                const x = xScale(index);
                const date = new Date(dataPoints[index].date);
                return (
                  <text
                    key={index}
                    x={x}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#6b7280"
                  >
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                );
              })}
            </g>

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-600">Change Rate</p>
            <p className={`text-lg font-semibold ${getChangeColor()}`}>
              {changeRate > 0 ? '+' : ''}{changeRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Data Points</p>
            <p className="text-lg font-semibold text-gray-900">{dataPoints.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Anomalies</p>
            <p className="text-lg font-semibold text-gray-900">{anomalies.length}</p>
          </div>
        </div>

        {/* Prediction */}
        {prediction && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Predicted Next Value</p>
                <p className="text-lg font-semibold text-blue-600">
                  {prediction.nextValue.toFixed(1)} {dataPoints[0]?.unit}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Confidence: {(prediction.confidence * 100).toFixed(0)}% • {prediction.timeframe}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Detected Anomalies</h4>
            {anomalies.slice(0, 3).map((anomaly, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(anomaly.date).toLocaleDateString()}
                  </p>
                  <Badge variant="destructive" className="text-xs">
                    {anomaly.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Value: {anomaly.value.toFixed(1)} (Expected: {anomaly.expectedValue.toFixed(1)})
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Deviation: {Math.abs(anomaly.deviation).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Key Insights</h4>
            <ul className="space-y-1">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}