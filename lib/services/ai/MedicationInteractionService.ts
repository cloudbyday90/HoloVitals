/**
 * Medication Interaction Service
 * AI-powered medication interaction detection and analysis
 */

import { PrismaClient } from '@prisma/client';
import {
  MedicationInteractionAnalysis,
  MedicationInfo,
  DrugInteraction,
  MedicationWarning,
  InteractionType,
  WarningType,
} from '@/lib/types/ai-insights';

const prisma = new PrismaClient();

export class MedicationInteractionService {
  // Drug interaction database (simplified - in production, use comprehensive drug database)
  private interactionDatabase = {
    // Drug-Drug Interactions
    'warfarin-aspirin': {
      severity: 'major' as const,
      description: 'Increased risk of bleeding',
      clinicalEffects: ['Gastrointestinal bleeding', 'Intracranial hemorrhage'],
      management: 'Avoid combination if possible. If necessary, monitor INR closely and watch for signs of bleeding.',
    },
    'warfarin-nsaid': {
      severity: 'major' as const,
      description: 'Increased risk of bleeding',
      clinicalEffects: ['Gastrointestinal bleeding', 'Increased INR'],
      management: 'Use alternative pain management. If necessary, use lowest effective dose and monitor closely.',
    },
    'ace_inhibitor-potassium': {
      severity: 'moderate' as const,
      description: 'Risk of hyperkalemia',
      clinicalEffects: ['Elevated potassium levels', 'Cardiac arrhythmias'],
      management: 'Monitor potassium levels regularly. Avoid potassium supplements unless specifically indicated.',
    },
    'statin-fibrate': {
      severity: 'moderate' as const,
      description: 'Increased risk of myopathy',
      clinicalEffects: ['Muscle pain', 'Rhabdomyolysis', 'Elevated CK levels'],
      management: 'Use with caution. Monitor for muscle symptoms and CK levels.',
    },
    'ssri-nsaid': {
      severity: 'moderate' as const,
      description: 'Increased bleeding risk',
      clinicalEffects: ['Gastrointestinal bleeding', 'Bruising'],
      management: 'Consider gastroprotection with PPI. Monitor for bleeding signs.',
    },
    'metformin-contrast': {
      severity: 'major' as const,
      description: 'Risk of lactic acidosis',
      clinicalEffects: ['Lactic acidosis', 'Acute kidney injury'],
      management: 'Hold metformin 48 hours before and after contrast administration. Check renal function.',
    },
    'digoxin-diuretic': {
      severity: 'moderate' as const,
      description: 'Risk of digoxin toxicity',
      clinicalEffects: ['Hypokalemia', 'Digoxin toxicity', 'Arrhythmias'],
      management: 'Monitor potassium and digoxin levels. Replace potassium as needed.',
    },
    'maoi-ssri': {
      severity: 'contraindicated' as const,
      description: 'Serotonin syndrome risk',
      clinicalEffects: ['Serotonin syndrome', 'Hyperthermia', 'Seizures', 'Death'],
      management: 'Contraindicated. Allow 2-week washout period between medications.',
    },
  };

  /**
   * Analyze medication interactions for a patient
   */
  async analyzeMedicationInteractions(patientId: string): Promise<MedicationInteractionAnalysis> {
    // Fetch active medications
    const medications = await this.fetchActiveMedications(patientId);

    if (medications.length === 0) {
      return {
        patientId,
        analysisDate: new Date(),
        medications: [],
        interactions: [],
        warnings: [],
        recommendations: ['No active medications to analyze'],
        overallSafety: 'safe',
      };
    }

    // Check for drug-drug interactions
    const drugDrugInteractions = this.checkDrugDrugInteractions(medications);

    // Check for drug-disease interactions
    const drugDiseaseInteractions = await this.checkDrugDiseaseInteractions(patientId, medications);

    // Check for drug-allergy interactions
    const drugAllergyWarnings = await this.checkDrugAllergyInteractions(patientId, medications);

    // Check for other warnings
    const otherWarnings = this.checkOtherWarnings(patientId, medications);

    // Combine all interactions and warnings
    const allInteractions = [...drugDrugInteractions, ...drugDiseaseInteractions];
    const allWarnings = [...drugAllergyWarnings, ...otherWarnings];

    // Determine overall safety
    const overallSafety = this.determineOverallSafety(allInteractions, allWarnings);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allInteractions, allWarnings);

