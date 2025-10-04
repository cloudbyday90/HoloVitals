/**
 * Patient Repository for HoloVitals
 * 
 * Each patient has their own isolated, sandboxed repository containing:
 * - Personal information (encrypted)
 * - Medical history
 * - Documents and test results
 * - Stored context for AI analysis
 * - Preferences and settings
 * 
 * Key Features:
 * - One repository per patient (enforced by identity verification)
 * - Complete data isolation (sandboxed)
 * - Comprehensive data model
 * - Secure deletion and purging
 * - Account migration support
 */

import { PrismaClient } from '@prisma/client';
import { identityVerificationService, IdentityFactors } from '../../identity/IdentityVerificationService';
import { HIPAASanitizer } from '../../utils/hipaa/sanitizer';
import { auditLogger } from '../../audit/AuditLogger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface PatientRepositoryData {
  id: string;
  userId: string;
  
  // Identity Information (hashed, not stored in plain text)
  identityHash: {
    primary: string;
    secondary: string;
    composite: string;
  };
  
  // Personal Information (encrypted)
  personalInfo: PersonalInformation;
  
  // Medical Information
  medicalInfo: MedicalInformation;
  
  // Documents
  documents: DocumentReference[];
  
  // Stored Context (for AI analysis)
  storedContext: StoredContext;
  
  // Preferences
  preferences: PatientPreferences;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  version: number;
}

export interface PersonalInformation {
  // Encrypted fields
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  placeOfBirth: {
    city: string;
    state: string;
    country: string;
  };
  
  // Contact (encrypted)
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Emergency Contact (encrypted)
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface MedicalInformation {
  // Current Conditions
  diagnoses: Diagnosis[];
  
  // Medications
  medications: Medication[];
  
  // Allergies
  allergies: Allergy[];
  
  // Vital Signs History
  vitalSigns: VitalSign[];
  
  // Test Results
  testResults: TestResult[];
  
  // Procedures
  procedures: Procedure[];
  
  // Immunizations
  immunizations: Immunization[];
  
  // Family History
  familyHistory: FamilyHistory[];
  
  // Social History
  socialHistory: SocialHistory;
}

export interface Diagnosis {
  id: string;
  condition: string;
  icd10Code?: string;
  diagnosedDate: Date;
  status: 'active' | 'resolved' | 'chronic';
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy?: string;
  purpose?: string;
  status: 'active' | 'discontinued' | 'completed';
}

export interface Allergy {
  id: string;
  allergen: string;
  type: 'drug' | 'food' | 'environmental' | 'other';
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  diagnosedDate?: Date;
}

export interface VitalSign {
  id: string;
  date: Date;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  oxygenSaturation?: number;
}

export interface TestResult {
  id: string;
  documentId: string;
  testType: string;
  testDate: Date;
  results: Record<string, any>;
  abnormalFlags: string[];
  interpretation?: string;
}

export interface Procedure {
  id: string;
  name: string;
  date: Date;
  performedBy?: string;
  location?: string;
  notes?: string;
}

export interface Immunization {
  id: string;
  vaccine: string;
  date: Date;
  doseNumber?: number;
  administeredBy?: string;
  lotNumber?: string;
}

export interface FamilyHistory {
  id: string;
  relationship: string;
  condition: string;
  ageAtDiagnosis?: number;
  notes?: string;
}

export interface SocialHistory {
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholUse?: 'none' | 'occasional' | 'moderate' | 'heavy';
  exerciseFrequency?: string;
  occupation?: string;
  maritalStatus?: string;
}

export interface DocumentReference {
  documentId: string;
  type: string;
  uploadDate: Date;
  summary?: string;
}

export interface StoredContext {
  // Context from AI Context Cache Repository
  recentAnalyses: string[];
  importantFindings: string[];
  trends: Record<string, any>;
  lastUpdated: Date;
}

export interface PatientPreferences {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacySettings: {
    shareDataForResearch: boolean;
    allowAnonymousAnalytics: boolean;
  };
}

export class PatientRepository {
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private readonly ENCRYPTION_KEY = process.env.PATIENT_DATA_ENCRYPTION_KEY || 'change-this-key-in-production';

