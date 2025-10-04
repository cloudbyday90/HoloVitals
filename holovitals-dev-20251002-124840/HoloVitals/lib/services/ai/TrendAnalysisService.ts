/**
 * Trend Analysis Service
 * AI-powered trend detection and prediction for health metrics
 */

import { PrismaClient } from '@prisma/client';
import {
  TrendAnalysis,
  TrendDataPoint,
  TrendPrediction,
  Anomaly,
  TrendDirection,
  TimeFrame,
} from '@/lib/types/ai-insights';

const prisma = new PrismaClient();

export class TrendAnalysisService {
  /**
   * Analyze trends for a specific health metric
   */
  async analyzeTrend(
    patientId: string,
    metric: string,
    timeframe: TimeFrame = '90-days'
  ): Promise<TrendAnalysis> {
    // Fetch historical data
    const dataPoints = await this.fetchHistoricalData(patientId, metric, timeframe);

    if (dataPoints.length < 3) {
      throw new Error('Insufficient data points for trend analysis');
    }

    // Determine trend direction
    const trend = this.determineTrendDirection(dataPoints);

    // Calculate change rate
    const changeRate = this.calculateChangeRate(dataPoints);

    // Detect anomalies
    const anomalies = this.detectAnomalies(dataPoints);

    // Generate prediction
    const prediction = this.generatePrediction(dataPoints, trend);

    // Generate insights
    const insights = this.generateInsights(dataPoints, trend, anomalies, changeRate);

    return {
      metric,
      category: this.categorizeMetric(metric),
      timeframe,
      dataPoints,
      trend,
      changeRate,
      prediction,
      anomalies,
      insights,
    };
  }

  /**
   * Analyze multiple metrics at once
   */
  async analyzeMultipleTrends(
    patientId: string,
    metrics: string[],
    timeframe: TimeFrame = '90-days'
  ): Promise<TrendAnalysis[]> {
    const analyses = await Promise.all(
      metrics.map((metric) => this.analyzeTrend(patientId, metric, timeframe))
    );
    return analyses;
  }

  /**
   * Get trending metrics (metrics with significant changes)
   */
  async getTrendingMetrics(
    patientId: string,
    timeframe: TimeFrame = '90-days'
  ): Promise<TrendAnalysis[]> {
    const allMetrics = [
      'blood_pressure_systolic',
      'blood_pressure_diastolic',
      'heart_rate',
      'weight',
      'bmi',
      'glucose',
      'cholesterol',
      'hba1c',
      'triglycerides',
      'hdl',
      'ldl',
    ];

    const analyses = await this.analyzeMultipleTrends(patientId, allMetrics, timeframe);

    // Filter for significant trends (change rate > 10% or anomalies present)
    return analyses.filter(
      (analysis) => Math.abs(analysis.changeRate) > 10 || analysis.anomalies.length > 0
    );
  }

