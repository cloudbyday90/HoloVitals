/**
 * Lab Result Interpreter Service
 * AI-powered interpretation of laboratory test results
 */

import { PrismaClient } from '@prisma/client';
import {
  LabInterpretation,
  LabResult,
  Interpretation,
  ClinicalSignificance,
  LabTrend,
} from '@/lib/types/ai-insights';

const prisma = new PrismaClient();

export class LabResultInterpreterService {
  /**
   * Interpret a lab result
   */
  async interpretLabResult(testId: string): Promise<LabInterpretation> {
    // Fetch lab result
    const labResult = await prisma.labResult.findUnique({
      where: { id: testId },
      include: {
        patient: true,
      },
    });

    if (!labResult) {
      throw new Error('Lab result not found');
    }

    // Parse result value
    const value = parseFloat(labResult.value);
    const unit = labResult.unit;

    // Get reference range
    const referenceRange = this.getReferenceRange(
      labResult.testName,
      labResult.patient.gender,
      this.calculateAge(labResult.patient.dateOfBirth)
    );

    // Determine flag
    const flag = this.determineFlag(value, referenceRange);

    // Create lab result object
    const result: LabResult = {
      value,
      unit,
      referenceRange,
      flag,
      date: labResult.resultDate,
    };

    // Generate interpretation
    const interpretation = this.generateInterpretation(
      labResult.testName,
      result,
      labResult.patient
    );

    // Assess clinical significance
    const clinicalSignificance = this.assessClinicalSignificance(
      labResult.testName,
      result,
      interpretation
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      labResult.testName,
      result,
      interpretation,
      clinicalSignificance
    );

    // Get related tests
    const relatedTests = this.getRelatedTests(labResult.testName);

    // Analyze trends
    const trends = await this.analyzeTrends(labResult.patientId, labResult.testName);

    return {
      testId: labResult.id,
      testName: labResult.testName,
      loincCode: labResult.loincCode || '',
      result,
      interpretation,
      clinicalSignificance,
      recommendations,
      relatedTests,
      trends,
    };
  }

  /**
   * Interpret multiple lab results
   */
  async interpretMultipleResults(testIds: string[]): Promise<LabInterpretation[]> {
    const interpretations = await Promise.all(
      testIds.map((testId) => this.interpretLabResult(testId))
    );
    return interpretations;
  }

  /**
   * Get comprehensive lab panel interpretation
   */
  async interpretLabPanel(
    patientId: string,
    panelType: 'metabolic' | 'lipid' | 'cbc' | 'thyroid' | 'liver' | 'kidney'
  ): Promise<{
    panel: string;
    interpretations: LabInterpretation[];
    overallAssessment: string;
    keyFindings: string[];
    recommendations: string[];
  }> {
    const testNames = this.getPanelTests(panelType);

    // Fetch recent results for panel tests
    const labResults = await prisma.labResult.findMany({
      where: {
        patientId,
        testName: { in: testNames },
      },
      orderBy: { resultDate: 'desc' },
      take: testNames.length,
    });

    // Interpret each result
    const interpretations = await Promise.all(
      labResults.map((result) => this.interpretLabResult(result.id))
    );

    // Generate overall assessment
    const overallAssessment = this.generatePanelAssessment(panelType, interpretations);

    // Extract key findings
    const keyFindings = this.extractKeyFindings(interpretations);

    // Generate panel-specific recommendations
    const recommendations = this.generatePanelRecommendations(panelType, interpretations);

    return {
      panel: panelType,
      interpretations,
      overallAssessment,
      keyFindings,
      recommendations,
    };
  }

  /**
   * Helper methods
   */

