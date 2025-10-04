/**
 * TypeScript interfaces for Clinical Data Viewer & Analysis Dashboard
 */

// ============================================================================
// Lab Results Types
// ============================================================================

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  loincCode: string;
  value: string | number;
  unit: string;
  referenceRange: ReferenceRange;
  interpretation: LabInterpretation;
  flags: string[];
  performedDate: Date;
  resultDate: Date;
  orderingProvider: string;
  performingLab: string;
  status: LabStatus;
  notes?: string;
}

export interface ReferenceRange {
  low?: number;
  high?: number;
  text?: string;
  ageGroup?: string;
  gender?: string;
}

export enum LabInterpretation {
  NORMAL = 'NORMAL',
  LOW = 'LOW',
  HIGH = 'HIGH',
  CRITICAL_LOW = 'CRITICAL_LOW',
  CRITICAL_HIGH = 'CRITICAL_HIGH',
  ABNORMAL = 'ABNORMAL',
}

export enum LabStatus {
  PRELIMINARY = 'PRELIMINARY',
  FINAL = 'FINAL',
  CORRECTED = 'CORRECTED',
  CANCELLED = 'CANCELLED',
}

export interface LabTrendData {
  date: Date;
  value: number;
  interpretation: LabInterpretation;
}

export interface LabResultsFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  testTypes?: string[];
  providers?: string[];
  interpretations?: LabInterpretation[];
  searchQuery?: string;
}

// ============================================================================
// Medication Types
// ============================================================================

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  genericName?: string;
  brandName?: string;
  rxNormCode?: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  prescribedDate: Date;
  purpose?: string;
  instructions?: string;
  status: MedicationStatus;
  refillsRemaining?: number;
  lastRefillDate?: Date;
  pharmacy?: string;
  interactions?: MedicationInteraction[];
}

export enum MedicationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DISCONTINUED = 'DISCONTINUED',
  ON_HOLD = 'ON_HOLD',
  ENTERED_IN_ERROR = 'ENTERED_IN_ERROR',
}

export interface MedicationInteraction {
  medicationId: string;
  medicationName: string;
  severity: InteractionSeverity;
  description: string;
  recommendation?: string;
}

export enum InteractionSeverity {
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  MAJOR = 'MAJOR',
  CONTRAINDICATED = 'CONTRAINDICATED',
}

export interface MedicationSchedule {
  medicationId: string;
  times: string[];
  daysOfWeek?: number[];
  withFood?: boolean;
  specialInstructions?: string;
}

// ============================================================================
// Health Timeline Types
// ============================================================================

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  date: Date;
  provider?: string;
  location?: string;
  category: string;
  status?: string;
  relatedEvents?: string[];
  metadata?: Record<string, any>;
}

export enum TimelineEventType {
  ENCOUNTER = 'ENCOUNTER',
  LAB_RESULT = 'LAB_RESULT',
  MEDICATION = 'MEDICATION',
  PROCEDURE = 'PROCEDURE',
  DIAGNOSIS = 'DIAGNOSIS',
  IMMUNIZATION = 'IMMUNIZATION',
  ALLERGY = 'ALLERGY',
  VITAL_SIGN = 'VITAL_SIGN',
  DOCUMENT = 'DOCUMENT',
}

export interface TimelineFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  eventTypes?: TimelineEventType[];
  categories?: string[];
  providers?: string[];
  searchQuery?: string;
}

// ============================================================================
// Clinical Document Types
// ============================================================================

export interface ClinicalDocument {
  id: string;
  patientId: string;
  title: string;
  type: DocumentType;
  category: string;
  date: Date;
  provider?: string;
  description?: string;
  contentType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  status: DocumentStatus;
  tags?: string[];
  metadata?: Record<string, any>;
}

export enum DocumentType {
  LAB_REPORT = 'LAB_REPORT',
  IMAGING = 'IMAGING',
  CLINICAL_NOTE = 'CLINICAL_NOTE',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY',
  OPERATIVE_REPORT = 'OPERATIVE_REPORT',
  PATHOLOGY = 'PATHOLOGY',
  RADIOLOGY = 'RADIOLOGY',
  PRESCRIPTION = 'PRESCRIPTION',
  REFERRAL = 'REFERRAL',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  AVAILABLE = 'AVAILABLE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
}

// ============================================================================
// Allergy & Condition Types
// ============================================================================

export interface Allergy {
  id: string;
  patientId: string;
  allergen: string;
  type: AllergyType;
  category: string;
  reaction: string[];
  severity: AllergySeverity;
  diagnosedDate?: Date;
  verificationStatus: VerificationStatus;
  notes?: string;
}

export enum AllergyType {
  FOOD = 'FOOD',
  MEDICATION = 'MEDICATION',
  ENVIRONMENT = 'ENVIRONMENT',
  BIOLOGIC = 'BIOLOGIC',
}

export enum AllergySeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  LIFE_THREATENING = 'LIFE_THREATENING',
}

export interface Condition {
  id: string;
  patientId: string;
  condition: string;
  icd10Code?: string;
  snomedCode?: string;
  category: string;
  severity?: ConditionSeverity;
  clinicalStatus: ClinicalStatus;
  verificationStatus: VerificationStatus;
  onsetDate?: Date;
  abatementDate?: Date;
  diagnosedBy?: string;
  notes?: string;
}

export enum ConditionSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
}

export enum ClinicalStatus {
  ACTIVE = 'ACTIVE',
  RECURRENCE = 'RECURRENCE',
  RELAPSE = 'RELAPSE',
  INACTIVE = 'INACTIVE',
  REMISSION = 'REMISSION',
  RESOLVED = 'RESOLVED',
}

export enum VerificationStatus {
  UNCONFIRMED = 'UNCONFIRMED',
  PROVISIONAL = 'PROVISIONAL',
  DIFFERENTIAL = 'DIFFERENTIAL',
  CONFIRMED = 'CONFIRMED',
  REFUTED = 'REFUTED',
  ENTERED_IN_ERROR = 'ENTERED_IN_ERROR',
}

// ============================================================================
// Health Insights Types
// ============================================================================

export interface HealthInsight {
  id: string;
  patientId: string;
  type: InsightType;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: string;
  recommendations: string[];
  relatedData: string[];
  generatedDate: Date;
  expiresDate?: Date;
  dismissed?: boolean;
}

export enum InsightType {
  TREND_ALERT = 'TREND_ALERT',
  RISK_FACTOR = 'RISK_FACTOR',
  MEDICATION_REMINDER = 'MEDICATION_REMINDER',
  PREVENTIVE_CARE = 'PREVENTIVE_CARE',
  LAB_FOLLOWUP = 'LAB_FOLLOWUP',
  INTERACTION_WARNING = 'INTERACTION_WARNING',
  HEALTH_TIP = 'HEALTH_TIP',
}

export enum InsightSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface HealthScore {
  overall: number;
  categories: {
    cardiovascular: number;
    metabolic: number;
    respiratory: number;
    mental: number;
    lifestyle: number;
  };
  trends: {
    category: string;
    change: number;
    period: string;
  }[];
  lastUpdated: Date;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalLabResults: number;
  recentLabResults: number;
  abnormalResults: number;
  activeMedications: number;
  activeConditions: number;
  allergies: number;
  recentDocuments: number;
  upcomingAppointments: number;
}

export interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface ChartDataPoint {
  date: Date;
  value: number;
  label?: string;
  color?: string;
}

export interface ChartConfig {
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  colors?: string[];
}