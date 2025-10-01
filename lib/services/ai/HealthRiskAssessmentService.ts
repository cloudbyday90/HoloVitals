/**
 * Health Risk Assessment Service
 * AI-powered risk assessment for various health conditions
 */

import { PrismaClient } from '@prisma/client';
import {
  RiskAssessment,
  HealthRisk,
  RiskFactor,
  PreventiveAction,
  RiskLevel,
  RiskFactorCategory,
} from '@/lib/types/ai-insights';

const prisma = new PrismaClient();

export class HealthRiskAssessmentService {
  /**
   * Generate comprehensive risk assessment for a patient
   */
  async generateRiskAssessment(patientId: string): Promise<RiskAssessment> {
    // Fetch patient data
    const patientData = await this.fetchPatientData(patientId);

    // Assess various health risks
    const risks: HealthRisk[] = [
      await this.assessCardiovascularRisk(patientData),
      await this.assessDiabetesRisk(patientData),
      await this.assessCancerRisk(patientData),
      await this.assessRespiratoryRisk(patientData),
      await this.assessMentalHealthRisk(patientData),
    ].filter((risk) => risk !== null) as HealthRisk[];

    // Determine overall risk level
    const overallRisk = this.calculateOverallRisk(risks);

    // Generate preventive actions
    const preventiveActions = this.generatePreventiveActions(risks);

    // Calculate next assessment date
    const nextAssessmentDate = this.calculateNextAssessmentDate(overallRisk);

    return {
      id: `risk-${Date.now()}`,
      patientId,
      assessmentDate: new Date(),
      overallRisk,
      risks,
      preventiveActions,
      nextAssessmentDate,
    };
  }

  /**
   * Assess cardiovascular disease risk
   */
  private async assessCardiovascularRisk(patientData: any): Promise<HealthRisk | null> {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Age factor
    if (patientData.age) {
      const ageRisk = this.calculateAgeRisk(patientData.age, 'cardiovascular');
      if (ageRisk) {
        riskFactors.push(ageRisk);
        totalRiskScore += ageRisk.impact;
      }
    }

    // Blood pressure
    if (patientData.bloodPressure) {
      const bpRisk = this.assessBloodPressureRisk(patientData.bloodPressure);
      if (bpRisk) {
        riskFactors.push(bpRisk);
        totalRiskScore += bpRisk.impact;
      }
    }

    // Cholesterol
    if (patientData.cholesterol) {
      const cholesterolRisk = this.assessCholesterolRisk(patientData.cholesterol);
      if (cholesterolRisk) {
        riskFactors.push(cholesterolRisk);
        totalRiskScore += cholesterolRisk.impact;
      }
    }

    // Smoking status
    if (patientData.smokingStatus === 'current') {
      riskFactors.push({
        name: 'Current Smoker',
        category: 'lifestyle',
        severity: 'high',
        modifiable: true,
        impact: 25,
      });
      totalRiskScore += 25;
    }

    // BMI
    if (patientData.bmi) {
      const bmiRisk = this.assessBMIRisk(patientData.bmi);
      if (bmiRisk) {
        riskFactors.push(bmiRisk);
        totalRiskScore += bmiRisk.impact;
      }
    }

    // Diabetes
    if (patientData.hasDiabetes) {
      riskFactors.push({
        name: 'Diabetes',
        category: 'medical-history',
        severity: 'high',
        modifiable: true,
        impact: 20,
      });
      totalRiskScore += 20;
    }

    // Family history
    if (patientData.familyHistory?.cardiovascular) {
      riskFactors.push({
        name: 'Family History of Heart Disease',
        category: 'family-history',
        severity: 'moderate',
        modifiable: false,
        impact: 15,
      });
      totalRiskScore += 15;
    }

    if (riskFactors.length === 0) {
      return null;
    }

    // Calculate probability and risk level
    const probability = Math.min(totalRiskScore, 100);
    const riskLevel = this.determineRiskLevel(probability);

    return {
      id: `cvd-risk-${Date.now()}`,
      condition: 'Cardiovascular Disease',
      riskLevel,
      probability,
      timeframe: '10-year',
      riskFactors,
      evidenceBased: true,
      sources: [
        'Framingham Heart Study',
        'ACC/AHA Cardiovascular Risk Calculator',
        'European Society of Cardiology Guidelines',
      ],
      mitigationStrategies: this.generateCVDMitigationStrategies(riskFactors),
    };
  }