  private getReferenceRange(
    testName: string,
    gender: string,
    age: number
  ): LabResult['referenceRange'] {
    const ranges: Record<string, any> = {
      // Metabolic Panel
      glucose: { min: 70, max: 100, unit: 'mg/dL' },
      sodium: { min: 136, max: 145, unit: 'mEq/L' },
      potassium: { min: 3.5, max: 5.0, unit: 'mEq/L' },
      chloride: { min: 98, max: 107, unit: 'mEq/L' },
      co2: { min: 23, max: 29, unit: 'mEq/L' },
      bun: { min: 7, max: 20, unit: 'mg/dL' },
      creatinine: gender === 'male' ? { min: 0.7, max: 1.3, unit: 'mg/dL' } : { min: 0.6, max: 1.1, unit: 'mg/dL' },
      calcium: { min: 8.5, max: 10.5, unit: 'mg/dL' },

      // Lipid Panel
      'total cholesterol': { min: 0, max: 200, unit: 'mg/dL' },
      'ldl cholesterol': { min: 0, max: 100, unit: 'mg/dL' },
      'hdl cholesterol': gender === 'male' ? { min: 40, max: 999, unit: 'mg/dL' } : { min: 50, max: 999, unit: 'mg/dL' },
      triglycerides: { min: 0, max: 150, unit: 'mg/dL' },

      // Complete Blood Count
      wbc: { min: 4.5, max: 11.0, unit: '10^3/µL' },
      rbc: gender === 'male' ? { min: 4.7, max: 6.1, unit: '10^6/µL' } : { min: 4.2, max: 5.4, unit: '10^6/µL' },
      hemoglobin: gender === 'male' ? { min: 13.5, max: 17.5, unit: 'g/dL' } : { min: 12.0, max: 15.5, unit: 'g/dL' },
      hematocrit: gender === 'male' ? { min: 38.8, max: 50.0, unit: '%' } : { min: 34.9, max: 44.5, unit: '%' },
      platelets: { min: 150, max: 400, unit: '10^3/µL' },

      // Liver Function
      alt: { min: 7, max: 56, unit: 'U/L' },
      ast: { min: 10, max: 40, unit: 'U/L' },
      'alkaline phosphatase': { min: 44, max: 147, unit: 'U/L' },
      'total bilirubin': { min: 0.1, max: 1.2, unit: 'mg/dL' },
      albumin: { min: 3.5, max: 5.5, unit: 'g/dL' },

      // Thyroid Function
      tsh: { min: 0.4, max: 4.0, unit: 'mIU/L' },
      't4': { min: 4.5, max: 12.0, unit: 'µg/dL' },
      't3': { min: 80, max: 200, unit: 'ng/dL' },

      // Diabetes Markers
      hba1c: { min: 0, max: 5.7, unit: '%' },
      'fasting glucose': { min: 70, max: 100, unit: 'mg/dL' },
    };

    const normalizedName = testName.toLowerCase();
    return ranges[normalizedName] || { min: 0, max: 999, unit: '' };
  }

  private determineFlag(value: number, referenceRange: LabResult['referenceRange']): LabResult['flag'] {
    const { min, max } = referenceRange;

    // Critical values (typically 2x outside normal range)
    if (value < min * 0.5) return 'critical-low';
    if (value > max * 2) return 'critical-high';

    // Abnormal values
    if (value < min) return 'low';
    if (value > max) return 'high';

    return 'normal';
  }

  private generateInterpretation(
    testName: string,
    result: LabResult,
    patient: any
  ): Interpretation {
    const { flag, value, unit, referenceRange } = result;

    let status: Interpretation['status'];
    let urgency: Interpretation['urgency'];
    let summary: string;
    let details: string[] = [];
    let possibleCauses: string[] = [];
    let clinicalContext: string;

    // Determine status and urgency
    if (flag === 'critical-low' || flag === 'critical-high') {
      status = 'critical';
      urgency = 'immediate';
    } else if (flag === 'low' || flag === 'high') {
      status = 'abnormal';
      urgency = 'prompt';
    } else {
      status = 'normal';
      urgency = 'routine';
    }

    // Generate test-specific interpretation
    const interpretation = this.getTestSpecificInterpretation(testName, result);
    summary = interpretation.summary;
    details = interpretation.details;
    possibleCauses = interpretation.possibleCauses;
    clinicalContext = interpretation.clinicalContext;

    return {
      status,
      summary,
      details,
      possibleCauses,
      clinicalContext,
      urgency,
    };
  }