  /**
   * Fetch historical data for a metric
   */
  private async fetchHistoricalData(
    patientId: string,
    metric: string,
    timeframe: TimeFrame
  ): Promise<TrendDataPoint[]> {
    const days = this.timeframeToDays(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let dataPoints: TrendDataPoint[] = [];

    // Fetch from vital signs
    if (this.isVitalSign(metric)) {
      const vitals = await prisma.vitalSigns.findMany({
        where: {
          patientId,
          recordedAt: { gte: startDate },
        },
        orderBy: { recordedAt: 'asc' },
      });

      dataPoints = vitals
        .map((vital) => this.extractVitalSignValue(vital, metric))
        .filter((dp) => dp !== null) as TrendDataPoint[];
    }
    // Fetch from lab results
    else if (this.isLabTest(metric)) {
      const labs = await prisma.labResult.findMany({
        where: {
          patientId,
          resultDate: { gte: startDate },
          testName: { contains: metric, mode: 'insensitive' },
        },
        orderBy: { resultDate: 'asc' },
      });

      dataPoints = labs.map((lab) => ({
        date: lab.resultDate,
        value: parseFloat(lab.value),
        unit: lab.unit,
        source: 'lab',
        confidence: 1.0,
      }));
    }

    return dataPoints;
  }

  /**
   * Determine trend direction using linear regression
   */
  private determineTrendDirection(dataPoints: TrendDataPoint[]): TrendDirection {
    if (dataPoints.length < 2) return 'stable';

    // Calculate linear regression slope
    const n = dataPoints.length;
    const xValues = dataPoints.map((_, i) => i);
    const yValues = dataPoints.map((dp) => dp.value);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Calculate variance to determine if fluctuating
    const mean = sumY / n;
    const variance = yValues.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / mean) * 100;

    // If high variation, consider fluctuating
    if (coefficientOfVariation > 15) {
      return 'fluctuating';
    }

    // Determine direction based on slope
    const avgValue = mean;
    const slopeThreshold = avgValue * 0.01; // 1% threshold

    if (Math.abs(slope) < slopeThreshold) {
      return 'stable';
    } else if (slope > 0) {
      return 'improving'; // Assuming higher is better (context-dependent)
    } else {
      return 'declining';
    }
  }

  /**
   * Calculate percentage change rate
   */
  private calculateChangeRate(dataPoints: TrendDataPoint[]): number {
    if (dataPoints.length < 2) return 0;

    const firstValue = dataPoints[0].value;
    const lastValue = dataPoints[dataPoints.length - 1].value;

    if (firstValue === 0) return 0;

    return ((lastValue - firstValue) / firstValue) * 100;
  }