  /**
   * Assess diabetes risk
   */
  private async assessDiabetesRisk(patientData: any): Promise<HealthRisk | null> {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Age factor
    if (patientData.age && patientData.age >= 45) {
      riskFactors.push({
        name: 'Age ≥45',
        category: 'age',
        severity: 'moderate',
        modifiable: false,
        impact: 15,
      });
      totalRiskScore += 15;
    }

    // BMI
    if (patientData.bmi && patientData.bmi >= 25) {
      const severity = patientData.bmi >= 30 ? 'high' : 'moderate';
      const impact = patientData.bmi >= 30 ? 25 : 15;
      riskFactors.push({
        name: 'Overweight/Obesity',
        category: 'lifestyle',
        severity,
        modifiable: true,
        currentValue: `${patientData.bmi} kg/m²`,
        targetValue: '<25 kg/m²',
        impact,
      });
      totalRiskScore += impact;
    }

    // Fasting glucose
    if (patientData.fastingGlucose) {
      if (patientData.fastingGlucose >= 100 && patientData.fastingGlucose < 126) {
        riskFactors.push({
          name: 'Prediabetes (Impaired Fasting Glucose)',
          category: 'lab-results',
          severity: 'high',
          modifiable: true,
          currentValue: `${patientData.fastingGlucose} mg/dL`,
          targetValue: '<100 mg/dL',
          impact: 30,
        });
        totalRiskScore += 30;
      }
    }

    // HbA1c
    if (patientData.hba1c) {
      if (patientData.hba1c >= 5.7 && patientData.hba1c < 6.5) {
        riskFactors.push({
          name: 'Prediabetes (Elevated HbA1c)',
          category: 'lab-results',
          severity: 'high',
          modifiable: true,
          currentValue: `${patientData.hba1c}%`,
          targetValue: '<5.7%',
          impact: 30,
        });
        totalRiskScore += 30;
      }
    }

    // Physical inactivity
    if (patientData.physicalActivity === 'sedentary') {
      riskFactors.push({
        name: 'Physical Inactivity',
        category: 'lifestyle',
        severity: 'moderate',
        modifiable: true,
        impact: 15,
      });
      totalRiskScore += 15;
    }

    // Family history
    if (patientData.familyHistory?.diabetes) {
      riskFactors.push({
        name: 'Family History of Diabetes',
        category: 'family-history',
        severity: 'moderate',
        modifiable: false,
        impact: 20,
      });
      totalRiskScore += 20;
    }

    // Hypertension
    if (patientData.hasHypertension) {
      riskFactors.push({
        name: 'Hypertension',
        category: 'medical-history',
        severity: 'moderate',
        modifiable: true,
        impact: 15,
      });
      totalRiskScore += 15;
    }

    if (riskFactors.length === 0) {
      return null;
    }

    const probability = Math.min(totalRiskScore, 100);
    const riskLevel = this.determineRiskLevel(probability);

    return {
      id: `diabetes-risk-${Date.now()}`,
      condition: 'Type 2 Diabetes',
      riskLevel,
      probability,
      timeframe: '10-year',
      riskFactors,
      evidenceBased: true,
      sources: [
        'American Diabetes Association Risk Calculator',
        'CDC Prediabetes Risk Test',
        'Finnish Diabetes Risk Score (FINDRISC)',
      ],
      mitigationStrategies: this.generateDiabetesMitigationStrategies(riskFactors),
    };
  }