  private getTestSpecificInterpretation(testName: string, result: LabResult): {
    summary: string;
    details: string[];
    possibleCauses: string[];
    clinicalContext: string;
  } {
    const { flag, value, unit } = result;
    const normalizedName = testName.toLowerCase();

    // Glucose
    if (normalizedName.includes('glucose')) {
      if (flag === 'high') {
        return {
          summary: 'Elevated blood glucose level',
          details: [
            `Current value: ${value} ${unit}`,
            'Above normal range indicating hyperglycemia',
            'May indicate prediabetes or diabetes if fasting',
          ],
          possibleCauses: [
            'Diabetes mellitus',
            'Prediabetes',
            'Stress or illness',
            'Medications (steroids, diuretics)',
            'Recent meal (if not fasting)',
          ],
          clinicalContext: 'Elevated glucose requires further evaluation and possible diabetes screening',
        };
      } else if (flag === 'low') {
        return {
          summary: 'Low blood glucose level',
          details: [
            `Current value: ${value} ${unit}`,
            'Below normal range indicating hypoglycemia',
            'May cause symptoms like shakiness, confusion, or sweating',
          ],
          possibleCauses: [
            'Diabetes medication overdose',
            'Prolonged fasting',
            'Excessive alcohol consumption',
            'Insulinoma (rare)',
          ],
          clinicalContext: 'Low glucose requires immediate attention if symptomatic',
        };
      }
    }

    // Cholesterol
    if (normalizedName.includes('cholesterol')) {
      if (normalizedName.includes('ldl')) {
        if (flag === 'high') {
          return {
            summary: 'Elevated LDL cholesterol ("bad" cholesterol)',
            details: [
              `Current value: ${value} ${unit}`,
              'Increases risk of heart disease and stroke',
              'Optimal level is <100 mg/dL',
            ],
            possibleCauses: [
              'High saturated fat diet',
              'Lack of physical activity',
              'Obesity',
              'Genetic factors',
              'Hypothyroidism',
            ],
            clinicalContext: 'Elevated LDL is a major risk factor for cardiovascular disease',
          };
        }
      } else if (normalizedName.includes('hdl')) {
        if (flag === 'low') {
          return {
            summary: 'Low HDL cholesterol ("good" cholesterol)',
            details: [
              `Current value: ${value} ${unit}`,
              'Decreases protection against heart disease',
              'Higher levels are protective',
            ],
            possibleCauses: [
              'Sedentary lifestyle',
              'Smoking',
              'Obesity',
              'Type 2 diabetes',
              'Genetic factors',
            ],
            clinicalContext: 'Low HDL increases cardiovascular risk',
          };
        }
      }
    }

    // HbA1c
    if (normalizedName.includes('hba1c') || normalizedName.includes('a1c')) {
      if (value >= 6.5) {
        return {
          summary: 'Elevated HbA1c indicating diabetes',
          details: [
            `Current value: ${value}%`,
            'HbA1c ≥6.5% diagnostic for diabetes',
            'Reflects average blood sugar over 2-3 months',
          ],
          possibleCauses: [
            'Type 2 diabetes',
            'Type 1 diabetes',
            'Poor diabetes control',
          ],
          clinicalContext: 'Diabetes diagnosis and management required',
        };
      } else if (value >= 5.7) {
        return {
          summary: 'Elevated HbA1c indicating prediabetes',
          details: [
            `Current value: ${value}%`,
            'HbA1c 5.7-6.4% indicates prediabetes',
            'Increased risk of developing diabetes',
          ],
          possibleCauses: [
            'Insulin resistance',
            'Obesity',
            'Sedentary lifestyle',
            'Family history of diabetes',
          ],
          clinicalContext: 'Lifestyle modifications recommended to prevent diabetes',
        };
      }
    }

    // Creatinine (Kidney function)
    if (normalizedName.includes('creatinine')) {
      if (flag === 'high') {
        return {
          summary: 'Elevated creatinine indicating reduced kidney function',
          details: [
            `Current value: ${value} ${unit}`,
            'May indicate impaired kidney function',
            'eGFR calculation recommended',
          ],
          possibleCauses: [
            'Chronic kidney disease',
            'Acute kidney injury',
            'Dehydration',
            'Medications (NSAIDs, ACE inhibitors)',
            'High protein diet',
          ],
          clinicalContext: 'Kidney function assessment and monitoring required',
        };
      }
    }

    // TSH (Thyroid)
    if (normalizedName.includes('tsh')) {
      if (flag === 'high') {
        return {
          summary: 'Elevated TSH indicating hypothyroidism',
          details: [
            `Current value: ${value} ${unit}`,
            'High TSH suggests underactive thyroid',
            'May cause fatigue, weight gain, cold intolerance',
          ],
          possibleCauses: [
            'Primary hypothyroidism',
            'Hashimoto\'s thyroiditis',
            'Thyroid surgery or radiation',
            'Medications (lithium, amiodarone)',
          ],
          clinicalContext: 'Thyroid hormone replacement may be needed',
        };
      } else if (flag === 'low') {
        return {
          summary: 'Low TSH indicating hyperthyroidism',
          details: [
            `Current value: ${value} ${unit}`,
            'Low TSH suggests overactive thyroid',
            'May cause weight loss, anxiety, palpitations',
          ],
          possibleCauses: [
            'Graves\' disease',
            'Toxic nodular goiter',
            'Thyroiditis',
            'Excessive thyroid hormone replacement',
          ],
          clinicalContext: 'Thyroid evaluation and treatment required',
        };
      }
    }

    // Default interpretation
    return {
      summary: flag === 'normal' ? 'Result within normal range' : `${flag.replace('-', ' ')} result`,
      details: [`Current value: ${value} ${unit}`],
      possibleCauses: [],
      clinicalContext: 'Consult with healthcare provider for detailed interpretation',
    };
  }