    return {
      patientId,
      analysisDate: new Date(),
      medications,
      interactions: allInteractions,
      warnings: allWarnings,
      recommendations,
      overallSafety,
    };
  }

  /**
   * Check specific drug interaction
   */
  async checkSpecificInteraction(
    medication1: string,
    medication2: string
  ): Promise<DrugInteraction | null> {
    const key1 = this.normalizeInteractionKey(medication1, medication2);
    const key2 = this.normalizeInteractionKey(medication2, medication1);

    const interaction = this.interactionDatabase[key1] || this.interactionDatabase[key2];

    if (!interaction) return null;

    return {
      id: `interaction-${Date.now()}`,
      medications: [medication1, medication2],
      severity: interaction.severity,
      type: 'drug-drug',
      description: interaction.description,
      clinicalEffects: interaction.clinicalEffects,
      management: interaction.management,
      sources: ['Drug Interaction Database', 'Clinical Pharmacology'],
      evidenceLevel: 'high',
    };
  }

  /**
   * Fetch active medications for a patient
   */
  private async fetchActiveMedications(patientId: string): Promise<MedicationInfo[]> {
    const medications = await prisma.medication.findMany({
      where: {
        patientId,
        status: 'active',
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return medications.map((med) => ({
      id: med.id,
      name: med.name,
      genericName: med.genericName || med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      startDate: med.startDate,
      endDate: med.endDate || undefined,
      prescriber: med.prescriber || 'Unknown',
      indication: med.indication || 'Not specified',
    }));
  }

  /**
   * Check for drug-drug interactions
   */
  private checkDrugDrugInteractions(medications: MedicationInfo[]): DrugInteraction[] {
    const interactions: DrugInteraction[] = [];

    // Check all pairs of medications
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const med1 = medications[i];
        const med2 = medications[j];

        const interaction = this.findInteraction(med1.genericName, med2.genericName);
        if (interaction) {
          interactions.push({
            id: `interaction-${i}-${j}`,
            medications: [med1.name, med2.name],
            severity: interaction.severity,
            type: 'drug-drug',
            description: interaction.description,
            clinicalEffects: interaction.clinicalEffects,
            management: interaction.management,
            sources: ['Drug Interaction Database', 'Clinical Pharmacology'],
            evidenceLevel: 'high',
          });
        }
      }
    }

    return interactions;
  }

  /**
   * Check for drug-disease interactions
   */
  private async checkDrugDiseaseInteractions(
    patientId: string,
    medications: MedicationInfo[]
  ): Promise<DrugInteraction[]> {
    const interactions: DrugInteraction[] = [];

    // Fetch patient conditions
    const conditions = await prisma.condition.findMany({
      where: {
        patientId,
        clinicalStatus: 'active',
      },
    });

    // Check each medication against conditions
    medications.forEach((med) => {
      conditions.forEach((condition) => {
        const interaction = this.checkDrugDiseaseInteraction(med.genericName, condition.code || '');
        if (interaction) {
          interactions.push({
            id: `drug-disease-${med.id}-${condition.id}`,
            medications: [med.name],
            severity: interaction.severity,
            type: 'drug-disease',
            description: `${med.name} may be contraindicated in ${condition.description}`,
            clinicalEffects: interaction.effects,
            management: interaction.management,
            sources: ['Clinical Guidelines', 'Drug Prescribing Information'],
            evidenceLevel: 'moderate',
          });
        }
      });
    });

    return interactions;
  }

  /**
   * Check for drug-allergy interactions
   */
  private async checkDrugAllergyInteractions(
    patientId: string,
    medications: MedicationInfo[]
  ): Promise<MedicationWarning[]> {
    const warnings: MedicationWarning[] = [];

    // Fetch patient allergies
    const allergies = await prisma.allergy.findMany({
      where: {
        patientId,
      },
    });

    // Check each medication against allergies
    medications.forEach((med) => {
      allergies.forEach((allergy) => {
        if (this.isAllergyMatch(med.genericName, allergy.allergen)) {
          warnings.push({
            id: `allergy-${med.id}-${allergy.id}`,
            medication: med.name,
            warningType: 'allergy',
            severity: allergy.severity === 'severe' ? 'critical' : 'high',
            message: `Patient has documented allergy to ${allergy.allergen}`,
            action: 'Discontinue medication immediately and use alternative',
            urgent: true,
          });
        }
      });
    });

    return warnings;
  }

  /**
   * Check for other medication warnings
   */
  private checkOtherWarnings(patientId: string, medications: MedicationInfo[]): MedicationWarning[] {
    const warnings: MedicationWarning[] = [];

    // Check for duplicate therapy
    const drugClasses = new Map<string, MedicationInfo[]>();
    medications.forEach((med) => {
      const drugClass = this.getDrugClass(med.genericName);
      if (!drugClasses.has(drugClass)) {
        drugClasses.set(drugClass, []);
      }
      drugClasses.get(drugClass)!.push(med);
    });

    drugClasses.forEach((meds, drugClass) => {
      if (meds.length > 1 && drugClass !== 'other') {
        warnings.push({
          id: `duplicate-${drugClass}`,
          medication: meds.map((m) => m.name).join(', '),
          warningType: 'duplicate-therapy',
          severity: 'moderate',
          message: `Multiple medications from the same class (${drugClass})`,
          action: 'Review for potential duplicate therapy',
          urgent: false,
        });
      }
    });

    // Check for high-risk medications
    medications.forEach((med) => {
      if (this.isHighRiskMedication(med.genericName)) {
        warnings.push({
          id: `high-risk-${med.id}`,
          medication: med.name,
          warningType: 'monitoring-required',
          severity: 'high',
          message: 'High-risk medication requiring close monitoring',
          action: 'Ensure appropriate monitoring and follow-up',
          urgent: false,
        });
      }
    });

    return warnings;
  }

  /**
   * Helper methods
   */

  private normalizeInteractionKey(med1: string, med2: string): string {
    const normalize = (name: string) => {
      name = name.toLowerCase().trim();
      // Map to generic drug classes
      if (name.includes('warfarin')) return 'warfarin';
      if (name.includes('aspirin')) return 'aspirin';
      if (name.includes('ibuprofen') || name.includes('naproxen')) return 'nsaid';
      if (name.includes('lisinopril') || name.includes('enalapril')) return 'ace_inhibitor';
      if (name.includes('potassium')) return 'potassium';
      if (name.includes('atorvastatin') || name.includes('simvastatin')) return 'statin';
      if (name.includes('fenofibrate') || name.includes('gemfibrozil')) return 'fibrate';
      if (name.includes('sertraline') || name.includes('fluoxetine')) return 'ssri';
      if (name.includes('metformin')) return 'metformin';
      if (name.includes('digoxin')) return 'digoxin';
      if (name.includes('furosemide') || name.includes('hydrochlorothiazide')) return 'diuretic';
      if (name.includes('phenelzine') || name.includes('tranylcypromine')) return 'maoi';
      return name;
    };

    const norm1 = normalize(med1);
    const norm2 = normalize(med2);
    return [norm1, norm2].sort().join('-');
  }

  private findInteraction(med1: string, med2: string): any {
    const key = this.normalizeInteractionKey(med1, med2);
    return this.interactionDatabase[key];
  }

  private checkDrugDiseaseInteraction(
    medication: string,
    conditionCode: string
  ): { severity: DrugInteraction['severity']; effects: string[]; management: string } | null {
    const med = medication.toLowerCase();

    // NSAIDs and heart failure
    if ((med.includes('ibuprofen') || med.includes('naproxen')) && conditionCode.includes('I50')) {
      return {
        severity: 'moderate',
        effects: ['Fluid retention', 'Worsening heart failure'],
        management: 'Use alternative pain management. If necessary, use lowest dose and monitor closely.',
      };
    }

    // Beta-blockers and asthma
    if (med.includes('metoprolol') && conditionCode.includes('J45')) {
      return {
        severity: 'moderate',
        effects: ['Bronchospasm', 'Worsening asthma'],
        management: 'Use cardioselective beta-blocker with caution. Consider alternative.',
      };
    }

    // Metformin and kidney disease
    if (med.includes('metformin') && conditionCode.includes('N18')) {
      return {
        severity: 'major',
        effects: ['Lactic acidosis', 'Acute kidney injury'],
        management: 'Contraindicated in severe renal impairment. Check renal function regularly.',
      };
    }

    return null;
  }

  private isAllergyMatch(medication: string, allergen: string): boolean {
    const med = medication.toLowerCase();
    const allergy = allergen.toLowerCase();

    // Direct match
    if (med.includes(allergy) || allergy.includes(med)) {
      return true;
    }

    // Cross-reactivity checks
    if (allergy.includes('penicillin') && med.includes('amoxicillin')) return true;
    if (allergy.includes('sulfa') && med.includes('sulfamethoxazole')) return true;

    return false;
  }

  private getDrugClass(medication: string): string {
    const med = medication.toLowerCase();

    if (med.includes('statin')) return 'statins';
    if (med.includes('pril')) return 'ace-inhibitors';
    if (med.includes('sartan')) return 'arbs';
    if (med.includes('olol')) return 'beta-blockers';
    if (med.includes('dipine')) return 'calcium-channel-blockers';
    if (med.includes('prazole')) return 'ppis';
    if (med.includes('metformin')) return 'biguanides';
    if (med.includes('glipizide') || med.includes('glyburide')) return 'sulfonylureas';

    return 'other';
  }

  private isHighRiskMedication(medication: string): boolean {
    const highRiskMeds = [
      'warfarin',
      'insulin',
      'heparin',
      'digoxin',
      'lithium',
      'methotrexate',
      'phenytoin',
      'carbamazepine',
    ];

    const med = medication.toLowerCase();
    return highRiskMeds.some((hrm) => med.includes(hrm));
  }

  private determineOverallSafety(
    interactions: DrugInteraction[],
    warnings: MedicationWarning[]
  ): MedicationInteractionAnalysis['overallSafety'] {
    // Check for contraindicated interactions
    if (interactions.some((i) => i.severity === 'contraindicated')) {
      return 'critical';
    }

    // Check for critical warnings
    if (warnings.some((w) => w.severity === 'critical')) {
      return 'critical';
    }

    // Check for major interactions
    if (interactions.some((i) => i.severity === 'major')) {
      return 'warning';
    }

    // Check for high severity warnings
    if (warnings.some((w) => w.severity === 'high')) {
      return 'warning';
    }

    // Check for moderate interactions
    if (interactions.some((i) => i.severity === 'moderate')) {
      return 'caution';
    }

    return 'safe';
  }

  private generateRecommendations(
    interactions: DrugInteraction[],
    warnings: MedicationWarning[]
  ): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    const criticalInteractions = interactions.filter((i) => i.severity === 'contraindicated');
    if (criticalInteractions.length > 0) {
      recommendations.push('URGENT: Contraindicated drug combinations detected - immediate review required');
    }

    const criticalWarnings = warnings.filter((w) => w.severity === 'critical');
    if (criticalWarnings.length > 0) {
      recommendations.push('URGENT: Critical medication warnings detected - immediate action required');
    }

    // Major interactions
    const majorInteractions = interactions.filter((i) => i.severity === 'major');
    if (majorInteractions.length > 0) {
      recommendations.push('Review major drug interactions with prescriber');
      recommendations.push('Consider alternative medications or additional monitoring');
    }

    // Moderate interactions
    const moderateInteractions = interactions.filter((i) => i.severity === 'moderate');
    if (moderateInteractions.length > 0) {
      recommendations.push('Monitor for signs and symptoms of drug interactions');
    }

    // Duplicate therapy
    const duplicateWarnings = warnings.filter((w) => w.warningType === 'duplicate-therapy');
    if (duplicateWarnings.length > 0) {
      recommendations.push('Review medication list for potential duplicate therapy');
    }

    // High-risk medications
    const highRiskWarnings = warnings.filter((w) => w.warningType === 'monitoring-required');
    if (highRiskWarnings.length > 0) {
      recommendations.push('Ensure appropriate monitoring for high-risk medications');
    }

    // General recommendations
    if (interactions.length === 0 && warnings.length === 0) {
      recommendations.push('No significant drug interactions detected');
      recommendations.push('Continue current medication regimen as prescribed');
    } else {
      recommendations.push('Maintain updated medication list');
      recommendations.push('Inform all healthcare providers of current medications');
      recommendations.push('Report any new or worsening symptoms to prescriber');
    }

    return recommendations;
  }
}

export default new MedicationInteractionService();