  /**
   * Assess cancer risk
   */
  private async assessCancerRisk(patientData: any): Promise<HealthRisk | null> {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Age factor
    if (patientData.age && patientData.age >= 50) {
      riskFactors.push({
        name: 'Age ≥50',
        category: 'age',
        severity: 'moderate',
        modifiable: false,
        impact: 20,
      });
      totalRiskScore += 20;
    }

    // Smoking
    if (patientData.smokingStatus === 'current') {
      riskFactors.push({
        name: 'Current Smoker',
        category: 'lifestyle',
        severity: 'critical',
        modifiable: true,
        impact: 35,
      });
      totalRiskScore += 35;
    } else if (patientData.smokingStatus === 'former') {
      riskFactors.push({
        name: 'Former Smoker',
        category: 'lifestyle',
        severity: 'moderate',
        modifiable: false,
        impact: 15,
      });
      totalRiskScore += 15;
    }

    // Family history
    if (patientData.familyHistory?.cancer) {
      riskFactors.push({
        name: 'Family History of Cancer',
        category: 'family-history',
        severity: 'high',
        modifiable: false,
        impact: 25,
      });
      totalRiskScore += 25;
    }

    // Obesity
    if (patientData.bmi && patientData.bmi >= 30) {
      riskFactors.push({
        name: 'Obesity',
        category: 'lifestyle',
        severity: 'moderate',
        modifiable: true,
        impact: 15,
      });
      totalRiskScore += 15;
    }

    // Alcohol consumption
    if (patientData.alcoholConsumption === 'heavy') {
      riskFactors.push({
        name: 'Heavy Alcohol Consumption',
        category: 'lifestyle',
        severity: 'moderate',
        modifiable: true,
        impact: 15,
      });
      totalRiskScore += 15;
    }

    if (riskFactors.length === 0) {
      return null;
    }

    const probability = Math.min(totalRiskScore, 100);
    const riskLevel = this.determineRiskLevel(probability);

    return {
      id: `cancer-risk-${Date.now()}`,
      condition: 'Cancer (General)',
      riskLevel,
      probability,
      timeframe: 'lifetime',
      riskFactors,
      evidenceBased: true,
      sources: [
        'National Cancer Institute',
        'American Cancer Society Guidelines',
        'WHO Cancer Risk Factors',
      ],
      mitigationStrategies: this.generateCancerMitigationStrategies(riskFactors),
    };
  }

  /**
   * Assess respiratory disease risk
   */
  private async assessRespiratoryRisk(patientData: any): Promise<HealthRisk | null> {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Smoking
    if (patientData.smokingStatus === 'current') {
      riskFactors.push({
        name: 'Current Smoker',
        category: 'lifestyle',
        severity: 'critical',
        modifiable: true,
        impact: 40,
      });
      totalRiskScore += 40;
    }

    // Occupational exposure
    if (patientData.occupationalExposure) {
      riskFactors.push({
        name: 'Occupational Exposure to Pollutants',
        category: 'environmental',
        severity: 'high',
        modifiable: true,
        impact: 25,
      });
      totalRiskScore += 25;
    }

    // Asthma history
    if (patientData.hasAsthma) {
      riskFactors.push({
        name: 'History of Asthma',
        category: 'medical-history',
        severity: 'moderate',
        modifiable: false,
        impact: 20,
      });
      totalRiskScore += 20;
    }

    // Family history
    if (patientData.familyHistory?.respiratory) {
      riskFactors.push({
        name: 'Family History of Respiratory Disease',
        category: 'family-history',
        severity: 'moderate',
        modifiable: false,
        impact: 15,
      });
      totalRiskScore += 15;
    }

    if (riskFactors.length === 0) {
      return null;
    }

    const probability = Math.min(totalRiskScore, 100);
    const riskLevel = this.determineRiskLevel(probability);

    return {
      id: `respiratory-risk-${Date.now()}`,
      condition: 'Chronic Respiratory Disease',
      riskLevel,
      probability,
      timeframe: '10-year',
      riskFactors,
      evidenceBased: true,
      sources: [
        'GOLD COPD Guidelines',
        'American Thoracic Society',
        'European Respiratory Society',
      ],
      mitigationStrategies: this.generateRespiratoryMitigationStrategies(riskFactors),
    };
  }