  private assessClinicalSignificance(
    testName: string,
    result: LabResult,
    interpretation: Interpretation
  ): ClinicalSignificance {
    const { flag } = result;

    let level: ClinicalSignificance['level'];
    let implications: string[] = [];
    let associatedConditions: string[] = [];
    let followUpRequired: boolean;
    let followUpTimeframe: string | undefined;

    // Determine significance level
    if (flag === 'critical-low' || flag === 'critical-high') {
      level = 'critical';
      followUpRequired = true;
      followUpTimeframe = 'Immediate';
    } else if (flag === 'low' || flag === 'high') {
      level = interpretation.urgency === 'prompt' ? 'high' : 'moderate';
      followUpRequired = true;
      followUpTimeframe = interpretation.urgency === 'prompt' ? 'Within 1 week' : 'Within 1 month';
    } else {
      level = 'low';
      followUpRequired = false;
    }

    // Test-specific significance
    const normalizedName = testName.toLowerCase();

    if (normalizedName.includes('glucose') || normalizedName.includes('hba1c')) {
      if (flag !== 'normal') {
        implications = [
          'Increased risk of cardiovascular disease',
          'Potential for diabetic complications',
          'Need for lifestyle modifications',
        ];
        associatedConditions = ['Diabetes mellitus', 'Metabolic syndrome', 'Cardiovascular disease'];
      }
    }

    if (normalizedName.includes('cholesterol')) {
      if (flag !== 'normal') {
        implications = [
          'Increased cardiovascular risk',
          'Potential for atherosclerosis',
          'May require lipid-lowering therapy',
        ];
        associatedConditions = ['Coronary artery disease', 'Stroke', 'Peripheral artery disease'];
      }
    }

    if (normalizedName.includes('creatinine')) {
      if (flag !== 'normal') {
        implications = [
          'Reduced kidney function',
          'Need for medication dose adjustments',
          'Risk of progression to kidney failure',
        ];
        associatedConditions = ['Chronic kidney disease', 'Acute kidney injury', 'Hypertension'];
      }
    }

    return {
      level,
      implications,
      associatedConditions,
      followUpRequired,
      followUpTimeframe,
    };
  }

