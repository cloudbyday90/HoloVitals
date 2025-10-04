/**
 * AI-Powered Health Insights Types
 * Comprehensive type definitions for AI health analysis and recommendations
 */

// ============================================================================
// HEALTH SCORE TYPES
// ============================================================================

export interface HealthScore {
  overall: number; // 0-100
  categories: {
    cardiovascular: CategoryScore;
    metabolic: CategoryScore;
    respiratory: CategoryScore;
    mental: CategoryScore;
    lifestyle: CategoryScore;
  };
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
  factors: HealthFactor[];
}

export interface CategoryScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  contributors: string[];
  recommendations: string[];
}

export interface HealthFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
  description: string;
  category: string;
}

// ============================================================================
// RISK ASSESSMENT TYPES
// ============================================================================

export interface RiskAssessment {
  id: string;
  patientId: string;
  assessmentDate: Date;
  overallRisk: RiskLevel;
  risks: HealthRisk[];
  preventiveActions: PreventiveAction[];
  nextAssessmentDate: Date;
}

export interface HealthRisk {
  id: string;
  condition: string;
  riskLevel: RiskLevel;
  probability: number; // 0-100
  timeframe: '1-year' | '5-year' | '10-year' | 'lifetime';
  riskFactors: RiskFactor[];
  evidenceBased: boolean;
  sources: string[];
  mitigationStrategies: string[];
}

export interface RiskFactor {
  name: string;
  category: RiskFactorCategory;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  modifiable: boolean;
  currentValue?: string;
  targetValue?: string;
  impact: number; // 0-100
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type RiskFactorCategory =
  | 'genetic'
  | 'lifestyle'
  | 'environmental'
  | 'medical-history'
  | 'lab-results'
  | 'vital-signs'
  | 'medications'
  | 'age'
  | 'family-history';

export interface PreventiveAction {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'screening' | 'lifestyle' | 'medication' | 'monitoring' | 'consultation';
  estimatedImpact: number; // 0-100
  timeToImplement: string;
  resources: string[];
  completed: boolean;
}

// ============================================================================
// TREND ANALYSIS TYPES
// ============================================================================

export interface TrendAnalysis {
  metric: string;
  category: string;
  timeframe: TimeFrame;
  dataPoints: TrendDataPoint[];
  trend: TrendDirection;
  changeRate: number; // percentage
  prediction: TrendPrediction;
  anomalies: Anomaly[];
  insights: string[];
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  unit: string;
  source: string;
  confidence: number; // 0-1
}

export interface TrendPrediction {
  nextValue: number;
  confidence: number; // 0-1
  timeframe: string;
  methodology: string;
  factors: string[];
}

export interface Anomaly {
  date: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'minor' | 'moderate' | 'significant' | 'critical';
  possibleCauses: string[];
  requiresAction: boolean;
}

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'fluctuating';

export type TimeFrame = '7-days' | '30-days' | '90-days' | '6-months' | '1-year' | 'all-time';

// ============================================================================
// MEDICATION INTERACTION TYPES
// ============================================================================

export interface MedicationInteractionAnalysis {
  patientId: string;
  analysisDate: Date;
  medications: MedicationInfo[];
  interactions: DrugInteraction[];
  warnings: MedicationWarning[];
  recommendations: string[];
  overallSafety: 'safe' | 'caution' | 'warning' | 'critical';
}

export interface MedicationInfo {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescriber: string;
  indication: string;
}

export interface DrugInteraction {
  id: string;
  medications: string[];
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  type: InteractionType;
  description: string;
  clinicalEffects: string[];
  management: string;
  sources: string[];
  evidenceLevel: 'low' | 'moderate' | 'high';
}

export type InteractionType =
  | 'drug-drug'
  | 'drug-food'
  | 'drug-disease'
  | 'drug-lab'
  | 'drug-allergy';

export interface MedicationWarning {
  id: string;
  medication: string;
  warningType: WarningType;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  message: string;
  action: string;
  urgent: boolean;
}

export type WarningType =
  | 'allergy'
  | 'contraindication'
  | 'duplicate-therapy'
  | 'dosage-concern'
  | 'monitoring-required'
  | 'age-related'
  | 'pregnancy'
  | 'renal-adjustment'
  | 'hepatic-adjustment';

// ============================================================================
// LAB RESULT INTERPRETATION TYPES
// ============================================================================

export interface LabInterpretation {
  testId: string;
  testName: string;
  loincCode: string;
  result: LabResult;
  interpretation: Interpretation;
  clinicalSignificance: ClinicalSignificance;
  recommendations: string[];
  relatedTests: string[];
  trends: LabTrend[];
}

export interface LabResult {
  value: number;
  unit: string;
  referenceRange: ReferenceRange;
  flag: 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';
  date: Date;
}

export interface ReferenceRange {
  min: number;
  max: number;
  unit: string;
  ageSpecific?: boolean;
  genderSpecific?: boolean;
}

export interface Interpretation {
  status: 'normal' | 'borderline' | 'abnormal' | 'critical';
  summary: string;
  details: string[];
  possibleCauses: string[];
  clinicalContext: string;
  urgency: 'routine' | 'prompt' | 'urgent' | 'immediate';
}

export interface ClinicalSignificance {
  level: 'low' | 'moderate' | 'high' | 'critical';
  implications: string[];
  associatedConditions: string[];
  followUpRequired: boolean;
  followUpTimeframe?: string;
}

export interface LabTrend {
  testName: string;
  direction: 'improving' | 'stable' | 'worsening';
  dataPoints: number;
  timeSpan: string;
  significance: string;
}

// ============================================================================
// PERSONALIZED RECOMMENDATIONS TYPES
// ============================================================================

export interface PersonalizedRecommendations {
  patientId: string;
  generatedDate: Date;
  categories: RecommendationCategory[];
  priorityActions: Recommendation[];
  longTermGoals: Goal[];
  resources: Resource[];
}

export interface RecommendationCategory {
  name: string;
  icon: string;
  recommendations: Recommendation[];
  progress?: number; // 0-100
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategoryType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  steps: string[];
  expectedBenefit: string;
  timeframe: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  evidence: Evidence;
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
  completedDate?: Date;
}

export type RecommendationCategoryType =
  | 'lifestyle'
  | 'nutrition'
  | 'exercise'
  | 'sleep'
  | 'stress-management'
  | 'preventive-care'
  | 'medication-adherence'
  | 'monitoring'
  | 'specialist-referral'
  | 'mental-health';

export interface Evidence {
  level: 'expert-opinion' | 'observational' | 'clinical-trial' | 'systematic-review';
  sources: string[];
  confidence: number; // 0-100
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: Date;
  milestones: Milestone[];
  progress: number; // 0-100
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  completedDate?: Date;
}

export interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'tool' | 'app' | 'website' | 'support-group';
  url: string;
  description: string;
  relevance: number; // 0-100
  category: string;
}