  /**
   * Detect anomalies using statistical methods
   */
  private detectAnomalies(dataPoints: TrendDataPoint[]): Anomaly[] {
    if (dataPoints.length < 5) return [];

    const anomalies: Anomaly[] = [];

    // Calculate mean and standard deviation
    const values = dataPoints.map((dp) => dp.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Use modified Z-score method (more robust to outliers)
    const median = this.calculateMedian(values);
    const mad = this.calculateMAD(values, median);

    dataPoints.forEach((dp, index) => {
      // Calculate modified Z-score
      const modifiedZScore = 0.6745 * (dp.value - median) / mad;

      // Threshold of 3.5 for anomaly detection
      if (Math.abs(modifiedZScore) > 3.5) {
        const expectedValue = this.calculateExpectedValue(dataPoints, index);
        const deviation = ((dp.value - expectedValue) / expectedValue) * 100;

        anomalies.push({
          date: dp.date,
          value: dp.value,
          expectedValue,
          deviation,
          severity: this.classifyAnomalySeverity(Math.abs(deviation)),
          possibleCauses: this.suggestAnomalyCauses(dp.value, expectedValue),
          requiresAction: Math.abs(deviation) > 30,
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate prediction for next value
   */
  private generatePrediction(
    dataPoints: TrendDataPoint[],
    trend: TrendDirection
  ): TrendPrediction {
    if (dataPoints.length < 3) {
      return {
        nextValue: dataPoints[dataPoints.length - 1].value,
        confidence: 0.3,
        timeframe: '7 days',
        methodology: 'Insufficient data',
        factors: [],
      };
    }

    // Use exponential smoothing for prediction
    const alpha = 0.3; // Smoothing factor
    let smoothedValue = dataPoints[0].value;

    for (let i = 1; i < dataPoints.length; i++) {
      smoothedValue = alpha * dataPoints[i].value + (1 - alpha) * smoothedValue;
    }

    // Calculate trend component
    const recentValues = dataPoints.slice(-5).map((dp) => dp.value);
    const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const trendComponent = recentMean - smoothedValue;

    // Predict next value
    const nextValue = smoothedValue + trendComponent;

    // Calculate confidence based on data consistency
    const variance = this.calculateVariance(dataPoints.map((dp) => dp.value));
    const mean = dataPoints.reduce((sum, dp) => sum + dp.value, 0) / dataPoints.length;
    const cv = Math.sqrt(variance) / mean;
    const confidence = Math.max(0.3, Math.min(0.95, 1 - cv));

    return {
      nextValue: Math.max(0, nextValue), // Ensure non-negative
      confidence,
      timeframe: '7 days',
      methodology: 'Exponential Smoothing with Trend Component',
      factors: this.identifyPredictionFactors(dataPoints, trend),
    };
  }

  /**
   * Generate insights from trend analysis
   */
  private generateInsights(
    dataPoints: TrendDataPoint[],
    trend: TrendDirection,
    anomalies: Anomaly[],
    changeRate: number
  ): string[] {
    const insights: string[] = [];

    // Trend insight
    if (trend === 'improving') {
      insights.push(`Positive trend detected with ${Math.abs(changeRate).toFixed(1)}% improvement`);
    } else if (trend === 'declining') {
      insights.push(`Declining trend detected with ${Math.abs(changeRate).toFixed(1)}% decrease`);
    } else if (trend === 'fluctuating') {
      insights.push('High variability detected - consider more consistent monitoring');
    } else {
      insights.push('Stable trend - values remain consistent');
    }

    // Anomaly insights
    if (anomalies.length > 0) {
      const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical');
      if (criticalAnomalies.length > 0) {
        insights.push(`${criticalAnomalies.length} critical anomalies detected requiring immediate attention`);
      } else {
        insights.push(`${anomalies.length} anomalies detected - review for potential causes`);
      }
    }

    // Data quality insight
    if (dataPoints.length < 10) {
      insights.push('Limited data points - more frequent monitoring recommended for better analysis');
    }

    // Consistency insight
    const avgConfidence = dataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / dataPoints.length;
    if (avgConfidence < 0.8) {
      insights.push('Data quality concerns detected - verify measurement accuracy');
    }

    // Recent change insight
    if (dataPoints.length >= 5) {
      const recentChange = this.calculateRecentChange(dataPoints);
      if (Math.abs(recentChange) > 15) {
        insights.push(`Significant recent change of ${recentChange.toFixed(1)}% in last measurements`);
      }
    }

    return insights;
  }

  /**
   * Helper methods
   */

  private timeframeToDays(timeframe: TimeFrame): number {
    const mapping: Record<TimeFrame, number> = {
      '7-days': 7,
      '30-days': 30,
      '90-days': 90,
      '6-months': 180,
      '1-year': 365,
      'all-time': 3650, // 10 years
    };
    return mapping[timeframe];
  }

  private isVitalSign(metric: string): boolean {
    const vitalSigns = [
      'blood_pressure_systolic',
      'blood_pressure_diastolic',
      'heart_rate',
      'respiratory_rate',
      'temperature',
      'oxygen_saturation',
      'weight',
      'height',
      'bmi',
    ];
    return vitalSigns.includes(metric.toLowerCase());
  }

  private isLabTest(metric: string): boolean {
    const labTests = [
      'glucose',
      'cholesterol',
      'hba1c',
      'triglycerides',
      'hdl',
      'ldl',
      'creatinine',
      'hemoglobin',
      'white_blood_cell',
      'platelet',
    ];
    return labTests.some((test) => metric.toLowerCase().includes(test));
  }

  private extractVitalSignValue(vital: any, metric: string): TrendDataPoint | null {
    const metricMap: Record<string, string> = {
      blood_pressure_systolic: 'bloodPressureSystolic',
      blood_pressure_diastolic: 'bloodPressureDiastolic',
      heart_rate: 'heartRate',
      respiratory_rate: 'respiratoryRate',
      temperature: 'temperature',
      oxygen_saturation: 'oxygenSaturation',
      weight: 'weight',
      height: 'height',
      bmi: 'bmi',
    };

    const field = metricMap[metric.toLowerCase()];
    if (!field || !vital[field]) return null;

    return {
      date: vital.recordedAt,
      value: parseFloat(vital[field]),
      unit: this.getUnitForMetric(metric),
      source: 'vital-signs',
      confidence: 1.0,
    };
  }

  private getUnitForMetric(metric: string): string {
    const units: Record<string, string> = {
      blood_pressure_systolic: 'mmHg',
      blood_pressure_diastolic: 'mmHg',
      heart_rate: 'bpm',
      respiratory_rate: 'breaths/min',
      temperature: '°F',
      oxygen_saturation: '%',
      weight: 'lbs',
      height: 'in',
      bmi: 'kg/m²',
      glucose: 'mg/dL',
      cholesterol: 'mg/dL',
      hba1c: '%',
      triglycerides: 'mg/dL',
      hdl: 'mg/dL',
      ldl: 'mg/dL',
    };
    return units[metric.toLowerCase()] || '';
  }

  private categorizeMetric(metric: string): string {
    if (this.isVitalSign(metric)) return 'Vital Signs';
    if (this.isLabTest(metric)) return 'Laboratory Results';
    return 'Other';
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateMAD(values: number[], median: number): number {
    const deviations = values.map((val) => Math.abs(val - median));
    return this.calculateMedian(deviations);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateExpectedValue(dataPoints: TrendDataPoint[], index: number): number {
    // Use moving average of surrounding points
    const windowSize = 3;
    const start = Math.max(0, index - windowSize);
    const end = Math.min(dataPoints.length, index + windowSize + 1);
    const window = dataPoints.slice(start, end).filter((_, i) => i !== index - start);
    
    if (window.length === 0) return dataPoints[index].value;
    
    return window.reduce((sum, dp) => sum + dp.value, 0) / window.length;
  }

  private classifyAnomalySeverity(deviation: number): Anomaly['severity'] {
    if (deviation > 50) return 'critical';
    if (deviation > 30) return 'significant';
    if (deviation > 15) return 'moderate';
    return 'minor';
  }

  private suggestAnomalyCauses(value: number, expectedValue: number): string[] {
    const causes: string[] = [];

    if (value > expectedValue) {
      causes.push('Measurement error or equipment malfunction');
      causes.push('Recent lifestyle changes (diet, exercise, stress)');
      causes.push('Medication changes or non-adherence');
      causes.push('Acute illness or infection');
    } else {
      causes.push('Measurement error or equipment malfunction');
      causes.push('Medication effectiveness');
      causes.push('Improved lifestyle habits');
      causes.push('Dehydration or fasting state');
    }

    return causes;
  }

  private identifyPredictionFactors(
    dataPoints: TrendDataPoint[],
    trend: TrendDirection
  ): string[] {
    const factors: string[] = [];

    factors.push(`Historical trend: ${trend}`);
    factors.push(`Data points analyzed: ${dataPoints.length}`);

    const recentValues = dataPoints.slice(-5);
    const consistency = this.calculateConsistency(recentValues.map((dp) => dp.value));
    factors.push(`Recent consistency: ${consistency > 0.8 ? 'High' : consistency > 0.5 ? 'Moderate' : 'Low'}`);

    return factors;
  }

  private calculateConsistency(values: number[]): number {
    if (values.length < 2) return 1;
    const variance = this.calculateVariance(values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const cv = Math.sqrt(variance) / mean;
    return Math.max(0, 1 - cv);
  }

  private calculateRecentChange(dataPoints: TrendDataPoint[]): number {
    const recentPoints = dataPoints.slice(-5);
    if (recentPoints.length < 2) return 0;

    const firstValue = recentPoints[0].value;
    const lastValue = recentPoints[recentPoints.length - 1].value;

    if (firstValue === 0) return 0;

    return ((lastValue - firstValue) / firstValue) * 100;
  }
}

export default new TrendAnalysisService();