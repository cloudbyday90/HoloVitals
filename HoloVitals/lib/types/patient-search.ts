/**
 * Customer Search Types
 * Comprehensive type definitions for customer search and management
 */

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  address?: Address;
  medicalRecordNumber: string;
  insuranceInfo?: InsuranceInfo;
  emergencyContact?: EmergencyContact;
  primaryCareProvider?: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  lastVisit?: Date;
  nextAppointment?: Date;
  status: 'active' | 'inactive' | 'deceased';
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberName: string;
  relationship: 'self' | 'spouse' | 'child' | 'other';
  effectiveDate: Date;
  expirationDate?: Date;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface CustomerSearchParams {
  query?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  medicalRecordNumber?: string;
  email?: string;
  phone?: string;
  status?: Customer['status'];
  gender?: Customer['gender'];
  ageMin?: number;
  ageMax?: number;
  hasCondition?: string;
  hasAllergy?: string;
  primaryCareProvider?: string;
  insuranceProvider?: string;
  lastVisitFrom?: Date;
  lastVisitTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: PatientSortField;
  sortOrder?: 'asc' | 'desc';
}

export type PatientSortField =
  | 'lastName'
  | 'firstName'
  | 'dateOfBirth'
  | 'lastVisit'
  | 'nextAppointment'
  | 'createdAt'
  | 'updatedAt';

export interface CustomerSearchResult {
  customers: PatientSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: Date;
  age: number;
  gender: Customer['gender'];
  medicalRecordNumber: string;
  email?: string;
  phone?: string;
  status: Customer['status'];
  lastVisit?: Date;
  nextAppointment?: Date;
  conditionsCount: number;
  medicationsCount: number;
  allergiesCount: number;
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical';
  healthScore?: number;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface PatientFilter {
  id: string;
  name: string;
  type: FilterType;
  value: any;
  operator: FilterOperator;
}

export type FilterType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'range';

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn';

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: PatientFilter[];
  sortBy: PatientSortField;
  sortOrder: 'asc' | 'desc';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CUSTOMER DETAILS TYPES
// ============================================================================

export interface CustomerDetails extends Customer {
  vitalSigns: VitalSign[];
  labResults: LabResult[];
  medications: Medication[];
  conditions: Condition[];
  allergies: Allergy[];
  appointments: Appointment[];
  documents: Document[];
  notes: ClinicalNote[];
}

export interface VitalSign {
  id: string;
  customerId: string;
  recordedAt: Date;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  recordedBy: string;
}

export interface LabResult {
  id: string;
  customerId: string;
  testName: string;
  loincCode?: string;
  value: string;
  unit: string;
  referenceRange?: string;
  flag?: 'normal' | 'low' | 'high' | 'critical';
  resultDate: Date;
  orderedBy: string;
  performedBy?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  customerId: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  prescriber: string;
  indication?: string;
  status: 'active' | 'inactive' | 'discontinued';
  notes?: string;
}

export interface Condition {
  id: string;
  customerId: string;
  code?: string;
  codeSystem?: 'ICD-10' | 'SNOMED-CT';
  description: string;
  onsetDate?: Date;
  resolvedDate?: Date;
  clinicalStatus: 'active' | 'resolved' | 'inactive';
  verificationStatus: 'confirmed' | 'provisional' | 'differential';
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface Allergy {
  id: string;
  customerId: string;
  allergen: string;
  allergenType: 'medication' | 'food' | 'environmental' | 'other';
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  onsetDate?: Date;
  verifiedBy?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  providerId: string;
  providerName: string;
  appointmentType: string;
  scheduledDate: Date;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason?: string;
  notes?: string;
  location?: string;
}

export interface Document {
  id: string;
  customerId: string;
  title: string;
  type: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
  description?: string;
  tags?: string[];
}

export interface ClinicalNote {
  id: string;
  customerId: string;
  encounterId?: string;
  noteType: 'progress' | 'consultation' | 'discharge' | 'procedure' | 'other';
  subject: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  signed: boolean;
  signedAt?: Date;
}

// ============================================================================
// CUSTOMER ACTIONS TYPES
// ============================================================================

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Customer['gender'];
  email?: string;
  phone?: string;
  address?: Address;
  insuranceInfo?: InsuranceInfo;
  emergencyContact?: EmergencyContact;
  primaryCareProvider?: string;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: Customer['gender'];
  email?: string;
  phone?: string;
  address?: Address;
  insuranceInfo?: InsuranceInfo;
  emergencyContact?: EmergencyContact;
  primaryCareProvider?: string;
  status?: Customer['status'];
}

export interface PatientActionResponse {
  success: boolean;
  customer?: Customer;
  error?: string;
}

// ============================================================================
// CUSTOMER STATISTICS TYPES
// ============================================================================

export interface PatientStatistics {
  total: number;
  active: number;
  inactive: number;
  byGender: {
    male: number;
    female: number;
    other: number;
  };
  byAgeGroup: {
    '0-17': number;
    '18-34': number;
    '35-54': number;
    '55-74': number;
    '75+': number;
  };
  byRiskLevel: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  recentVisits: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  upcomingAppointments: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface PatientExportRequest {
  customerIds?: string[];
  filters?: CustomerSearchParams;
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeFields: string[];
}

export interface PatientExportResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}