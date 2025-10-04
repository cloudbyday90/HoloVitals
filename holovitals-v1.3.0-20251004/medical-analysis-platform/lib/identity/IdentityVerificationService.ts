/**
 * Identity Verification Service for HoloVitals
 * 
 * Verifies patient identity using multiple factors to ensure:
 * - One repository per patient
 * - Prevent duplicate accounts
 * - Secure account migration
 * - Identity-based repository access
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface IdentityFactors {
  // Primary Identifiers (Required)
  dateOfBirth: Date;
  fullName: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  placeOfBirth: {
    city: string;
    state: string;
    country: string;
  };
  
  // Secondary Identifiers (Recommended - at least 2)
  socialSecurityNumber?: string; // Last 4 digits only
  mothersMaidenName?: string;
  medicalRecordNumber?: string;
  previousAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phoneNumber?: string; // For verification
  
  // Biometric Identifiers (Optional - future)
  biometricHash?: string;
}

export interface IdentityVerificationResult {
  verified: boolean;
  confidence: number; // 0-1 score
  matchedFactors: string[];
  existingRepositoryId?: string;
  requiresAdditionalVerification: boolean;
  verificationMethod: string;
}

export interface IdentityHash {
  primaryHash: string;    // Hash of primary identifiers
  secondaryHash: string;  // Hash of secondary identifiers
  compositeHash: string;  // Combined hash for uniqueness
}

export class IdentityVerificationService {
  private readonly HASH_ALGORITHM = 'sha256';
  private readonly HASH_ITERATIONS = 10000;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.85;

  /**
   * Generate identity hash from factors
   * This creates a unique identifier without storing PII
   */
  generateIdentityHash(factors: IdentityFactors): IdentityHash {
    // Normalize data for consistent hashing
    const normalized = this.normalizeIdentityFactors(factors);

    // Primary hash: DOB + Full Name + Place of Birth
    const primaryData = [
      normalized.dateOfBirth,
      normalized.fullName.firstName,
      normalized.fullName.middleName || '',
      normalized.fullName.lastName,
      normalized.placeOfBirth.city,
      normalized.placeOfBirth.state,
      normalized.placeOfBirth.country
    ].join('|');

    const primaryHash = this.hashData(primaryData);

    // Secondary hash: Additional identifiers
    const secondaryData = [
      normalized.socialSecurityNumber || '',
      normalized.mothersMaidenName || '',
      normalized.medicalRecordNumber || '',
      normalized.phoneNumber || ''
    ].join('|');

    const secondaryHash = this.hashData(secondaryData);

    // Composite hash: Combination of both
    const compositeHash = this.hashData(primaryHash + secondaryHash);

    return {
      primaryHash,
      secondaryHash,
      compositeHash
    };
  }

  /**
   * Verify identity and check for existing repository
   */
  async verifyIdentity(factors: IdentityFactors): Promise<IdentityVerificationResult> {
    // Generate identity hashes
    const identityHash = this.generateIdentityHash(factors);

    // Check for existing repository with same identity
    const existingRepository = await this.findRepositoryByIdentity(identityHash);

    if (existingRepository) {
      // Found existing repository - verify it's the same person
      const verification = await this.verifyAgainstExisting(
        factors,
        existingRepository
      );

      return {
        verified: verification.isMatch,
        confidence: verification.confidence,
        matchedFactors: verification.matchedFactors,
        existingRepositoryId: existingRepository.id,
        requiresAdditionalVerification: verification.confidence < this.MIN_CONFIDENCE_THRESHOLD,
        verificationMethod: 'existing_repository_match'
      };
    }

    // No existing repository - verify identity is valid
    const validation = this.validateIdentityFactors(factors);

    return {
      verified: validation.isValid,
      confidence: validation.confidence,
      matchedFactors: validation.providedFactors,
      requiresAdditionalVerification: validation.confidence < this.MIN_CONFIDENCE_THRESHOLD,
      verificationMethod: 'new_identity_validation'
    };
  }

  /**
   * Check if identity already has a repository
   */
  async hasExistingRepository(factors: IdentityFactors): Promise<boolean> {
    const identityHash = this.generateIdentityHash(factors);
    const existing = await this.findRepositoryByIdentity(identityHash);
    return existing !== null;
  }

  /**
   * Verify identity for account migration
   */
  async verifyForMigration(
    repositoryId: string,
    factors: IdentityFactors,
    additionalVerification: {
      currentEmail: string;
      mfaToken?: string;
      securityQuestionAnswers?: Record<string, string>;
    }
  ): Promise<IdentityVerificationResult> {
    // Get existing repository
    const repository = await this.getRepository(repositoryId);
    
    if (!repository) {
      return {
        verified: false,
        confidence: 0,
        matchedFactors: [],
        requiresAdditionalVerification: true,
        verificationMethod: 'migration_verification'
      };
    }

    // Verify identity matches repository
    const identityMatch = await this.verifyAgainstExisting(factors, repository);

    // Verify additional factors
    const emailMatch = repository.email === additionalVerification.currentEmail;
    
    let mfaVerified = true;
    if (additionalVerification.mfaToken) {
      // Verify MFA token
      mfaVerified = await this.verifyMFAToken(
        repository.userId,
        additionalVerification.mfaToken
      );
    }

    // Calculate overall confidence
    const confidence = (
      identityMatch.confidence * 0.6 +
      (emailMatch ? 0.2 : 0) +
      (mfaVerified ? 0.2 : 0)
    );

    return {
      verified: confidence >= this.MIN_CONFIDENCE_THRESHOLD,
      confidence,
      matchedFactors: [
        ...identityMatch.matchedFactors,
        emailMatch ? 'email' : '',
        mfaVerified ? 'mfa' : ''
      ].filter(Boolean),
      existingRepositoryId: repositoryId,
      requiresAdditionalVerification: confidence < this.MIN_CONFIDENCE_THRESHOLD,
      verificationMethod: 'migration_verification'
    };
  }

  /**
   * Generate verification challenge for additional verification
   */
  async generateVerificationChallenge(
    repositoryId: string
  ): Promise<VerificationChallenge> {
    const repository = await this.getRepository(repositoryId);
    
    if (!repository) {
      throw new Error('Repository not found');
    }

    // Generate challenge based on stored data
    const challenges: ChallengeQuestion[] = [];

    // DOB challenge
    challenges.push({
      type: 'date_of_birth',
      question: 'What is your date of birth?',
      expectedFormat: 'MM/DD/YYYY'
    });

    // Place of birth challenge
    challenges.push({
      type: 'place_of_birth',
      question: 'What city were you born in?',
      expectedFormat: 'City name'
    });

    // Additional challenges based on available data
    if (repository.hasMothersMaidenName) {
      challenges.push({
        type: 'mothers_maiden_name',
        question: "What is your mother's maiden name?",
        expectedFormat: 'Last name'
      });
    }

    if (repository.hasPreviousAddress) {
      challenges.push({
        type: 'previous_address',
        question: 'What was your previous street address?',
        expectedFormat: 'Street address'
      });
    }

    // Select 3 random challenges
    const selectedChallenges = this.selectRandomChallenges(challenges, 3);

    const challengeId = this.generateChallengeId();

    // Store challenge
    await this.storeChallenge(challengeId, repositoryId, selectedChallenges);

    return {
      challengeId,
      challenges: selectedChallenges,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    };
  }

  /**
   * Verify challenge responses
   */
  async verifyChallenge(
    challengeId: string,
    responses: Record<string, string>
  ): Promise<boolean> {
    const challenge = await this.getChallenge(challengeId);
    
    if (!challenge) {
      throw new Error('Challenge not found or expired');
    }

    const repository = await this.getRepository(challenge.repositoryId);
    
    if (!repository) {
      throw new Error('Repository not found');
    }

    let correctAnswers = 0;
    const totalQuestions = challenge.questions.length;

    for (const question of challenge.questions) {
      const userAnswer = responses[question.type];
      const isCorrect = await this.verifyAnswer(
        question.type,
        userAnswer,
        repository
      );

      if (isCorrect) {
        correctAnswers++;
      }
    }

    // Require all answers to be correct
    const verified = correctAnswers === totalQuestions;

    // Delete challenge after verification
    await this.deleteChallenge(challengeId);

    return verified;
  }

  // Private helper methods

  private normalizeIdentityFactors(factors: IdentityFactors): IdentityFactors {
    return {
      dateOfBirth: factors.dateOfBirth,
      fullName: {
        firstName: factors.fullName.firstName.toLowerCase().trim(),
        middleName: factors.fullName.middleName?.toLowerCase().trim(),
        lastName: factors.fullName.lastName.toLowerCase().trim()
      },
      placeOfBirth: {
        city: factors.placeOfBirth.city.toLowerCase().trim(),
        state: factors.placeOfBirth.state.toLowerCase().trim(),
        country: factors.placeOfBirth.country.toLowerCase().trim()
      },
      socialSecurityNumber: factors.socialSecurityNumber?.replace(/\D/g, ''),
      mothersMaidenName: factors.mothersMaidenName?.toLowerCase().trim(),
      medicalRecordNumber: factors.medicalRecordNumber?.toUpperCase().trim(),
      previousAddress: factors.previousAddress ? {
        street: factors.previousAddress.street.toLowerCase().trim(),
        city: factors.previousAddress.city.toLowerCase().trim(),
        state: factors.previousAddress.state.toLowerCase().trim(),
        zipCode: factors.previousAddress.zipCode.replace(/\D/g, '')
      } : undefined,
      phoneNumber: factors.phoneNumber?.replace(/\D/g, '')
    };
  }

  private hashData(data: string): string {
    return crypto
      .pbkdf2Sync(data, process.env.IDENTITY_SALT || 'holovitals-salt', this.HASH_ITERATIONS, 64, this.HASH_ALGORITHM)
      .toString('hex');
  }

  private async findRepositoryByIdentity(identityHash: IdentityHash): Promise<any> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM patient_repositories 
      WHERE composite_identity_hash = ${identityHash.compositeHash}
      LIMIT 1
    `;

    return result && result.length > 0 ? result[0] : null;
  }

  private async verifyAgainstExisting(
    factors: IdentityFactors,
    repository: any
  ): Promise<{ isMatch: boolean; confidence: number; matchedFactors: string[] }> {
    const matchedFactors: string[] = [];
    let matchScore = 0;
    let totalFactors = 0;

    // Verify primary factors
    const identityHash = this.generateIdentityHash(factors);
    
    if (identityHash.primaryHash === repository.primary_identity_hash) {
      matchedFactors.push('primary_identity');
      matchScore += 3; // Primary factors are weighted heavily
    }
    totalFactors += 3;

    if (identityHash.secondaryHash === repository.secondary_identity_hash) {
      matchedFactors.push('secondary_identity');
      matchScore += 2;
    }
    totalFactors += 2;

    const confidence = matchScore / totalFactors;

    return {
      isMatch: confidence >= this.MIN_CONFIDENCE_THRESHOLD,
      confidence,
      matchedFactors
    };
  }

  private validateIdentityFactors(factors: IdentityFactors): {
    isValid: boolean;
    confidence: number;
    providedFactors: string[];
  } {
    const providedFactors: string[] = [];
    let score = 0;

    // Primary factors (required)
    if (factors.dateOfBirth) {
      providedFactors.push('date_of_birth');
      score += 1;
    }
    if (factors.fullName.firstName && factors.fullName.lastName) {
      providedFactors.push('full_name');
      score += 1;
    }
    if (factors.placeOfBirth.city && factors.placeOfBirth.state && factors.placeOfBirth.country) {
      providedFactors.push('place_of_birth');
      score += 1;
    }

    // Secondary factors (recommended)
    if (factors.socialSecurityNumber) {
      providedFactors.push('ssn');
      score += 0.5;
    }
    if (factors.mothersMaidenName) {
      providedFactors.push('mothers_maiden_name');
      score += 0.5;
    }
    if (factors.medicalRecordNumber) {
      providedFactors.push('medical_record_number');
      score += 0.5;
    }
    if (factors.previousAddress) {
      providedFactors.push('previous_address');
      score += 0.5;
    }
    if (factors.phoneNumber) {
      providedFactors.push('phone_number');
      score += 0.5;
    }

    // Minimum: 3 primary factors + 2 secondary factors
    const hasMinimumFactors = score >= 4;
    const confidence = Math.min(score / 5, 1); // Max score of 5

    return {
      isValid: hasMinimumFactors,
      confidence,
      providedFactors
    };
  }

  private async getRepository(repositoryId: string): Promise<any> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM patient_repositories WHERE id = ${repositoryId}
    `;

    return result && result.length > 0 ? result[0] : null;
  }

  private async verifyMFAToken(userId: string, token: string): Promise<boolean> {
    // This would integrate with AuthService
    // For now, return true as placeholder
    return true;
  }

  private selectRandomChallenges(challenges: ChallengeQuestion[], count: number): ChallengeQuestion[] {
    const shuffled = [...challenges].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, challenges.length));
  }

  private generateChallengeId(): string {
    return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  private async storeChallenge(
    challengeId: string,
    repositoryId: string,
    questions: ChallengeQuestion[]
  ): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO identity_challenges (id, repository_id, questions, expires_at, created_at)
      VALUES (${challengeId}, ${repositoryId}, ${JSON.stringify(questions)}, 
              NOW() + INTERVAL '15 minutes', NOW())
    `;
  }

  private async getChallenge(challengeId: string): Promise<any> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM identity_challenges 
      WHERE id = ${challengeId} AND expires_at > NOW()
    `;

    if (!result || result.length === 0) {
      return null;
    }

    return {
      challengeId: result[0].id,
      repositoryId: result[0].repository_id,
      questions: JSON.parse(result[0].questions),
      expiresAt: result[0].expires_at
    };
  }

  private async deleteChallenge(challengeId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM identity_challenges WHERE id = ${challengeId}
    `;
  }

  private async verifyAnswer(
    questionType: string,
    userAnswer: string,
    repository: any
  ): Promise<boolean> {
    const normalized = userAnswer.toLowerCase().trim();

    switch (questionType) {
      case 'date_of_birth':
        const dob = new Date(repository.date_of_birth);
        const userDob = new Date(userAnswer);
        return dob.getTime() === userDob.getTime();

      case 'place_of_birth':
        return normalized === repository.place_of_birth_city.toLowerCase();

      case 'mothers_maiden_name':
        // Compare hashes
        const hashedAnswer = this.hashData(normalized);
        return hashedAnswer === repository.mothers_maiden_name_hash;

      case 'previous_address':
        const hashedAddress = this.hashData(normalized);
        return hashedAddress === repository.previous_address_hash;

      default:
        return false;
    }
  }
}

export interface VerificationChallenge {
  challengeId: string;
  challenges: ChallengeQuestion[];
  expiresAt: Date;
}

export interface ChallengeQuestion {
  type: string;
  question: string;
  expectedFormat: string;
}

export const identityVerificationService = new IdentityVerificationService();