  private generateRecommendations(
    testName: string,
    result: LabResult,
    interpretation: Interpretation,
    clinicalSignificance: ClinicalSignificance
  ): string[] {
    const recommendations: string[] = [];

    // Urgency-based recommendations
    if (interpretation.urgency === 'immediate') {
      recommendations.push('Seek immediate medical attention');
      recommendations.push('Contact your healthcare provider right away');
    } else if (interpretation.urgency === 'prompt') {
      recommendations.push('Schedule appointment with healthcare provider within 1 week');
      recommendations.push('Discuss results and treatment options');
    }

    // Follow-up recommendations
    if (clinicalSignificance.followUpRequired) {
      recommendations.push(`Follow-up testing recommended: ${clinicalSignificance.followUpTimeframe}`);
    }

    // Test-specific recommendations
    const normalizedName = testName.toLowerCase();

    if (normalizedName.includes('glucose') && result.flag === 'high') {
      recommendations.push('Monitor blood glucose levels regularly');
      recommendations.push('Follow diabetic diet if applicable');
      recommendations.push('Increase physical activity');
      recommendations.push('Consider diabetes screening tests');
    }

    if (normalizedName.includes('cholesterol') && result.flag === 'high') {
      recommendations.push('Adopt heart-healthy diet (low saturated fat)');
      recommendations.push('Increase physical activity to 150 minutes/week');
      recommendations.push('Consider statin therapy if indicated');
      recommendations.push('Repeat lipid panel in 3-6 months');
    }

    if (normalizedName.includes('hba1c') && result.value >= 5.7) {
      recommendations.push('Implement lifestyle modifications');
      recommendations.push('Weight loss if overweight (5-10% of body weight)');
      recommendations.push('Regular exercise program');
      recommendations.push('Consider diabetes prevention program');
    }

    // General recommendations
    if (result.flag === 'normal') {
      recommendations.push('Continue current health maintenance practices');
      recommendations.push('Repeat testing as recommended by provider');
    } else {
      recommendations.push('Maintain updated medication list');
      recommendations.push('Keep record of all test results');
      recommendations.push('Report any new symptoms to provider');
    }

    return recommendations;
  }

  private getRelatedTests(testName: string): string[] {
    const normalizedName = testName.toLowerCase();

    const relatedTestsMap: Record<string, string[]> = {
      glucose: ['HbA1c', 'Fasting Glucose', 'Oral Glucose Tolerance Test', 'C-Peptide'],
      hba1c: ['Fasting Glucose', 'Random Glucose', 'Lipid Panel'],
      cholesterol: ['LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides', 'Apolipoprotein B'],
      creatinine: ['BUN', 'eGFR', 'Urinalysis', 'Cystatin C'],
      tsh: ['Free T4', 'Free T3', 'Thyroid Antibodies'],
      alt: ['AST', 'Alkaline Phosphatase', 'Bilirubin', 'Albumin'],
      hemoglobin: ['Hematocrit', 'RBC Count', 'Iron Studies', 'Ferritin'],
    };

    for (const [key, tests] of Object.entries(relatedTestsMap)) {
      if (normalizedName.includes(key)) {
        return tests;
      }
    }

    return [];
  }