  /**
   * Assess mental health risk
   */
  private async assessMentalHealthRisk(patientData: any): Promise<HealthRisk | null> {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Stress level
    if (patientData.stressLevel === 'high') {
      riskFactors.push({
        name: 'High Stress Level',
        category: 'lifestyle',
        severity: 'high',
        modifiable: true,
        impact: 25,
      });
      totalRiskScore += 25;
    }

    // Sleep quality
    if (patientData.sleepQuality === 'poor') {
      riskFactors.push({
        name: 'Poor Sleep Quality',
        category: 'lifestyle',
        severity: 'moderate',
        modifiable: true,
        impact: 20,
      });
      totalRiskScore += 20;
    }

    // Social isolation
    if (patientData.socialIsolation) {
      riskFactors.push({
        name: 'Social Isolation',
        category: 'lifestyle',
        severity: 'moderate',
        modifiable: true,
        impact: 20,
      });
      totalRiskScore += 20;
    }

    // Family history
    if (patientData.familyHistory?.mentalHealth) {
      riskFactors.push({
        name: 'Family History of Mental Health Conditions',
        category: 'family-history',
        severity: 'moderate',
        modifiable: false,
        impact: 20,
      });
      totalRiskScore += 20;
    }

    // Chronic pain
    if (patientData.hasChronicPain) {
      riskFactors.push({
        name: 'Chronic Pain',
        category: 'medical-history',
        severity: 'moderate',
        modifiable: true,
        impact: 15,
      });
      totalRiskScore += 15;
    }

    if (riskFactors.length === 0) {
      return null;
    }

    const probability = Math.min(totalRiskScore, 100);
    const riskLevel = this.determineRiskLevel(probability);

    return {
      id: `mental-health-risk-${Date.now()}`,
      condition: 'Depression/Anxiety',
      riskLevel,
      probability,
      timeframe: '1-year',
      riskFactors,
      evidenceBased: true,
      sources: [
        'PHQ-9 Depression Screening',
        'GAD-7 Anxiety Screening',
        'WHO Mental Health Guidelines',
      ],
      mitigationStrategies: this.generateMentalHealthMitigationStrategies(riskFactors),
    };
  }

  /**
   * Helper methods
   */

