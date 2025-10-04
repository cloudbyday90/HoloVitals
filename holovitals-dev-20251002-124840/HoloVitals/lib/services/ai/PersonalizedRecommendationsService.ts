/**
 * Personalized Recommendations Service
 * AI-powered personalized health recommendations and goal setting
 */

import { PrismaClient } from '@prisma/client';
import {
  PersonalizedRecommendations,
  RecommendationCategory,
  Recommendation,
  Goal,
  Milestone,
  Resource,
  RecommendationCategoryType,
  Evidence,
} from '@/lib/types/ai-insights';

const prisma = new PrismaClient();

export class PersonalizedRecommendationsService {
  /**
   * Generate personalized recommendations for a patient
   */
  async generateRecommendations(patientId: string): Promise<PersonalizedRecommendations> {
    // Fetch patient data
    const patientData = await this.fetchPatientData(patientId);

    // Generate recommendations by category
    const categories: RecommendationCategory[] = [
      await this.generateLifestyleRecommendations(patientData),
      await this.generateNutritionRecommendations(patientData),
      await this.generateExerciseRecommendations(patientData),
      await this.generateSleepRecommendations(patientData),
      await this.generateStressManagementRecommendations(patientData),
      await this.generatePreventiveCareRecommendations(patientData),
      await this.generateMedicationAdherenceRecommendations(patientData),
      await this.generateMonitoringRecommendations(patientData),
    ].filter((cat) => cat.recommendations.length > 0);

    // Extract priority actions
    const priorityActions = this.extractPriorityActions(categories);

    // Generate long-term goals
    const longTermGoals = this.generateLongTermGoals(patientData, categories);

    // Curate resources
    const resources = this.curateResources(categories);

    return {
      patientId,
      generatedDate: new Date(),
      categories,
      priorityActions,
      longTermGoals,
      resources,
    };
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    recommendationId: string,
    status: Recommendation['status'],
    notes?: string
  ): Promise<void> {
    // In production, this would update the database
    // For now, we'll just log the update
    console.log(`Recommendation ${recommendationId} updated to ${status}`);
    if (notes) {
      console.log(`Notes: ${notes}`);
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(
    goalId: string,
    progress: number,
    milestoneId?: string,
    notes?: string
  ): Promise<void> {
    // In production, this would update the database
    console.log(`Goal ${goalId} progress updated to ${progress}%`);
    if (milestoneId) {
      console.log(`Milestone ${milestoneId} completed`);
    }
    if (notes) {
      console.log(`Notes: ${notes}`);
    }
  }

  /**
   * Generate lifestyle recommendations
   */
  private async generateLifestyleRecommendations(
    patientData: any
  ): Promise<RecommendationCategory> {
    const recommendations: Recommendation[] = [];

    // Smoking cessation
    if (patientData.smokingStatus === 'current') {
      recommendations.push({
        id: 'lifestyle-smoking-1',
        title: 'Quit Smoking',
        description: 'Smoking is the leading cause of preventable death. Quitting smoking can significantly improve your health and reduce disease risk.',
        category: 'lifestyle',
        priority: 'critical',
        actionable: true,
        steps: [
          'Set a quit date within the next 2 weeks',
          'Talk to your doctor about smoking cessation aids (patches, gum, medications)',
          'Join a smoking cessation support group',
          'Identify and avoid smoking triggers',
          'Use the quitline: 1-800-QUIT-NOW',
        ],
        expectedBenefit: 'Reduces risk of heart disease, stroke, cancer, and lung disease by 50% or more',
        timeframe: '3-6 months',
        difficulty: 'challenging',
        evidence: {
          level: 'systematic-review',
          sources: ['CDC Smoking Cessation Guidelines', 'US Preventive Services Task Force'],
          confidence: 95,
        },
        status: 'pending',
      });
    }

    // Alcohol moderation
    if (patientData.alcoholConsumption === 'heavy') {
      recommendations.push({
        id: 'lifestyle-alcohol-1',
        title: 'Reduce Alcohol Consumption',
        description: 'Heavy alcohol use increases risk of liver disease, heart problems, and certain cancers.',
        category: 'lifestyle',
        priority: 'high',
        actionable: true,
        steps: [
          'Limit alcohol to no more than 1 drink/day (women) or 2 drinks/day (men)',
          'Track your alcohol consumption',
          'Find alternative beverages and activities',
          'Consider counseling if needed',
        ],
        expectedBenefit: 'Reduces risk of liver disease, improves heart health, better sleep quality',
        timeframe: '1-3 months',
        difficulty: 'moderate',
        evidence: {
          level: 'clinical-trial',
          sources: ['NIAAA Guidelines', 'WHO Alcohol Recommendations'],
          confidence: 85,
        },
        status: 'pending',
      });
    }

    // Weight management
    if (patientData.bmi >= 25) {
      const targetWeightLoss = patientData.bmi >= 30 ? '10%' : '5-7%';
      recommendations.push({
        id: 'lifestyle-weight-1',
        title: 'Achieve Healthy Weight',
        description: `Your BMI is ${patientData.bmi.toFixed(1)}, which is above the healthy range. Losing ${targetWeightLoss} of body weight can significantly improve health.`,
        category: 'lifestyle',
        priority: patientData.bmi >= 30 ? 'high' : 'medium',
        actionable: true,
        steps: [
          'Set realistic weight loss goal (1-2 lbs per week)',
          'Track daily calorie intake',
          'Increase physical activity gradually',
          'Consider working with a dietitian',
          'Join a weight loss support group',
        ],
        expectedBenefit: 'Reduces risk of diabetes, heart disease, and joint problems',
        timeframe: '6-12 months',
        difficulty: 'challenging',
        evidence: {
          level: 'systematic-review',
          sources: ['CDC Weight Management Guidelines', 'AHA Obesity Guidelines'],
          confidence: 90,
        },
        status: 'pending',
      });
    }

    return {
      name: 'Lifestyle',
      icon: 'heart',
      recommendations,
    };
  }

  /**
   * Generate nutrition recommendations
   */
  private async generateNutritionRecommendations(
    patientData: any
  ): Promise<RecommendationCategory> {
    const recommendations: Recommendation[] = [];

    // Heart-healthy diet
    if (patientData.cholesterol > 200 || patientData.hasCardiovascularRisk) {
      recommendations.push({
        id: 'nutrition-heart-1',
        title: 'Adopt Heart-Healthy Diet',
        description: 'A heart-healthy diet can lower cholesterol and reduce cardiovascular risk.',
        category: 'nutrition',
        priority: 'high',
        actionable: true,
        steps: [
          'Follow Mediterranean or DASH diet pattern',
          'Eat 5+ servings of fruits and vegetables daily',
          'Choose whole grains over refined grains',
          'Limit saturated fat to <7% of calories',
          'Eat fatty fish (salmon, mackerel) 2x per week',
          'Reduce sodium to <2,300 mg/day',
        ],
        expectedBenefit: 'Can lower LDL cholesterol by 10-15% and reduce heart disease risk by 30%',
        timeframe: '3-6 months',
        difficulty: 'moderate',
        evidence: {
          level: 'systematic-review',
          sources: ['AHA Diet Guidelines', 'DASH Diet Studies'],
          confidence: 95,
        },
        status: 'pending',
      });
    }

    // Diabetes-friendly diet
    if (patientData.hasDiabetes || patientData.hasPrediabetes) {
      recommendations.push({
        id: 'nutrition-diabetes-1',
        title: 'Follow Diabetes-Friendly Diet',
        description: 'Proper nutrition is key to managing blood sugar levels and preventing complications.',
        category: 'nutrition',
        priority: 'high',
        actionable: true,
        steps: [
          'Choose low glycemic index foods',
          'Control portion sizes',
          'Eat regular meals at consistent times',
          'Limit refined carbohydrates and added sugars',
          'Include protein and healthy fats with each meal',
          'Monitor carbohydrate intake',
        ],
        expectedBenefit: 'Better blood sugar control, reduced HbA1c by 0.5-1.0%',
        timeframe: '3-6 months',
        difficulty: 'moderate',
        evidence: {
          level: 'clinical-trial',
          sources: ['ADA Nutrition Guidelines', 'Diabetes Prevention Program'],
          confidence: 90,
        },
        status: 'pending',
      });
    }

    // General healthy eating
    recommendations.push({
      id: 'nutrition-general-1',
      title: 'Improve Overall Diet Quality',
      description: 'A balanced, nutritious diet supports overall health and disease prevention.',
      category: 'nutrition',
      priority: 'medium',
      actionable: true,
      steps: [
        'Eat a variety of colorful fruits and vegetables',
        'Choose lean proteins (poultry, fish, legumes)',
        'Include healthy fats (nuts, avocado, olive oil)',
        'Stay hydrated with water',
        'Limit processed foods and added sugars',
        'Practice mindful eating',
      ],
      expectedBenefit: 'Improved energy, better weight management, reduced disease risk',
      timeframe: '1-3 months',
      difficulty: 'easy',
      evidence: {
        level: 'observational',
        sources: ['Dietary Guidelines for Americans', 'WHO Healthy Diet'],
        confidence: 85,
        },
      status: 'pending',
    });

    return {
      name: 'Nutrition',
      icon: 'apple',
      recommendations,
    };
  }

  /**
   * Generate exercise recommendations
   */
  private async generateExerciseRecommendations(
    patientData: any
  ): Promise<RecommendationCategory> {
    const recommendations: Recommendation[] = [];

    // Aerobic exercise
    if (patientData.physicalActivity === 'sedentary' || patientData.physicalActivity === 'light') {
      recommendations.push({
        id: 'exercise-aerobic-1',
        title: 'Start Regular Aerobic Exercise',
        description: 'Regular physical activity is one of the most important things you can do for your health.',
        category: 'exercise',
        priority: 'high',
        actionable: true,
        steps: [
          'Start with 10-15 minutes of walking daily',
          'Gradually increase to 150 minutes per week',
          'Choose activities you enjoy (walking, swimming, cycling)',
          'Break it up into 10-minute sessions if needed',
          'Use a fitness tracker to monitor progress',
          'Find an exercise buddy for motivation',
        ],
        expectedBenefit: 'Reduces risk of heart disease, diabetes, and depression by 30-40%',
        timeframe: '2-3 months',
        difficulty: 'moderate',
        evidence: {
          level: 'systematic-review',
          sources: ['CDC Physical Activity Guidelines', 'AHA Exercise Recommendations'],
          confidence: 95,
        },
        status: 'pending',
      });
    }

    // Strength training
    recommendations.push({
      id: 'exercise-strength-1',
      title: 'Add Strength Training',
      description: 'Strength training builds muscle, strengthens bones, and improves metabolism.',
      category: 'exercise',
      priority: 'medium',
      actionable: true,
      steps: [
        'Start with bodyweight exercises (squats, push-ups)',
        'Progress to resistance bands or light weights',
        'Train all major muscle groups 2-3x per week',
        'Allow rest days between sessions',
        'Consider working with a personal trainer initially',
      ],
      expectedBenefit: 'Increased muscle mass, stronger bones, better balance, improved metabolism',
      timeframe: '3-6 months',
      difficulty: 'moderate',
      evidence: {
        level: 'clinical-trial',
        sources: ['ACSM Strength Training Guidelines', 'NIH Exercise Studies'],
        confidence: 85,
      },
      status: 'pending',
    });

    // Flexibility and balance
    if (patientData.age >= 65) {
      recommendations.push({
        id: 'exercise-balance-1',
        title: 'Improve Balance and Flexibility',
        description: 'Balance and flexibility exercises reduce fall risk and maintain independence.',
        category: 'exercise',
        priority: 'medium',
        actionable: true,
        steps: [
          'Practice standing on one foot daily',
          'Try tai chi or yoga classes',
          'Stretch major muscle groups daily',
          'Use balance exercises from physical therapist',
          'Remove fall hazards at home',
        ],
        expectedBenefit: 'Reduced fall risk by 30%, better mobility and independence',
        timeframe: '2-3 months',
        difficulty: 'easy',
        evidence: {
          level: 'clinical-trial',
          sources: ['CDC Fall Prevention', 'AGS Balance Guidelines'],
          confidence: 80,
        },
        status: 'pending',
      });
    }

    return {
      name: 'Exercise',
      icon: 'dumbbell',
      recommendations,
    };
  }

  /**
   * Generate sleep recommendations
   */
  private async generateSleepRecommendations(
    patientData: any
  ): Promise<RecommendationCategory> {
    const recommendations: Recommendation[] = [];

    if (patientData.sleepQuality === 'poor' || patientData.sleepHours < 7) {
      recommendations.push({
        id: 'sleep-hygiene-1',
        title: 'Improve Sleep Quality',
        description: 'Quality sleep is essential for physical health, mental health, and quality of life.',
        category: 'sleep',
        priority: 'high',
        actionable: true,
        steps: [
          'Maintain consistent sleep schedule (same bedtime/wake time)',
          'Create relaxing bedtime routine',
          'Keep bedroom cool, dark, and quiet',
          'Avoid screens 1 hour before bed',
          'Limit caffeine after 2 PM',
          'Avoid large meals close to bedtime',
          'Get regular exercise (but not close to bedtime)',
        ],
        expectedBenefit: 'Better energy, improved mood, stronger immune system, reduced disease risk',
        timeframe: '2-4 weeks',
        difficulty: 'moderate',
        evidence: {
          level: 'clinical-trial',
          sources: ['Sleep Foundation Guidelines', 'AASM Sleep Hygiene'],
          confidence: 85,
        },
        status: 'pending',
      });
    }

    return {
      name: 'Sleep',
      icon: 'moon',
      recommendations,
    };
  }

  /**
   * Generate stress management recommendations
   */
  private async generateStressManagementRecommendations(
    patientData: any
  ): Promise<RecommendationCategory> {
    const recommendations: Recommendation[] = [];

    if (patientData.stressLevel === 'high') {
      recommendations.push({
        id: 'stress-management-1',
        title: 'Reduce Stress Levels',
        description: 'Chronic stress can harm your physical and mental health. Learning to manage stress is crucial.',
        category: 'stress-management',
        priority: 'high',
        actionable: true,
        steps: [
          'Practice daily relaxation techniques (deep breathing, meditation)',
          'Try mindfulness or yoga',
          'Identify and address sources of stress',
          'Set boundaries and learn to say no',
          'Make time for hobbies and activities you enjoy',
          'Consider counseling or therapy if needed',
        ],
        expectedBenefit: 'Lower blood pressure, better sleep, improved mood, reduced anxiety',
        timeframe: '1-3 months',
        difficulty: 'moderate',
        evidence: {
          level: 'clinical-trial',
          sources: ['APA Stress Management', 'Mindfulness Research'],
          confidence: 80,
        },
        status: 'pending',
      });
    }

    return {
      name: 'Stress Management',
      icon: 'brain',
      recommendations,
    };
  }

  /**
   * Generate preventive care recommendations
   */
  private async generatePreventiveCareRecommendations(
    patientData: any
  ): Promise<RecommendationCategory> {
    const recommendations: Recommendation[] = [];
    const age = patientData.age;
    const gender = patientData.gender;

    // Colorectal cancer screening
    if (age >= 45 && age <= 75) {
      recommendations.push({
        id: 'preventive-colorectal-1',
        title: 'Colorectal Cancer Screening',
        description: 'Regular screening can prevent colorectal cancer or detect it early when treatment is most effective.',
        category: 'preventive-care',
        priority: 'high',
        actionable: true,
        steps: [
          'Discuss screening options with your doctor',
          'Choose between colonoscopy (every 10 years) or FIT test (annually)',
          'Schedule your screening appointment',
          'Follow preparation instructions carefully',
        ],
        expectedBenefit: 'Can prevent up to 60% of colorectal cancer deaths',
        timeframe: 'Schedule within 3 months',
        difficulty: 'easy',
        evidence: {
          level: 'systematic-review',
          sources: ['USPSTF Colorectal Screening', 'ACS Screening Guidelines'],
          confidence: 95,
        },
        status: 'pending',
      });
    }

    // Mammography for women
    if (gender === 'female' && age >= 40) {
      recommendations.push({
        id: 'preventive-mammogram-1',
        title: 'Breast Cancer Screening',
        description: 'Regular mammograms can detect breast cancer early when it is most treatable.',
        category: 'preventive-care',
        priority: 'high',
        actionable: true,
        steps: [
          'Schedule annual mammogram',
          'Perform monthly breast self-exams',
          'Report any changes to your doctor',
        ],
        expectedBenefit: 'Early detection improves survival rates by 25-30%',
        timeframe: 'Schedule within 1 month',
        difficulty: 'easy',
        evidence: {
          level: 'systematic-review',
          sources: ['USPSTF Breast Cancer Screening', 'ACS Mammography Guidelines'],
          confidence: 90,
        },
        status: 'pending',
      });
    }

    // Vaccinations
    recommendations.push({
      id: 'preventive-vaccines-1',
      title: 'Stay Up-to-Date on Vaccinations',
      description: 'Vaccines protect you and others from serious diseases.',
      category: 'preventive-care',
      priority: 'medium',
      actionable: true,
      steps: [
        'Get annual flu vaccine',
        'Ensure COVID-19 vaccination is current',
        'Get shingles vaccine if age 50+',
        'Get pneumonia vaccine if age 65+ or high-risk',
        'Review vaccination record with doctor',
      ],
      expectedBenefit: 'Prevents serious illness and complications',
      timeframe: 'Schedule within 1 month',
      difficulty: 'easy',
      evidence: {
        level: 'systematic-review',
        sources: ['CDC Vaccination Schedule', 'ACIP Recommendations'],
        confidence: 95,
      },
      status: 'pending',
    });

    return {
      name: 'Preventive Care',
      icon: 'shield',
      recommendations,
    };
  }

  /**
   * Generate medication adherence recommendations
   */
  private async generateMedicationAdherenceRecommendations(
    patientData: any
  ): Promise<RecommendationCategory> {
    const recommendations: Recommendation[] = [];

    if (patientData.medications && patientData.medications.length > 0) {
      recommendations.push({
        id: 'medication-adherence-1',
        title: 'Take Medications as Prescribed',
        description: 'Taking medications correctly is crucial for managing your health conditions.',
        category: 'medication-adherence',
        priority: 'high',
        actionable: true,
        steps: [
          'Use pill organizer or medication reminder app',
          'Set daily alarms for medication times',
          'Keep medications in visible location',
          'Refill prescriptions before running out',
          'Discuss any side effects with doctor',
          'Never stop medications without consulting doctor',
        ],
        expectedBenefit: 'Better disease control, reduced complications, improved outcomes',
        timeframe: 'Start immediately',
        difficulty: 'easy',
        evidence: {
          level: 'systematic-review',
          sources: ['WHO Medication Adherence', 'AHA Adherence Guidelines'],
          confidence: 90,
        },
        status: 'pending',
      });
    }

    return {
      name: 'Medication Adherence',
      icon: 'pill',
      recommendations,
    };
  }

  /**
   * Generate monitoring recommendations
   */
  private async generateMonitoringRecommendations(
    patientData: any
  ): Promise<RecommendationCategory> {
    const recommendations: Recommendation[] = [];

    // Blood pressure monitoring
    if (patientData.hasHypertension || patientData.bloodPressure > 130) {
      recommendations.push({
        id: 'monitoring-bp-1',
        title: 'Monitor Blood Pressure at Home',
        description: 'Regular home blood pressure monitoring helps track treatment effectiveness.',
        category: 'monitoring',
        priority: 'high',
        actionable: true,
        steps: [
          'Purchase validated home blood pressure monitor',
          'Measure blood pressure twice daily',
          'Record readings in log or app',
          'Share readings with doctor at visits',
          'Report consistently high readings promptly',
        ],
        expectedBenefit: 'Better blood pressure control, early detection of problems',
        timeframe: 'Start within 1 week',
        difficulty: 'easy',
        evidence: {
          level: 'clinical-trial',
          sources: ['AHA Home BP Monitoring', 'USPSTF Hypertension Screening'],
          confidence: 85,
        },
        status: 'pending',
      });
    }

    // Blood glucose monitoring
    if (patientData.hasDiabetes) {
      recommendations.push({
        id: 'monitoring-glucose-1',
        title: 'Monitor Blood Glucose Regularly',
        description: 'Regular glucose monitoring is essential for diabetes management.',
        category: 'monitoring',
        priority: 'high',
        actionable: true,
        steps: [
          'Check blood glucose as recommended by doctor',
          'Keep log of readings and patterns',
          'Note factors affecting glucose (meals, exercise, stress)',
          'Adjust diet and activity based on patterns',
          'Report concerning patterns to doctor',
        ],
        expectedBenefit: 'Better glucose control, reduced complications, lower HbA1c',
        timeframe: 'Start immediately',
        difficulty: 'moderate',
        evidence: {
          level: 'systematic-review',
          sources: ['ADA Glucose Monitoring', 'AACE Diabetes Guidelines'],
          confidence: 95,
        },
        status: 'pending',
      });
    }

    return {
      name: 'Monitoring',
      icon: 'activity',
      recommendations,
    };
  }

  /**
   * Helper methods
   */

  private async fetchPatientData(patientId: string): Promise<any> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        labResults: {
          orderBy: { resultDate: 'desc' },
          take: 20,
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

    const latestVitals = patient.vitalSigns[0];
    const age = this.calculateAge(patient.dateOfBirth);

    return {
      age,
      gender: patient.gender,
      bmi: latestVitals?.bmi,
      bloodPressure: latestVitals?.bloodPressureSystolic,
      cholesterol: this.getLatestLabValue(patient.labResults, 'cholesterol'),
      hasDiabetes: patient.conditions.some((c) => c.code?.includes('E11')),
      hasPrediabetes: this.getLatestLabValue(patient.labResults, 'hba1c') >= 5.7,
      hasHypertension: patient.conditions.some((c) => c.code?.includes('I10')),
      hasCardiovascularRisk: patient.conditions.some((c) => c.code?.includes('I')),
      smokingStatus: patient.smokingStatus,
      alcoholConsumption: patient.alcoholConsumption,
      physicalActivity: patient.physicalActivity,
      sleepQuality: patient.sleepQuality,
      sleepHours: patient.sleepHours,
      stressLevel: patient.stressLevel,
      medications: patient.medications,
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

  private extractPriorityActions(categories: RecommendationCategory[]): Recommendation[] {
    const allRecommendations: Recommendation[] = [];
    categories.forEach((cat) => {
      allRecommendations.push(...cat.recommendations);
    });

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return allRecommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 5); // Top 5 priority actions
  }

  private generateLongTermGoals(
    patientData: any,
    categories: RecommendationCategory[]
  ): Goal[] {
    const goals: Goal[] = [];

    // Weight loss goal
    if (patientData.bmi >= 25) {
      const targetBMI = 24.9;
      const currentWeight = patientData.bmi * 0.45; // Simplified calculation
      const targetWeight = targetBMI * 0.45;
      const weightLoss = currentWeight - targetWeight;

      goals.push({
        id: 'goal-weight-1',
        title: 'Achieve Healthy Weight',
        description: `Lose ${weightLoss.toFixed(1)} lbs to reach healthy BMI`,
        category: 'Weight Management',
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        milestones: [
          {
            id: 'milestone-weight-1',
            title: 'Lose first 5 lbs',
            description: 'Initial weight loss milestone',
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            completed: false,
          },
          {
            id: 'milestone-weight-2',
            title: 'Lose 10% of body weight',
            description: 'Significant health improvement milestone',
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            completed: false,
          },
        ],
        progress: 0,
        status: 'not-started',
      });
    }

    // Exercise goal
    if (patientData.physicalActivity === 'sedentary') {
      goals.push({
        id: 'goal-exercise-1',
        title: 'Establish Regular Exercise Routine',
        description: 'Build up to 150 minutes of moderate exercise per week',
        category: 'Physical Activity',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        milestones: [
          {
            id: 'milestone-exercise-1',
            title: 'Exercise 3 days per week',
            description: 'Establish consistent exercise habit',
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            completed: false,
          },
          {
            id: 'milestone-exercise-2',
            title: 'Reach 150 minutes per week',
            description: 'Meet recommended activity level',
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            completed: false,
          },
        ],
        progress: 0,
        status: 'not-started',
      });
    }

    // Diabetes prevention goal
    if (patientData.hasPrediabetes) {
      goals.push({
        id: 'goal-diabetes-1',
        title: 'Prevent Type 2 Diabetes',
        description: 'Lower HbA1c to normal range through lifestyle changes',
        category: 'Diabetes Prevention',
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        milestones: [
          {
            id: 'milestone-diabetes-1',
            title: 'Complete diabetes prevention program',
            description: 'Finish structured prevention program',
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            completed: false,
          },
          {
            id: 'milestone-diabetes-2',
            title: 'Reduce HbA1c by 0.5%',
            description: 'Measurable improvement in glucose control',
            targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            completed: false,
          },
        ],
        progress: 0,
        status: 'not-started',
      });
    }

    return goals;
  }

  private curateResources(categories: RecommendationCategory[]): Resource[] {
    const resources: Resource[] = [
      // General health
      {
        id: 'resource-1',
        title: 'CDC Healthy Living',
        type: 'website',
        url: 'https://www.cdc.gov/healthyliving/index.html',
        description: 'Comprehensive health information and resources',
        relevance: 90,
        category: 'General Health',
      },
      {
        id: 'resource-2',
        title: 'MyFitnessPal',
        type: 'app',
        url: 'https://www.myfitnesspal.com',
        description: 'Track nutrition and exercise',
        relevance: 85,
        category: 'Nutrition & Exercise',
      },
      {
        id: 'resource-3',
        title: 'Headspace',
        type: 'app',
        url: 'https://www.headspace.com',
        description: 'Meditation and mindfulness app',
        relevance: 80,
        category: 'Mental Health',
      },
      {
        id: 'resource-4',
        title: 'American Heart Association',
        type: 'website',
        url: 'https://www.heart.org',
        description: 'Heart health information and resources',
        relevance: 85,
        category: 'Cardiovascular Health',
      },
      {
        id: 'resource-5',
        title: 'Diabetes Prevention Program',
        type: 'website',
        url: 'https://www.cdc.gov/diabetes/prevention',
        description: 'Evidence-based diabetes prevention program',
        relevance: 90,
        category: 'Diabetes Prevention',
      },
    ];

    return resources;
  }
}

export default new PersonalizedRecommendationsService();