  private async analyzeTrends(patientId: string, testName: string): Promise<LabTrend[]> {
    // Fetch historical results
    const historicalResults = await prisma.labResult.findMany({
      where: {
        patientId,
        testName: { contains: testName, mode: 'insensitive' },
      },
      orderBy: { resultDate: 'desc' },
      take: 10,
    });

    if (historicalResults.length < 2) {
      return [];
    }

    const values = historicalResults.map((r) => parseFloat(r.value));
    const firstValue = values[values.length - 1];
    const lastValue = values[0];

    let direction: LabTrend['direction'];
    const changePercent = ((lastValue - firstValue) / firstValue) * 100;

    if (Math.abs(changePercent) < 5) {
      direction = 'stable';
    } else if (changePercent > 0) {
      direction = 'worsening'; // Assuming higher is worse (context-dependent)
    } else {
      direction = 'improving';
    }

    const timeSpan = this.calculateTimeSpan(
      historicalResults[historicalResults.length - 1].resultDate,
      historicalResults[0].resultDate
    );

    return [
      {
        testName,
        direction,
        dataPoints: historicalResults.length,
        timeSpan,
        significance: this.getTrendSignificance(direction, changePercent),
      },
    ];
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

  private calculateTimeSpan(startDate: Date, endDate: Date): string {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }

  private getTrendSignificance(direction: LabTrend['direction'], changePercent: number): string {
    if (direction === 'stable') {
      return 'Values remain consistent over time';
    }

    const absChange = Math.abs(changePercent);
    if (absChange > 50) {
      return `Significant ${direction} trend (${absChange.toFixed(1)}% change)`;
    } else if (absChange > 20) {
      return `Moderate ${direction} trend (${absChange.toFixed(1)}% change)`;
    } else {
      return `Slight ${direction} trend (${absChange.toFixed(1)}% change)`;
    }
  }

  private getPanelTests(panelType: string): string[] {
    const panels: Record<string, string[]> = {
      metabolic: ['Glucose', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'BUN', 'Creatinine', 'Calcium'],
      lipid: ['Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides'],
      cbc: ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'Platelets'],
      thyroid: ['TSH', 'Free T4', 'Free T3'],
      liver: ['ALT', 'AST', 'Alkaline Phosphatase', 'Total Bilirubin', 'Albumin'],
      kidney: ['BUN', 'Creatinine', 'eGFR', 'Sodium', 'Potassium'],
    };

    return panels[panelType] || [];
  }

  private generatePanelAssessment(
    panelType: string,
    interpretations: LabInterpretation[]
  ): string {
    const abnormalResults = interpretations.filter(
      (i) => i.interpretation.status !== 'normal'
    );

    if (abnormalResults.length === 0) {
      return `All ${panelType} panel results are within normal limits.`;
    }

    const criticalResults = abnormalResults.filter(
      (i) => i.interpretation.status === 'critical'
    );

    if (criticalResults.length > 0) {
      return `CRITICAL: ${criticalResults.length} critical abnormalities detected in ${panelType} panel requiring immediate attention.`;
    }

    return `${abnormalResults.length} abnormal result(s) detected in ${panelType} panel requiring follow-up.`;
  }

  private extractKeyFindings(interpretations: LabInterpretation[]): string[] {
    const findings: string[] = [];

    interpretations.forEach((interp) => {
      if (interp.interpretation.status !== 'normal') {
        findings.push(`${interp.testName}: ${interp.interpretation.summary}`);
      }
    });

    return findings.length > 0 ? findings : ['All results within normal limits'];
  }

  private generatePanelRecommendations(
    panelType: string,
    interpretations: LabInterpretation[]
  ): string[] {
    const recommendations = new Set<string>();

    interpretations.forEach((interp) => {
      interp.recommendations.forEach((rec) => recommendations.add(rec));
    });

    // Add panel-specific recommendations
    if (panelType === 'lipid') {
      recommendations.add('Maintain heart-healthy lifestyle');
      recommendations.add('Regular cardiovascular risk assessment');
    } else if (panelType === 'metabolic') {
      recommendations.add('Stay well-hydrated');
      recommendations.add('Monitor electrolyte balance');
    }

    return Array.from(recommendations);
  }
}

export default new LabResultInterpreterService();