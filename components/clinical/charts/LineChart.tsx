'use client';

import React from 'react';
import { ChartDataPoint, ChartConfig } from '@/lib/types/clinical-data';

interface LineChartProps {
  data: ChartDataPoint[];
  config: ChartConfig;
  referenceRange?: {
    low?: number;
    high?: number;
  };
  height?: number;
  className?: string;
}

export function LineChart({
  data,
  config,
  referenceRange,
  height = 300,
  className = '',
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Calculate dimensions
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max values
  const values = data.map(d => d.value);
  const minValue = Math.min(...values, referenceRange?.low || Infinity);
  const maxValue = Math.max(...values, referenceRange?.high || -Infinity);
  const valueRange = maxValue - minValue;
  const yMin = minValue - valueRange * 0.1;
  const yMax = maxValue + valueRange * 0.1;

  // Scale functions
  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

  // Generate path
  const pathData = data
    .map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (for fill under line)
  const areaData = `${pathData} L ${xScale(data.length - 1)} ${chartHeight} L ${xScale(0)} ${chartHeight} Z`;

  // Format date for x-axis
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return yMin + (i / (yTicks - 1)) * (yMax - yMin);
  });

  return (
    <div className={className}>
      {config.title && (
        <h3 className="text-lg font-semibold mb-4">{config.title}</h3>
      )}
      
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {config.showGrid && yTickValues.map((value, i) => (
            <line
              key={i}
              x1={0}
              y1={yScale(value)}
              x2={chartWidth}
              y2={yScale(value)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          ))}

          {/* Reference range */}
          {referenceRange && (
            <>
              {referenceRange.low !== undefined && (
                <>
                  <line
                    x1={0}
                    y1={yScale(referenceRange.low)}
                    x2={chartWidth}
                    y2={yScale(referenceRange.low)}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                  <text
                    x={chartWidth + 5}
                    y={yScale(referenceRange.low)}
                    fill="#10b981"
                    fontSize={12}
                    dominantBaseline="middle"
                  >
                    Low
                  </text>
                </>
              )}
              {referenceRange.high !== undefined && (
                <>
                  <line
                    x1={0}
                    y1={yScale(referenceRange.high)}
                    x2={chartWidth}
                    y2={yScale(referenceRange.high)}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                  <text
                    x={chartWidth + 5}
                    y={yScale(referenceRange.high)}
                    fill="#10b981"
                    fontSize={12}
                    dominantBaseline="middle"
                  >
                    High
                  </text>
                </>
              )}
              {referenceRange.low !== undefined && referenceRange.high !== undefined && (
                <rect
                  x={0}
                  y={yScale(referenceRange.high)}
                  width={chartWidth}
                  height={yScale(referenceRange.low) - yScale(referenceRange.high)}
                  fill="#10b981"
                  opacity={0.1}
                />
              )}
            </>
          )}

          {/* Area under line */}
          <path
            d={areaData}
            fill={config.colors?.[0] || '#3b82f6'}
            opacity={0.1}
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={config.colors?.[0] || '#3b82f6'}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = xScale(index);
            const y = yScale(point.value);
            const isOutOfRange = referenceRange && (
              (referenceRange.low !== undefined && point.value < referenceRange.low) ||
              (referenceRange.high !== undefined && point.value > referenceRange.high)
            );

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill={isOutOfRange ? '#ef4444' : (config.colors?.[0] || '#3b82f6')}
                  stroke="white"
                  strokeWidth={2}
                  className="cursor-pointer hover:r-6 transition-all"
                >
                  <title>{`${formatDate(point.date)}: ${point.value}${point.label ? ` ${point.label}` : ''}`}</title>
                </circle>
              </g>
            );
          })}

          {/* Y-axis */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={chartHeight}
            stroke="#9ca3af"
            strokeWidth={1}
          />

          {/* Y-axis ticks and labels */}
          {yTickValues.map((value, i) => (
            <g key={i}>
              <line
                x1={-5}
                y1={yScale(value)}
                x2={0}
                y2={yScale(value)}
                stroke="#9ca3af"
                strokeWidth={1}
              />
              <text
                x={-10}
                y={yScale(value)}
                fill="#6b7280"
                fontSize={12}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {value.toFixed(1)}
              </text>
            </g>
          ))}

          {/* X-axis */}
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#9ca3af"
            strokeWidth={1}
          />

          {/* X-axis labels */}
          {data.map((point, index) => {
            if (data.length > 10 && index % Math.ceil(data.length / 10) !== 0) return null;
            const x = xScale(index);
            return (
              <text
                key={index}
                x={x}
                y={chartHeight + 20}
                fill="#6b7280"
                fontSize={12}
                textAnchor="middle"
              >
                {formatDate(point.date)}
              </text>
            );
          })}

          {/* Y-axis label */}
          {config.yAxisLabel && (
            <text
              x={-chartHeight / 2}
              y={-40}
              fill="#6b7280"
              fontSize={14}
              textAnchor="middle"
              transform={`rotate(-90, -${chartHeight / 2}, -40)`}
            >
              {config.yAxisLabel}
            </text>
          )}

          {/* X-axis label */}
          {config.xAxisLabel && (
            <text
              x={chartWidth / 2}
              y={chartHeight + 35}
              fill="#6b7280"
              fontSize={14}
              textAnchor="middle"
            >
              {config.xAxisLabel}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}