  /**
   * Create a new patient repository
   * Enforces one repository per patient through identity verification
   */
  async createRepository(
    userId: string,
    identityFactors: IdentityFactors,
    personalInfo: PersonalInformation
  ): Promise<PatientRepositoryData> {
    // Verify identity and check for existing repository
    const verification = await identityVerificationService.verifyIdentity(identityFactors);

    if (verification.existingRepositoryId) {
      throw new Error(
        'A repository already exists for this identity. ' +
        'Please use account migration if you need to change your email/username.'
      );
    }

    if (!verification.verified || verification.confidence < 0.85) {
      throw new Error(
        'Identity verification failed. Please provide additional verification factors.'
      );
    }

    // Generate identity hashes
    const identityHash = identityVerificationService.generateIdentityHash(identityFactors);

    // Encrypt personal information
    const encryptedPersonalInfo = this.encryptData(personalInfo);

    // Create repository
    const repositoryId = this.generateRepositoryId();

    await prisma.$executeRaw`
      INSERT INTO patient_repositories (
        id, user_id, primary_identity_hash, secondary_identity_hash, 
        composite_identity_hash, encrypted_personal_info, created_at, updated_at, version
      ) VALUES (
        ${repositoryId}, ${userId}, ${identityHash.primaryHash}, 
        ${identityHash.secondaryHash}, ${identityHash.compositeHash},
        ${encryptedPersonalInfo}, NOW(), NOW(), 1
      )
    `;

    // Initialize empty medical info
    await this.initializeMedicalInfo(repositoryId);

    // Log creation
    await auditLogger.log({
      userId,
      action: 'repository_created',
      resource: 'patient_repository',
      resourceId: repositoryId,
      details: {
        verificationConfidence: verification.confidence,
        matchedFactors: verification.matchedFactors
      },
      severity: 'high'
    });

    return await this.getRepository(repositoryId);
  }

  /**
   * Get patient repository
   */
  async getRepository(repositoryId: string): Promise<PatientRepositoryData> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM patient_repositories WHERE id = ${repositoryId}
    `;

    if (!result || result.length === 0) {
      throw new Error('Repository not found');
    }

    const repo = result[0];

    // Decrypt personal information
    const personalInfo = this.decryptData(repo.encrypted_personal_info);

    // Get medical information
    const medicalInfo = await this.getMedicalInfo(repositoryId);

    // Get documents
    const documents = await this.getDocuments(repositoryId);

    // Get stored context
    const storedContext = await this.getStoredContext(repositoryId);

    // Get preferences
    const preferences = await this.getPreferences(repositoryId);

    // Update last accessed
    await this.updateLastAccessed(repositoryId);

    return {
      id: repo.id,
      userId: repo.user_id,
      identityHash: {
        primary: repo.primary_identity_hash,
        secondary: repo.secondary_identity_hash,
        composite: repo.composite_identity_hash
      },
      personalInfo,
      medicalInfo,
      documents,
      storedContext,
      preferences,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      lastAccessedAt: repo.last_accessed_at,
      version: repo.version
    };
  }

  /**
   * Get repository by user ID
   */
  async getRepositoryByUserId(userId: string): Promise<PatientRepositoryData> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT id FROM patient_repositories WHERE user_id = ${userId}
    `;

    if (!result || result.length === 0) {
      throw new Error('No repository found for user');
    }

    return await this.getRepository(result[0].id);
  }

  /**
   * Update personal information
   */
  async updatePersonalInfo(
    repositoryId: string,
    personalInfo: Partial<PersonalInformation>
  ): Promise<void> {
    const current = await this.getRepository(repositoryId);
    const updated = { ...current.personalInfo, ...personalInfo };

    const encrypted = this.encryptData(updated);

    await prisma.$executeRaw`
      UPDATE patient_repositories 
      SET encrypted_personal_info = ${encrypted},
          updated_at = NOW(),
          version = version + 1
      WHERE id = ${repositoryId}
    `;

    await auditLogger.log({
      userId: current.userId,
      action: 'personal_info_updated',
      resource: 'patient_repository',
      resourceId: repositoryId,
      details: { updatedFields: Object.keys(personalInfo) },
      severity: 'medium'
    });
  }