// ============================================================================
// INSIGHTS TIMELINE TYPES
// ============================================================================

export interface InsightTimeline {
  patientId: string;
  insights: TimelineInsight[];
  filters: TimelineFilters;
}

export interface TimelineInsight {
  id: string;
  date: Date;
  type: InsightType;
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  category: string;
  data?: any;
  actionTaken?: string;
  outcome?: string;
}

export type InsightType =
  | 'risk-detected'
  | 'trend-identified'
  | 'anomaly-found'
  | 'goal-achieved'
  | 'recommendation-generated'
  | 'interaction-detected'
  | 'lab-interpreted'
  | 'health-score-updated';

export interface TimelineFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  types: InsightType[];
  categories: string[];
  severities: ('info' | 'success' | 'warning' | 'critical')[];
}

// ============================================================================
// AI SERVICE CONFIGURATION TYPES
// ============================================================================

export interface AIServiceConfig {
  enableRiskAssessment: boolean;
  enableTrendAnalysis: boolean;
  enableMedicationInteraction: boolean;
  enableLabInterpretation: boolean;
  enableRecommendations: boolean;
  updateFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  confidenceThreshold: number; // 0-1
  alertThresholds: {
    riskLevel: RiskLevel;
    anomalySeverity: string;
    interactionSeverity: string;
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GenerateInsightsRequest {
  patientId: string;
  includeRiskAssessment?: boolean;
  includeTrendAnalysis?: boolean;
  includeMedicationInteraction?: boolean;
  includeLabInterpretation?: boolean;
  includeRecommendations?: boolean;
  timeframe?: TimeFrame;
}

export interface GenerateInsightsResponse {
  success: boolean;
  data: {
    healthScore?: HealthScore;
    riskAssessment?: RiskAssessment;
    trends?: TrendAnalysis[];
    medicationInteractions?: MedicationInteractionAnalysis;
    labInterpretations?: LabInterpretation[];
    recommendations?: PersonalizedRecommendations;
  };
  metadata: {
    generatedAt: Date;
    processingTime: number;
    dataPoints: number;
    confidence: number;
  };
  error?: string;
}

export interface UpdateRecommendationStatusRequest {
  recommendationId: string;
  status: 'in-progress' | 'completed' | 'dismissed';
  notes?: string;
}

export interface UpdateGoalProgressRequest {
  goalId: string;
  progress: number;
  milestoneId?: string;
  notes?: string;
}