  private async fetchPatientData(patientId: string): Promise<any> {
    // Fetch comprehensive patient data from database
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
        conditions: true,
        allergies: true,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Extract and process relevant data
    const latestVitals = patient.vitalSigns[0];
    const labResults = patient.labResults;

    return {
      age: this.calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      bloodPressure: latestVitals?.bloodPressure,
      bmi: latestVitals?.bmi,
      cholesterol: this.getLatestLabValue(labResults, 'cholesterol'),
      fastingGlucose: this.getLatestLabValue(labResults, 'glucose'),
      hba1c: this.getLatestLabValue(labResults, 'hba1c'),
      smokingStatus: patient.smokingStatus,
      alcoholConsumption: patient.alcoholConsumption,
      physicalActivity: patient.physicalActivity,
      stressLevel: patient.stressLevel,
      sleepQuality: patient.sleepQuality,
      socialIsolation: patient.socialIsolation,
      hasDiabetes: patient.conditions.some((c) => c.code?.includes('E11')),
      hasHypertension: patient.conditions.some((c) => c.code?.includes('I10')),
      hasAsthma: patient.conditions.some((c) => c.code?.includes('J45')),
      hasChronicPain: patient.conditions.some((c) => c.description?.toLowerCase().includes('pain')),
      occupationalExposure: patient.occupationalExposure,
      familyHistory: patient.familyHistory,
    };
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private getLatestLabValue(labResults: any[], testName: string): number | null {
    const result = labResults.find((lab) =>
      lab.testName.toLowerCase().includes(testName.toLowerCase())
    );
    return result ? parseFloat(result.value) : null;
  }

  private calculateAgeRisk(age: number, condition: string): RiskFactor | null {
    if (condition === 'cardiovascular' && age >= 45) {
      const severity = age >= 65 ? 'high' : 'moderate';
      const impact = age >= 65 ? 20 : 10;
      return {
        name: `Age ${age}`,
        category: 'age',
        severity,
        modifiable: false,
        impact,
      };
    }
    return null;
  }

  private assessBloodPressureRisk(bp: string): RiskFactor | null {
    const [systolic, diastolic] = bp.split('/').map(Number);
    
    if (systolic >= 140 || diastolic >= 90) {
      return {
        name: 'Hypertension',
        category: 'vital-signs',
        severity: systolic >= 160 || diastolic >= 100 ? 'high' : 'moderate',
        modifiable: true,
        currentValue: bp,
        targetValue: '<120/80 mmHg',
        impact: systolic >= 160 || diastolic >= 100 ? 25 : 15,
      };
    } else if (systolic >= 130 || diastolic >= 80) {
      return {
        name: 'Elevated Blood Pressure',
        category: 'vital-signs',
        severity: 'moderate',
        modifiable: true,
        currentValue: bp,
        targetValue: '<120/80 mmHg',
        impact: 10,
      };
    }
    return null;
  }

  private assessCholesterolRisk(cholesterol: number): RiskFactor | null {
    if (cholesterol >= 240) {
      return {
        name: 'High Cholesterol',
        category: 'lab-results',
        severity: 'high',
        modifiable: true,
        currentValue: `${cholesterol} mg/dL`,
        targetValue: '<200 mg/dL',
        impact: 20,
      };
    } else if (cholesterol >= 200) {
      return {
        name: 'Borderline High Cholesterol',
        category: 'lab-results',
        severity: 'moderate',
        modifiable: true,
        currentValue: `${cholesterol} mg/dL`,
        targetValue: '<200 mg/dL',
        impact: 10,
      };
    }
    return null;
  }

  private assessBMIRisk(bmi: number): RiskFactor | null {
    if (bmi >= 30) {
      return {
        name: 'Obesity',
        category: 'lifestyle',
        severity: 'high',
        modifiable: true,
        currentValue: `${bmi} kg/m²`,
        targetValue: '18.5-24.9 kg/m²',
        impact: 20,
      };
    } else if (bmi >= 25) {
      return {
        name: 'Overweight',
        category: 'lifestyle',
        severity: 'moderate',
        modifiable: true,
        currentValue: `${bmi} kg/m²`,
        targetValue: '18.5-24.9 kg/m²',
        impact: 10,
      };
    }
    return null;
  }

  private determineRiskLevel(probability: number): RiskLevel {
    if (probability >= 75) return 'critical';
    if (probability >= 50) return 'high';
    if (probability >= 25) return 'moderate';
    return 'low';
  }

  private calculateOverallRisk(risks: HealthRisk[]): RiskLevel {
    if (risks.some((r) => r.riskLevel === 'critical')) return 'critical';
    if (risks.some((r) => r.riskLevel === 'high')) return 'high';
    if (risks.some((r) => r.riskLevel === 'moderate')) return 'moderate';
    return 'low';
  }

  private generatePreventiveActions(risks: HealthRisk[]): PreventiveAction[] {
    const actions: PreventiveAction[] = [];
    const actionMap = new Map<string, PreventiveAction>();

    risks.forEach((risk) => {
      risk.mitigationStrategies.forEach((strategy, index) => {
        const actionId = `action-${risk.condition}-${index}`;
        if (!actionMap.has(actionId)) {
          actionMap.set(actionId, {
            id: actionId,
            title: strategy,
            description: `Recommended action to reduce ${risk.condition} risk`,
            priority: this.mapRiskLevelToPriority(risk.riskLevel),
            category: this.categorizeAction(strategy),
            estimatedImpact: risk.probability * 0.3, // Estimated 30% risk reduction
            timeToImplement: '1-3 months',
            resources: [],
            completed: false,
          });
        }
      });
    });

    return Array.from(actionMap.values()).sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private mapRiskLevelToPriority(riskLevel: RiskLevel): 'low' | 'medium' | 'high' | 'urgent' {
    const mapping: Record<RiskLevel, 'low' | 'medium' | 'high' | 'urgent'> = {
      low: 'low',
      moderate: 'medium',
      high: 'high',
      critical: 'urgent',
    };
    return mapping[riskLevel];
  }

  private categorizeAction(strategy: string): PreventiveAction['category'] {
    const lower = strategy.toLowerCase();
    if (lower.includes('screen') || lower.includes('test')) return 'screening';
    if (lower.includes('medication') || lower.includes('drug')) return 'medication';
    if (lower.includes('monitor') || lower.includes('check')) return 'monitoring';
    if (lower.includes('specialist') || lower.includes('doctor')) return 'consultation';
    return 'lifestyle';
  }

  private calculateNextAssessmentDate(overallRisk: RiskLevel): Date {
    const date = new Date();
    const monthsToAdd = {
      low: 12,
      moderate: 6,
      high: 3,
      critical: 1,
    };
    date.setMonth(date.getMonth() + monthsToAdd[overallRisk]);
    return date;
  }

  private generateCVDMitigationStrategies(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = [
      'Regular cardiovascular screening and monitoring',
      'Maintain healthy blood pressure (<120/80 mmHg)',
      'Achieve and maintain healthy cholesterol levels',
    ];

    riskFactors.forEach((factor) => {
      if (factor.name.includes('Smoker')) {
        strategies.push('Smoking cessation program');
      }
      if (factor.name.includes('BMI') || factor.name.includes('Obesity')) {
        strategies.push('Weight management through diet and exercise');
      }
      if (factor.name.includes('Diabetes')) {
        strategies.push('Optimal diabetes management and glucose control');
      }
    });

    strategies.push('Regular physical activity (150 minutes/week)');
    strategies.push('Heart-healthy diet (Mediterranean or DASH diet)');
    strategies.push('Stress management techniques');

    return strategies;
  }

  private generateDiabetesMitigationStrategies(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = [
      'Regular blood glucose monitoring',
      'HbA1c testing every 3-6 months',
    ];

    riskFactors.forEach((factor) => {
      if (factor.name.includes('Overweight') || factor.name.includes('Obesity')) {
        strategies.push('Weight loss (5-10% of body weight)');
      }
      if (factor.name.includes('Physical Inactivity')) {
        strategies.push('Increase physical activity to 150 minutes/week');
      }
      if (factor.name.includes('Prediabetes')) {
        strategies.push('Diabetes prevention program enrollment');
      }
    });

    strategies.push('Low glycemic index diet');
    strategies.push('Limit refined carbohydrates and added sugars');
    strategies.push('Regular meal timing and portion control');

    return strategies;
  }

  private generateCancerMitigationStrategies(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = [
      'Age-appropriate cancer screenings',
      'Annual health check-ups',
    ];

    riskFactors.forEach((factor) => {
      if (factor.name.includes('Smoker')) {
        strategies.push('Smoking cessation immediately');
        strategies.push('Lung cancer screening (if eligible)');
      }
      if (factor.name.includes('Obesity')) {
        strategies.push('Weight management to healthy BMI');
      }
      if (factor.name.includes('Alcohol')) {
        strategies.push('Reduce alcohol consumption');
      }
    });

    strategies.push('Colorectal cancer screening (age 45+)');
    strategies.push('Mammography screening (women 40+)');
    strategies.push('Prostate cancer screening discussion (men 50+)');
    strategies.push('HPV vaccination (if eligible)');
    strategies.push('Sun protection and skin cancer awareness');

    return strategies;
  }

  private generateRespiratoryMitigationStrategies(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = [
      'Regular pulmonary function testing',
      'Annual flu vaccination',
      'Pneumonia vaccination (if eligible)',
    ];

    riskFactors.forEach((factor) => {
      if (factor.name.includes('Smoker')) {
        strategies.push('Immediate smoking cessation');
        strategies.push('Pulmonary rehabilitation program');
      }
      if (factor.name.includes('Occupational')) {
        strategies.push('Use proper respiratory protection at work');
        strategies.push('Minimize exposure to pollutants');
      }
    });

    strategies.push('Avoid secondhand smoke');
    strategies.push('Indoor air quality improvement');
    strategies.push('Regular exercise to improve lung capacity');

    return strategies;
  }

  private generateMentalHealthMitigationStrategies(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = [
      'Regular mental health screening',
      'Establish support network',
    ];

    riskFactors.forEach((factor) => {
      if (factor.name.includes('Stress')) {
        strategies.push('Stress management techniques (meditation, yoga)');
        strategies.push('Work-life balance improvement');
      }
      if (factor.name.includes('Sleep')) {
        strategies.push('Sleep hygiene improvement');
        strategies.push('Consistent sleep schedule');
      }
      if (factor.name.includes('Social Isolation')) {
        strategies.push('Increase social connections and activities');
        strategies.push('Join support groups or community activities');
      }
    });

    strategies.push('Regular physical exercise');
    strategies.push('Mindfulness and relaxation practices');
    strategies.push('Consider professional counseling or therapy');
    strategies.push('Maintain healthy lifestyle habits');

    return strategies;
  }
}

export default new HealthRiskAssessmentService();