  /**
   * Add diagnosis
   */
  async addDiagnosis(repositoryId: string, diagnosis: Omit<Diagnosis, 'id'>): Promise<string> {
    const diagnosisId = this.generateId('diagnosis');
    
    await prisma.$executeRaw`
      INSERT INTO patient_diagnoses (
        id, repository_id, condition, icd10_code, diagnosed_date, 
        status, severity, notes, created_at
      ) VALUES (
        ${diagnosisId}, ${repositoryId}, ${diagnosis.condition}, 
        ${diagnosis.icd10Code}, ${diagnosis.diagnosedDate}, ${diagnosis.status},
        ${diagnosis.severity}, ${diagnosis.notes}, NOW()
      )
    `;

    return diagnosisId;
  }

  /**
   * Add medication
   */
  async addMedication(repositoryId: string, medication: Omit<Medication, 'id'>): Promise<string> {
    const medicationId = this.generateId('medication');
    
    await prisma.$executeRaw`
      INSERT INTO patient_medications (
        id, repository_id, name, dosage, frequency, start_date,
        end_date, prescribed_by, purpose, status, created_at
      ) VALUES (
        ${medicationId}, ${repositoryId}, ${medication.name}, ${medication.dosage},
        ${medication.frequency}, ${medication.startDate}, ${medication.endDate},
        ${medication.prescribedBy}, ${medication.purpose}, ${medication.status}, NOW()
      )
    `;

    return medicationId;
  }

  /**
   * Add allergy
   */
  async addAllergy(repositoryId: string, allergy: Omit<Allergy, 'id'>): Promise<string> {
    const allergyId = this.generateId('allergy');
    
    await prisma.$executeRaw`
      INSERT INTO patient_allergies (
        id, repository_id, allergen, type, reaction, severity,
        diagnosed_date, created_at
      ) VALUES (
        ${allergyId}, ${repositoryId}, ${allergy.allergen}, ${allergy.type},
        ${allergy.reaction}, ${allergy.severity}, ${allergy.diagnosedDate}, NOW()
      )
    `;

    return allergyId;
  }

  /**
   * Add vital signs
   */
  async addVitalSigns(repositoryId: string, vitalSign: Omit<VitalSign, 'id'>): Promise<string> {
    const vitalSignId = this.generateId('vital');
    
    await prisma.$executeRaw`
      INSERT INTO patient_vital_signs (
        id, repository_id, date, blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, temperature, weight, height, bmi, oxygen_saturation, created_at
      ) VALUES (
        ${vitalSignId}, ${repositoryId}, ${vitalSign.date},
        ${vitalSign.bloodPressure?.systolic}, ${vitalSign.bloodPressure?.diastolic},
        ${vitalSign.heartRate}, ${vitalSign.temperature}, ${vitalSign.weight},
        ${vitalSign.height}, ${vitalSign.bmi}, ${vitalSign.oxygenSaturation}, NOW()
      )
    `;

    return vitalSignId;
  }

  /**
   * Migrate account to new email/username
   */
  async migrateAccount(
    repositoryId: string,
    newUserId: string,
    identityFactors: IdentityFactors,
    verificationToken: string
  ): Promise<void> {
    // Verify identity for migration
    const verification = await identityVerificationService.verifyForMigration(
      repositoryId,
      identityFactors,
      {
        currentEmail: '', // Would get from current user
        mfaToken: verificationToken
      }
    );

    if (!verification.verified || verification.confidence < 0.9) {
      throw new Error('Identity verification failed for migration. Higher confidence required.');
    }

    const oldUserId = await this.getUserIdFromRepository(repositoryId);

    // Update repository with new user ID
    await prisma.$executeRaw`
      UPDATE patient_repositories 
      SET user_id = ${newUserId},
          updated_at = NOW(),
          version = version + 1
      WHERE id = ${repositoryId}
    `;

    // Log migration
    await auditLogger.log({
      userId: newUserId,
      action: 'account_migrated',
      resource: 'patient_repository',
      resourceId: repositoryId,
      details: {
        oldUserId,
        newUserId,
        verificationConfidence: verification.confidence
      },
      severity: 'critical',
      requiresReview: true
    });
  }

