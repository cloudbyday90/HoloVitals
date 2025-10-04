/**
 * AI Health Insights Service
 * Unified service that orchestrates all AI-powered health analysis
 */

import HealthRiskAssessmentService from './HealthRiskAssessmentService';
import TrendAnalysisService from './TrendAnalysisService';
import MedicationInteractionService from './MedicationInteractionService';
import LabResultInterpreterService from './LabResultInterpreterService';
import PersonalizedRecommendationsService from './PersonalizedRecommendationsService';

import {
  GenerateInsightsRequest,
  GenerateInsightsResponse,
  HealthScore,
  CategoryScore,
  TimeFrame,
} from '@/lib/types/ai-insights';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AIHealthInsightsService {
  /**
   * Generate comprehensive health insights for a patient
   */
  async generateComprehensiveInsights(
    request: GenerateInsightsRequest
  ): Promise<GenerateInsightsResponse> {
    const startTime = Date.now();
    const {
      patientId,
      includeRiskAssessment = true,
      includeTrendAnalysis = true,
      includeMedicationInteraction = true,
      includeLabInterpretation = true,
      includeRecommendations = true,
      timeframe = '90-days',
    } = request;

    try {
      // Fetch patient data for health score calculation
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          vitalSigns: {
            orderBy: { recordedAt: 'desc' },
            take: 10,
          },
          labResults: {
            orderBy: { resultDate: 'desc' },
            take: 50,
          },
          medications: {
            where: { status: 'active' },
          },
          conditions: {
            where: { clinicalStatus: 'active' },
          },
        },
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Calculate health score
      const healthScore = await this.calculateHealthScore(patient);

      // Generate insights in parallel for better performance
      const [
        riskAssessment,
        trends,
        medicationInteractions,
        labInterpretations,
        recommendations,
      ] = await Promise.all([
        includeRiskAssessment
          ? HealthRiskAssessmentService.generateRiskAssessment(patientId)
          : Promise.resolve(undefined),
        includeTrendAnalysis
          ? TrendAnalysisService.getTrendingMetrics(patientId, timeframe)
          : Promise.resolve(undefined),
        includeMedicationInteraction
          ? MedicationInteractionService.analyzeMedicationInteractions(patientId)
          : Promise.resolve(undefined),
        includeLabInterpretation
          ? this.getRecentLabInterpretations(patientId)
          : Promise.resolve(undefined),
        includeRecommendations
          ? PersonalizedRecommendationsService.generateRecommendations(patientId)
          : Promise.resolve(undefined),
      ]);

      const processingTime = Date.now() - startTime;

      // Calculate total data points analyzed
      const dataPoints = this.calculateDataPoints(
        patient,
        trends,
        labInterpretations
      );

      // Calculate overall confidence
      const confidence = this.calculateConfidence(
        riskAssessment,
        trends,
        medicationInteractions,
        labInterpretations
      );

      return {
        success: true,
        data: {
          healthScore,
          riskAssessment,
          trends,
          medicationInteractions,
          labInterpretations,
          recommendations,
        },
        metadata: {
          generatedAt: new Date(),
          processingTime,
          dataPoints,
          confidence,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        metadata: {
          generatedAt: new Date(),
          processingTime: Date.now() - startTime,
          dataPoints: 0,
          confidence: 0,
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Calculate overall health score
   */
  private async calculateHealthScore(patient: any): Promise<HealthScore> {
    // Calculate category scores
    const cardiovascular = await this.calculateCardiovascularScore(patient);
    const metabolic = await this.calculateMetabolicScore(patient);
    const respiratory = await this.calculateRespiratoryScore(patient);
    const mental = await this.calculateMentalScore(patient);
    const lifestyle = await this.calculateLifestyleScore(patient);

    // Calculate overall score (weighted average)
    const overall = Math.round(
      cardiovascular.score * 0.25 +
      metabolic.score * 0.25 +
      respiratory.score * 0.15 +
      mental.score * 0.15 +
      lifestyle.score * 0.20
    );

    // Determine trend
    const trend = await this.determineHealthTrend(patient);

    // Identify key factors
    const factors = this.identifyHealthFactors(
      cardiovascular,
      metabolic,
      respiratory,
      mental,
      lifestyle
    );

    return {
      overall,
      categories: {
        cardiovascular,
        metabolic,
        respiratory,
        mental,
        lifestyle,
      },
      trend,
      lastUpdated: new Date(),
      factors,
    };
  }

  /**
   * Calculate cardiovascular health score
   */
  private async calculateCardiovascularScore(patient: any): Promise<CategoryScore> {
    let score = 100;
    const contributors: string[] = [];
    const recommendations: string[] = [];

    const latestVitals = patient.vitalSigns[0];

    // Blood pressure
    if (latestVitals?.bloodPressureSystolic) {
      const systolic = latestVitals.bloodPressureSystolic;
      if (systolic >= 140) {
        score -= 20;
        contributors.push('Elevated blood pressure');
        recommendations.push('Blood pressure management');
      } else if (systolic >= 130) {
        score -= 10;
        contributors.push('Borderline blood pressure');
      } else {
        contributors.push('Normal blood pressure');
      }
    }

    // Cholesterol
    const cholesterol = this.getLatestLabValue(patient.labResults, 'cholesterol');
    if (cholesterol) {
      if (cholesterol >= 240) {
        score -= 20;
        contributors.push('High cholesterol');
        recommendations.push('Cholesterol management');
      } else if (cholesterol >= 200) {
        score -= 10;
        contributors.push('Borderline cholesterol');
      } else {
        contributors.push('Healthy cholesterol');
      }
    }

    // Heart rate
    if (latestVitals?.heartRate) {
      const hr = latestVitals.heartRate;
      if (hr > 100 || hr < 60) {
        score -= 5;
        contributors.push('Abnormal heart rate');
      }
    }

    // Smoking
    if (patient.smokingStatus === 'current') {
      score -= 25;
      contributors.push('Current smoker');
      recommendations.push('Smoking cessation');
    }

    // Exercise
    if (patient.physicalActivity === 'sedentary') {
      score -= 15;
      contributors.push('Sedentary lifestyle');
      recommendations.push('Increase physical activity');
    }

    const grade = this.scoreToGrade(score);
    const status = this.scoreToStatus(score);

    return {
      score: Math.max(0, score),
      grade,
      status,
      contributors,
      recommendations,
    };
  }

  /**
   * Calculate metabolic health score
   */
  private async calculateMetabolicScore(patient: any): Promise<CategoryScore> {
    let score = 100;
    const contributors: string[] = [];
    const recommendations: string[] = [];

    const latestVitals = patient.vitalSigns[0];

    // BMI
    if (latestVitals?.bmi) {
      const bmi = latestVitals.bmi;
      if (bmi >= 30) {
        score -= 25;
        contributors.push('Obesity');
        recommendations.push('Weight management program');
      } else if (bmi >= 25) {
        score -= 15;
        contributors.push('Overweight');
        recommendations.push('Healthy weight goal');
      } else if (bmi >= 18.5) {
        contributors.push('Healthy weight');
      } else {
        score -= 10;
        contributors.push('Underweight');
      }
    }

    // Glucose
    const glucose = this.getLatestLabValue(patient.labResults, 'glucose');
    if (glucose) {
      if (glucose >= 126) {
        score -= 30;
        contributors.push('Diabetic range glucose');
        recommendations.push('Diabetes management');
      } else if (glucose >= 100) {
        score -= 15;
        contributors.push('Prediabetic range glucose');
        recommendations.push('Diabetes prevention');
      } else {
        contributors.push('Normal glucose');
      }
    }

    // HbA1c
    const hba1c = this.getLatestLabValue(patient.labResults, 'hba1c');
    if (hba1c) {
      if (hba1c >= 6.5) {
        score -= 30;
        contributors.push('Diabetic range HbA1c');
      } else if (hba1c >= 5.7) {
        score -= 15;
        contributors.push('Prediabetic range HbA1c');
      } else {
        contributors.push('Normal HbA1c');
      }
    }

    const grade = this.scoreToGrade(score);
    const status = this.scoreToStatus(score);

    return {
      score: Math.max(0, score),
      grade,
      status,
      contributors,
      recommendations,
    };
  }

  /**
   * Calculate respiratory health score
   */
  private async calculateRespiratoryScore(patient: any): Promise<CategoryScore> {
    let score = 100;
    const contributors: string[] = [];
    const recommendations: string[] = [];

    // Smoking
    if (patient.smokingStatus === 'current') {
      score -= 40;
      contributors.push('Active smoking');
      recommendations.push('Immediate smoking cessation');
    } else if (patient.smokingStatus === 'former') {
      score -= 10;
      contributors.push('Former smoker');
    } else {
      contributors.push('Non-smoker');
    }

    // Respiratory conditions
    const hasAsthma = patient.conditions.some((c: any) => c.code?.includes('J45'));
    const hasCOPD = patient.conditions.some((c: any) => c.code?.includes('J44'));

    if (hasCOPD) {
      score -= 30;
      contributors.push('COPD diagnosis');
      recommendations.push('COPD management');
    } else if (hasAsthma) {
      score -= 15;
      contributors.push('Asthma diagnosis');
      recommendations.push('Asthma control');
    }

    // Oxygen saturation
    const latestVitals = patient.vitalSigns[0];
    if (latestVitals?.oxygenSaturation) {
      const o2 = latestVitals.oxygenSaturation;
      if (o2 < 90) {
        score -= 30;
        contributors.push('Low oxygen saturation');
      } else if (o2 < 95) {
        score -= 10;
        contributors.push('Borderline oxygen saturation');
      } else {
        contributors.push('Normal oxygen saturation');
      }
    }

    const grade = this.scoreToGrade(score);
    const status = this.scoreToStatus(score);

    return {
      score: Math.max(0, score),
      grade,
      status,
      contributors,
      recommendations,
    };
  }

  /**
   * Calculate mental health score
   */
  private async calculateMentalScore(patient: any): Promise<CategoryScore> {
    let score = 100;
    const contributors: string[] = [];
    const recommendations: string[] = [];

    // Stress level
    if (patient.stressLevel === 'high') {
      score -= 25;
      contributors.push('High stress level');
      recommendations.push('Stress management techniques');
    } else if (patient.stressLevel === 'moderate') {
      score -= 10;
      contributors.push('Moderate stress level');
    } else {
      contributors.push('Low stress level');
    }

    // Sleep quality
    if (patient.sleepQuality === 'poor') {
      score -= 20;
      contributors.push('Poor sleep quality');
      recommendations.push('Sleep hygiene improvement');
    } else if (patient.sleepQuality === 'fair') {
      score -= 10;
      contributors.push('Fair sleep quality');
    } else {
      contributors.push('Good sleep quality');
    }

    // Mental health conditions
    const hasDepression = patient.conditions.some((c: any) => c.code?.includes('F32') || c.code?.includes('F33'));
    const hasAnxiety = patient.conditions.some((c: any) => c.code?.includes('F41'));

    if (hasDepression) {
      score -= 20;
      contributors.push('Depression diagnosis');
      recommendations.push('Mental health support');
    }

    if (hasAnxiety) {
      score -= 15;
      contributors.push('Anxiety diagnosis');
      recommendations.push('Anxiety management');
    }

    const grade = this.scoreToGrade(score);
    const status = this.scoreToStatus(score);

    return {
      score: Math.max(0, score),
      grade,
      status,
      contributors,
      recommendations,
    };
  }

  /**
   * Calculate lifestyle score
   */
  private async calculateLifestyleScore(patient: any): Promise<CategoryScore> {
    let score = 100;
    const contributors: string[] = [];
    const recommendations: string[] = [];

    // Physical activity
    if (patient.physicalActivity === 'sedentary') {
      score -= 30;
      contributors.push('Sedentary lifestyle');
      recommendations.push('Increase physical activity');
    } else if (patient.physicalActivity === 'light') {
      score -= 15;
      contributors.push('Light physical activity');
      recommendations.push('Increase exercise intensity');
    } else if (patient.physicalActivity === 'moderate') {
      score -= 5;
      contributors.push('Moderate physical activity');
    } else {
      contributors.push('Active lifestyle');
    }

    // Smoking
    if (patient.smokingStatus === 'current') {
      score -= 30;
      contributors.push('Current smoker');
      recommendations.push('Smoking cessation');
    }

    // Alcohol
    if (patient.alcoholConsumption === 'heavy') {
      score -= 20;
      contributors.push('Heavy alcohol use');
      recommendations.push('Reduce alcohol consumption');
    } else if (patient.alcoholConsumption === 'moderate') {
      score -= 5;
      contributors.push('Moderate alcohol use');
    }

    // Diet quality (simplified - would need more data in production)
    const latestVitals = patient.vitalSigns[0];
    if (latestVitals?.bmi >= 30) {
      score -= 15;
      contributors.push('Poor diet quality (inferred from BMI)');
      recommendations.push('Improve diet quality');
    }

    const grade = this.scoreToGrade(score);
    const status = this.scoreToStatus(score);

    return {
      score: Math.max(0, score),
      grade,
      status,
      contributors,
      recommendations,
    };
  }

  /**
   * Helper methods
   */

  private getLatestLabValue(labResults: any[], testName: string): number | null {
    const result = labResults.find((lab) =>
      lab.testName.toLowerCase().includes(testName.toLowerCase())
    );
    return result ? parseFloat(result.value) : null;
  }

  private scoreToGrade(score: number): CategoryScore['grade'] {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private scoreToStatus(score: number): CategoryScore['status'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  private async determineHealthTrend(patient: any): Promise<HealthScore['trend']> {
    // Compare recent health scores (simplified - would need historical data)
    // For now, return stable
    return 'stable';
  }

  private identifyHealthFactors(
    cardiovascular: CategoryScore,
    metabolic: CategoryScore,
    respiratory: CategoryScore,
    mental: CategoryScore,
    lifestyle: CategoryScore
  ): HealthScore['factors'] {
    const factors: HealthScore['factors'] = [];

    // Positive factors
    [cardiovascular, metabolic, respiratory, mental, lifestyle].forEach((category) => {
      category.contributors.forEach((contributor) => {
        if (
          contributor.includes('Normal') ||
          contributor.includes('Healthy') ||
          contributor.includes('Good') ||
          contributor.includes('Active') ||
          contributor.includes('Non-smoker')
        ) {
          factors.push({
            name: contributor,
            impact: 'positive',
            weight: 0.2,
            description: 'Contributing positively to overall health',
            category: this.getCategoryName(category),
          });
        }
      });
    });

    // Negative factors
    [cardiovascular, metabolic, respiratory, mental, lifestyle].forEach((category) => {
      category.contributors.forEach((contributor) => {
        if (
          contributor.includes('High') ||
          contributor.includes('Elevated') ||
          contributor.includes('Poor') ||
          contributor.includes('Sedentary') ||
          contributor.includes('Obesity') ||
          contributor.includes('smoker')
        ) {
          factors.push({
            name: contributor,
            impact: 'negative',
            weight: 0.3,
            description: 'Negatively impacting overall health',
            category: this.getCategoryName(category),
          });
        }
      });
    });

    return factors;
  }

  private getCategoryName(category: CategoryScore): string {
    // This is a simplified approach - in production, pass category name
    return 'Health';
  }

  private async getRecentLabInterpretations(patientId: string) {
    const recentLabs = await prisma.labResult.findMany({
      where: { patientId },
      orderBy: { resultDate: 'desc' },
      take: 10,
    });

    if (recentLabs.length === 0) return undefined;

    const interpretations = await Promise.all(
      recentLabs.map((lab) => LabResultInterpreterService.interpretLabResult(lab.id))
    );

    return interpretations;
  }

  private calculateDataPoints(
    patient: any,
    trends: any,
    labInterpretations: any
  ): number {
    let count = 0;
    count += patient.vitalSigns?.length || 0;
    count += patient.labResults?.length || 0;
    count += patient.medications?.length || 0;
    count += patient.conditions?.length || 0;
    count += trends?.length || 0;
    count += labInterpretations?.length || 0;
    return count;
  }

  private calculateConfidence(
    riskAssessment: any,
    trends: any,
    medicationInteractions: any,
    labInterpretations: any
  ): number {
    let totalConfidence = 0;
    let count = 0;

    if (riskAssessment) {
      totalConfidence += 0.9;
      count++;
    }

    if (trends && trends.length > 0) {
      const avgConfidence = trends.reduce((sum: number, t: any) => sum + (t.prediction?.confidence || 0.7), 0) / trends.length;
      totalConfidence += avgConfidence;
      count++;
    }

    if (medicationInteractions) {
      totalConfidence += 0.85;
      count++;
    }

    if (labInterpretations && labInterpretations.length > 0) {
      totalConfidence += 0.9;
      count++;
    }

    return count > 0 ? (totalConfidence / count) * 100 : 70;
  }
}

export default new AIHealthInsightsService();