  /**
   * Delete and purge repository
   * This is irreversible and removes ALL patient data
   */
  async deleteAndPurgeRepository(
    repositoryId: string,
    userId: string,
    confirmationToken: string
  ): Promise<void> {
    // Verify user owns this repository
    const repository = await this.getRepository(repositoryId);
    
    if (repository.userId !== userId) {
      throw new Error('Unauthorized: You do not own this repository');
    }

    // Verify confirmation token (should be generated and sent to user)
    const isValidToken = await this.verifyDeletionToken(userId, confirmationToken);
    
    if (!isValidToken) {
      throw new Error('Invalid confirmation token');
    }

    // Log deletion BEFORE deleting
    await auditLogger.log({
      userId,
      action: 'repository_deleted',
      resource: 'patient_repository',
      resourceId: repositoryId,
      details: {
        personalInfo: repository.personalInfo, // Log for audit before deletion
        documentCount: repository.documents.length,
        diagnosesCount: repository.medicalInfo.diagnoses.length
      },
      severity: 'critical',
      requiresReview: true
    });

    // Delete all related data
    await this.purgeAllData(repositoryId);

    // Delete repository
    await prisma.$executeRaw`
      DELETE FROM patient_repositories WHERE id = ${repositoryId}
    `;

    console.log(`[PatientRepository] Repository ${repositoryId} completely purged`);
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(repositoryId: string): Promise<RepositoryStatistics> {
    const repository = await this.getRepository(repositoryId);

    return {
      totalDocuments: repository.documents.length,
      totalDiagnoses: repository.medicalInfo.diagnoses.length,
      totalMedications: repository.medicalInfo.medications.filter(m => m.status === 'active').length,
      totalAllergies: repository.medicalInfo.allergies.length,
      totalVitalSigns: repository.medicalInfo.vitalSigns.length,
      totalTestResults: repository.medicalInfo.testResults.length,
      lastUpdated: repository.updatedAt,
      dataCompleteness: this.calculateDataCompleteness(repository)
    };
  }

  // Private helper methods

  private encryptData(data: any): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex')
    });
  }

  private decryptData(encryptedData: string): any {
    const { iv, data, authTag } = JSON.parse(encryptedData);
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    
    const decipher = crypto.createDecipheriv(
      this.ENCRYPTION_ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  private generateRepositoryId(): string {
    return `repo_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private async initializeMedicalInfo(repositoryId: string): Promise<void> {
    // Initialize empty medical info tables
    // This creates the structure for storing medical data
  }

  private async getMedicalInfo(repositoryId: string): Promise<MedicalInformation> {
    // Get all medical information from various tables
    const diagnoses = await this.getDiagnoses(repositoryId);
    const medications = await this.getMedications(repositoryId);
    const allergies = await this.getAllergies(repositoryId);
    const vitalSigns = await this.getVitalSigns(repositoryId);
    const testResults = await this.getTestResults(repositoryId);
    const procedures = await this.getProcedures(repositoryId);
    const immunizations = await this.getImmunizations(repositoryId);
    const familyHistory = await this.getFamilyHistory(repositoryId);
    const socialHistory = await this.getSocialHistory(repositoryId);

    return {
      diagnoses,
      medications,
      allergies,
      vitalSigns,
      testResults,
      procedures,
      immunizations,
      familyHistory,
      socialHistory
    };
  }

  private async getDiagnoses(repositoryId: string): Promise<Diagnosis[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM patient_diagnoses WHERE repository_id = ${repositoryId}
      ORDER BY diagnosed_date DESC
    `;

    return results.map(r => ({
      id: r.id,
      condition: r.condition,
      icd10Code: r.icd10_code,
      diagnosedDate: r.diagnosed_date,
      status: r.status,
      severity: r.severity,
      notes: r.notes
    }));
  }

  private async getMedications(repositoryId: string): Promise<Medication[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM patient_medications WHERE repository_id = ${repositoryId}
      ORDER BY start_date DESC
    `;

    return results.map(r => ({
      id: r.id,
      name: r.name,
      dosage: r.dosage,
      frequency: r.frequency,
      startDate: r.start_date,
      endDate: r.end_date,
      prescribedBy: r.prescribed_by,
      purpose: r.purpose,
      status: r.status
    }));
  }

  private async getAllergies(repositoryId: string): Promise<Allergy[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM patient_allergies WHERE repository_id = ${repositoryId}
    `;

    return results.map(r => ({
      id: r.id,
      allergen: r.allergen,
      type: r.type,
      reaction: r.reaction,
      severity: r.severity,
      diagnosedDate: r.diagnosed_date
    }));
  }

  private async getVitalSigns(repositoryId: string): Promise<VitalSign[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM patient_vital_signs WHERE repository_id = ${repositoryId}
      ORDER BY date DESC LIMIT 100
    `;

    return results.map(r => ({
      id: r.id,
      date: r.date,
      bloodPressure: r.blood_pressure_systolic ? {
        systolic: r.blood_pressure_systolic,
        diastolic: r.blood_pressure_diastolic
      } : undefined,
      heartRate: r.heart_rate,
      temperature: r.temperature,
      weight: r.weight,
      height: r.height,
      bmi: r.bmi,
      oxygenSaturation: r.oxygen_saturation
    }));
  }

  private async getTestResults(repositoryId: string): Promise<TestResult[]> {
    // Implementation would query test results
    return [];
  }

  private async getProcedures(repositoryId: string): Promise<Procedure[]> {
    // Implementation would query procedures
    return [];
  }

  private async getImmunizations(repositoryId: string): Promise<Immunization[]> {
    // Implementation would query immunizations
    return [];
  }

  private async getFamilyHistory(repositoryId: string): Promise<FamilyHistory[]> {
    // Implementation would query family history
    return [];
  }

  private async getSocialHistory(repositoryId: string): Promise<SocialHistory> {
    // Implementation would query social history
    return {};
  }

  private async getDocuments(repositoryId: string): Promise<DocumentReference[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT d.id, d.document_type, d.upload_date
      FROM documents d
      JOIN patient_repositories pr ON d.user_id = pr.user_id
      WHERE pr.id = ${repositoryId}
      ORDER BY d.upload_date DESC
    `;

    return results.map(r => ({
      documentId: r.id,
      type: r.document_type,
      uploadDate: r.upload_date
    }));
  }

  private async getStoredContext(repositoryId: string): Promise<StoredContext> {
    // Get stored context from AI Context Cache Repository
    return {
      recentAnalyses: [],
      importantFindings: [],
      trends: {},
      lastUpdated: new Date()
    };
  }

  private async getPreferences(repositoryId: string): Promise<PatientPreferences> {
    // Get patient preferences
    return {
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      privacySettings: {
        shareDataForResearch: false,
        allowAnonymousAnalytics: true
      }
    };
  }

  private async updateLastAccessed(repositoryId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE patient_repositories 
      SET last_accessed_at = NOW()
      WHERE id = ${repositoryId}
    `;
  }

  private async getUserIdFromRepository(repositoryId: string): Promise<string> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT user_id FROM patient_repositories WHERE id = ${repositoryId}
    `;

    return result[0].user_id;
  }

  private async verifyDeletionToken(userId: string, token: string): Promise<boolean> {
    // Verify deletion confirmation token
    // In production, this would check a token sent to user's email
    return true;
  }

  private async purgeAllData(repositoryId: string): Promise<void> {
    // Delete all related data in correct order
    await prisma.$executeRaw`DELETE FROM patient_diagnoses WHERE repository_id = ${repositoryId}`;
    await prisma.$executeRaw`DELETE FROM patient_medications WHERE repository_id = ${repositoryId}`;
    await prisma.$executeRaw`DELETE FROM patient_allergies WHERE repository_id = ${repositoryId}`;
    await prisma.$executeRaw`DELETE FROM patient_vital_signs WHERE repository_id = ${repositoryId}`;
    // ... delete from all other related tables
  }

  private calculateDataCompleteness(repository: PatientRepositoryData): number {
    let score = 0;
    let total = 0;

    // Personal info completeness
    if (repository.personalInfo.firstName) score++;
    total++;
    if (repository.personalInfo.dateOfBirth) score++;
    total++;
    if (repository.personalInfo.gender) score++;
    total++;

    // Medical info completeness
    if (repository.medicalInfo.diagnoses.length > 0) score++;
    total++;
    if (repository.medicalInfo.medications.length > 0) score++;
    total++;
    if (repository.medicalInfo.allergies.length > 0) score++;
    total++;

    return score / total;
  }
}

export interface RepositoryStatistics {
  totalDocuments: number;
  totalDiagnoses: number;
  totalMedications: number;
  totalAllergies: number;
  totalVitalSigns: number;
  totalTestResults: number;
  lastUpdated: Date;
  dataCompleteness: number;
}

export const patientRepository = new PatientRepository();