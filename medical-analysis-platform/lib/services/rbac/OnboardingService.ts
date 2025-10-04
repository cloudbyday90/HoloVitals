/**
 * Onboarding Service
 * Manages employee onboarding workflow and checklist
 */

import { prisma } from '@/lib/prisma';
import { OnboardingStage, OnboardingStatus } from '@prisma/client';
import crypto from 'crypto';

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  order: number;
}

export interface OnboardingDocument {
  id: string;
  name: string;
  type: string;
  required: boolean;
  uploaded: boolean;
  uploadedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
}

export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  score?: number;
}

export interface StageTransition {
  from: OnboardingStage;
  to: OnboardingStage;
  timestamp: Date;
  performedBy: string;
  notes?: string;
}

export class OnboardingService {
  /**
   * Initialize onboarding for a new employee
   */
  static async initializeOnboarding(
    employeeId: string,
    createdBy: string
  ): Promise<void> {
    // Check if onboarding already exists
    const existing = await prisma.employeeOnboarding.findUnique({
      where: { employeeId },
    });

    if (existing) {
      throw new Error('Onboarding already initialized for this employee');
    }

    // Generate invitation token
    const invitationToken = this.generateInvitationToken();
    const invitationExpires = new Date();
    invitationExpires.setDate(invitationExpires.getDate() + 7); // 7 days expiry

    // Get employee details to customize checklist
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Generate checklist based on role
    const checklist = this.generateChecklist(employee.roles.map(r => r.role.code));
    
    // Generate required documents
    const documents = this.generateRequiredDocuments(employee.roles.map(r => r.role.code));
    
    // Generate training modules
    const trainingModules = this.generateTrainingModules(employee.roles.map(r => r.role.code));

    // Create onboarding record
    await prisma.employeeOnboarding.create({
      data: {
        employeeId,
        invitationToken,
        invitationExpires,
        checklist: checklist as any,
        checklistProgress: 0,
        currentStage: OnboardingStage.INVITATION,
        stageHistory: [
          {
            from: null,
            to: OnboardingStage.INVITATION,
            timestamp: new Date(),
            performedBy: createdBy,
          },
        ] as any,
        documentsRequired: documents as any,
        documentsUploaded: [] as any,
        trainingModules: trainingModules as any,
        trainingProgress: 0,
      },
    });

    // Update employee onboarding status
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        onboardingStatus: OnboardingStatus.INVITED,
      },
    });
  }

  /**
   * Send invitation email
   */
  static async sendInvitation(employeeId: string): Promise<string> {
    const onboarding = await prisma.employeeOnboarding.findUnique({
      where: { employeeId },
      include: {
        employee: true,
      },
    });

    if (!onboarding) {
      throw new Error('Onboarding not initialized');
    }

    // Check if invitation is expired
    if (onboarding.invitationExpires && onboarding.invitationExpires < new Date()) {
      // Generate new token
      const newToken = this.generateInvitationToken();
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);

      await prisma.employeeOnboarding.update({
        where: { employeeId },
        data: {
          invitationToken: newToken,
          invitationExpires: newExpiry,
        },
      });

      return newToken;
    }

    // Update invitation sent timestamp
    await prisma.employeeOnboarding.update({
      where: { employeeId },
      data: {
        invitationSentAt: new Date(),
      },
    });

    // TODO: Send actual email
    // For now, return the invitation link
    return onboarding.invitationToken;
  }

  /**
   * Accept invitation
   */
  static async acceptInvitation(invitationToken: string): Promise<string> {
    const onboarding = await prisma.employeeOnboarding.findUnique({
      where: { invitationToken },
      include: {
        employee: true,
      },
    });

    if (!onboarding) {
      throw new Error('Invalid invitation token');
    }

    // Check if invitation is expired
    if (onboarding.invitationExpires && onboarding.invitationExpires < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Check if already accepted
    if (onboarding.invitationAcceptedAt) {
      throw new Error('Invitation already accepted');
    }

    // Update onboarding
    await prisma.employeeOnboarding.update({
      where: { invitationToken },
      data: {
        invitationAcceptedAt: new Date(),
        currentStage: OnboardingStage.ACCOUNT_SETUP,
      },
    });

    // Update employee status
    await prisma.employee.update({
      where: { id: onboarding.employeeId },
      data: {
        onboardingStatus: OnboardingStatus.ACCOUNT_SETUP,
      },
    });

    // Add stage transition
    await this.addStageTransition(
      onboarding.employeeId,
      OnboardingStage.INVITATION,
      OnboardingStage.ACCOUNT_SETUP,
      onboarding.employeeId
    );

    return onboarding.employeeId;
  }

  /**
   * Get onboarding status
   */
  static async getOnboardingStatus(employeeId: string) {
    return await prisma.employeeOnboarding.findUnique({
      where: { employeeId },
      include: {
        employee: {
          include: {
            department: true,
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update checklist item
   */
  static async updateChecklistItem(
    employeeId: string,
    itemId: string,
    completed: boolean,
    completedBy: string
  ): Promise<void> {
    const onboarding = await prisma.employeeOnboarding.findUnique({
      where: { employeeId },
    });

    if (!onboarding) {
      throw new Error('Onboarding not found');
    }

    const checklist = onboarding.checklist as OnboardingChecklistItem[];
    const item = checklist.find(i => i.id === itemId);

    if (!item) {
      throw new Error('Checklist item not found');
    }

    item.completed = completed;
    if (completed) {
      item.completedAt = new Date();
      item.completedBy = completedBy;
    } else {
      item.completedAt = undefined;
      item.completedBy = undefined;
    }

    // Calculate progress
    const completedItems = checklist.filter(i => i.completed).length;
    const progress = Math.round((completedItems / checklist.length) * 100);

    await prisma.employeeOnboarding.update({
      where: { employeeId },
      data: {
        checklist: checklist as any,
        checklistProgress: progress,
      },
    });
  }

  /**
   * Upload document
   */
  static async uploadDocument(
    employeeId: string,
    documentId: string,
    fileUrl: string,
    fileSize: number
  ): Promise<void> {
    const onboarding = await prisma.employeeOnboarding.findUnique({
      where: { employeeId },
    });

    if (!onboarding) {
      throw new Error('Onboarding not found');
    }

    const documentsRequired = onboarding.documentsRequired as OnboardingDocument[];
    const documentsUploaded = onboarding.documentsUploaded as OnboardingDocument[];

    const requiredDoc = documentsRequired.find(d => d.id === documentId);
    if (!requiredDoc) {
      throw new Error('Document not in required list');
    }

    // Add to uploaded documents
    documentsUploaded.push({
      ...requiredDoc,
      uploaded: true,
      uploadedAt: new Date(),
      fileUrl,
      fileSize,
    });

    await prisma.employeeOnboarding.update({
      where: { employeeId },
      data: {
        documentsUploaded: documentsUploaded as any,
      },
    });
  }

  /**
   * Complete training module
   */
  static async completeTrainingModule(
    employeeId: string,
    moduleId: string,
    score?: number
  ): Promise<void> {
    const onboarding = await prisma.employeeOnboarding.findUnique({
      where: { employeeId },
    });

    if (!onboarding) {
      throw new Error('Onboarding not found');
    }

    const trainingModules = onboarding.trainingModules as TrainingModule[];
    const module = trainingModules.find(m => m.id === moduleId);

    if (!module) {
      throw new Error('Training module not found');
    }

    module.completed = true;
    module.completedAt = new Date();
    if (score !== undefined) {
      module.score = score;
    }

    // Calculate progress
    const completedModules = trainingModules.filter(m => m.completed).length;
    const progress = Math.round((completedModules / trainingModules.length) * 100);

    await prisma.employeeOnboarding.update({
      where: { employeeId },
      data: {
        trainingModules: trainingModules as any,
        trainingProgress: progress,
      },
    });

    // Check if HIPAA training completed
    if (moduleId === 'hipaa-training') {
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          hipaaTrainingDate: new Date(),
        },
      });

      await prisma.employeeOnboarding.update({
        where: { employeeId },
        data: {
          hipaaTrainingCompleted: true,
        },
      });
    }
  }

  /**
   * Transition to next stage
   */
  static async transitionStage(
    employeeId: string,
    newStage: OnboardingStage,
    performedBy: string,
    notes?: string
  ): Promise<void> {
    const onboarding = await prisma.employeeOnboarding.findUnique({
      where: { employeeId },
    });

    if (!onboarding) {
      throw new Error('Onboarding not found');
    }

    const currentStage = onboarding.currentStage;

    // Validate stage transition
    if (!this.isValidStageTransition(currentStage, newStage)) {
      throw new Error(`Invalid stage transition from ${currentStage} to ${newStage}`);
    }

    // Update onboarding
    await prisma.employeeOnboarding.update({
      where: { employeeId },
      data: {
        currentStage: newStage,
      },
    });

    // Add stage transition to history
    await this.addStageTransition(employeeId, currentStage, newStage, performedBy, notes);

    // Update employee onboarding status
    const onboardingStatus = this.stageToStatus(newStage);
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        onboardingStatus,
      },
    });
  }

  /**
   * Complete onboarding
   */
  static async completeOnboarding(
    employeeId: string,
    completedBy: string
  ): Promise<void> {
    const onboarding = await prisma.employeeOnboarding.findUnique({
      where: { employeeId },
    });

    if (!onboarding) {
      throw new Error('Onboarding not found');
    }

    // Validate all requirements are met
    const checklist = onboarding.checklist as OnboardingChecklistItem[];
    const requiredItems = checklist.filter(i => i.required);
    const completedRequired = requiredItems.filter(i => i.completed);

    if (completedRequired.length < requiredItems.length) {
      throw new Error('Not all required checklist items are completed');
    }

    // Check required documents
    const documentsRequired = onboarding.documentsRequired as OnboardingDocument[];
    const documentsUploaded = onboarding.documentsUploaded as OnboardingDocument[];
    const requiredDocs = documentsRequired.filter(d => d.required);
    const uploadedRequiredDocs = documentsUploaded.filter(d => d.required);

    if (uploadedRequiredDocs.length < requiredDocs.length) {
      throw new Error('Not all required documents are uploaded');
    }

    // Check required training
    const trainingModules = onboarding.trainingModules as TrainingModule[];
    const requiredModules = trainingModules.filter(m => m.required);
    const completedModules = requiredModules.filter(m => m.completed);

    if (completedModules.length < requiredModules.length) {
      throw new Error('Not all required training modules are completed');
    }

    // Complete onboarding
    await prisma.employeeOnboarding.update({
      where: { employeeId },
      data: {
        completedAt: new Date(),
        completedBy,
        currentStage: OnboardingStage.ACTIVE,
      },
    });

    // Update employee status
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        onboardingStatus: OnboardingStatus.ACTIVE,
        employmentStatus: 'ACTIVE',
      },
    });

    // Add final stage transition
    await this.addStageTransition(
      employeeId,
      onboarding.currentStage,
      OnboardingStage.ACTIVE,
      completedBy,
      'Onboarding completed'
    );
  }

  /**
   * Generate invitation token
   */
  private static generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate checklist based on roles
   */
  private static generateChecklist(roleCodes: string[]): OnboardingChecklistItem[] {
    const baseChecklist: OnboardingChecklistItem[] = [
      {
        id: 'profile-complete',
        title: 'Complete Profile Information',
        description: 'Fill in all required profile fields',
        required: true,
        completed: false,
        order: 1,
      },
      {
        id: '2fa-setup',
        title: 'Set Up Two-Factor Authentication',
        description: 'Enable 2FA for account security',
        required: true,
        completed: false,
        order: 2,
      },
      {
        id: 'confidentiality-agreement',
        title: 'Sign Confidentiality Agreement',
        description: 'Review and sign the confidentiality agreement',
        required: true,
        completed: false,
        order: 3,
      },
      {
        id: 'hipaa-training',
        title: 'Complete HIPAA Training',
        description: 'Complete required HIPAA compliance training',
        required: true,
        completed: false,
        order: 4,
      },
      {
        id: 'policies-acknowledgment',
        title: 'Acknowledge Company Policies',
        description: 'Review and acknowledge all company policies',
        required: true,
        completed: false,
        order: 5,
      },
      {
        id: 'emergency-contact',
        title: 'Provide Emergency Contact',
        description: 'Add emergency contact information',
        required: true,
        completed: false,
        order: 6,
      },
    ];

    // Add role-specific items
    if (roleCodes.some(code => code.includes('CLINICAL') || code.includes('PHYSICIAN') || code.includes('NURSE'))) {
      baseChecklist.push({
        id: 'license-verification',
        title: 'Verify Medical License',
        description: 'Upload and verify medical license',
        required: true,
        completed: false,
        order: 7,
      });
      baseChecklist.push({
        id: 'clinical-protocols',
        title: 'Review Clinical Protocols',
        description: 'Complete clinical protocols training',
        required: true,
        completed: false,
        order: 8,
      });
    }

    if (roleCodes.some(code => code.includes('COMPLIANCE') || code.includes('PRIVACY') || code.includes('SECURITY'))) {
      baseChecklist.push({
        id: 'advanced-hipaa-training',
        title: 'Complete Advanced HIPAA Training',
        description: 'Complete advanced HIPAA compliance training',
        required: true,
        completed: false,
        order: 9,
      });
    }

    if (roleCodes.some(code => code.includes('IT') || code.includes('DEVELOPER'))) {
      baseChecklist.push({
        id: 'security-training',
        title: 'Complete Security Training',
        description: 'Complete information security training',
        required: true,
        completed: false,
        order: 10,
      });
      baseChecklist.push({
        id: 'dev-environment',
        title: 'Set Up Development Environment',
        description: 'Configure development tools and access',
        required: true,
        completed: false,
        order: 11,
      });
    }

    return baseChecklist.sort((a, b) => a.order - b.order);
  }

  /**
   * Generate required documents based on roles
   */
  private static generateRequiredDocuments(roleCodes: string[]): OnboardingDocument[] {
    const baseDocuments: OnboardingDocument[] = [
      {
        id: 'id-proof',
        name: 'Government-Issued ID',
        type: 'identification',
        required: true,
        uploaded: false,
      },
      {
        id: 'i9-form',
        name: 'I-9 Employment Eligibility Verification',
        type: 'employment',
        required: true,
        uploaded: false,
      },
      {
        id: 'w4-form',
        name: 'W-4 Tax Withholding Form',
        type: 'tax',
        required: true,
        uploaded: false,
      },
    ];

    // Add role-specific documents
    if (roleCodes.some(code => code.includes('CLINICAL') || code.includes('PHYSICIAN') || code.includes('NURSE'))) {
      baseDocuments.push({
        id: 'medical-license',
        name: 'Medical License',
        type: 'license',
        required: true,
        uploaded: false,
      });
      baseDocuments.push({
        id: 'malpractice-insurance',
        name: 'Malpractice Insurance Certificate',
        type: 'insurance',
        required: true,
        uploaded: false,
      });
    }

    return baseDocuments;
  }

  /**
   * Generate training modules based on roles
   */
  private static generateTrainingModules(roleCodes: string[]): TrainingModule[] {
    const baseModules: TrainingModule[] = [
      {
        id: 'company-orientation',
        name: 'Company Orientation',
        description: 'Introduction to company culture and values',
        duration: 30,
        required: true,
        completed: false,
      },
      {
        id: 'hipaa-training',
        name: 'HIPAA Compliance Training',
        description: 'HIPAA regulations and compliance requirements',
        duration: 60,
        required: true,
        completed: false,
      },
      {
        id: 'security-awareness',
        name: 'Security Awareness Training',
        description: 'Information security best practices',
        duration: 45,
        required: true,
        completed: false,
      },
    ];

    // Add role-specific modules
    if (roleCodes.some(code => code.includes('CLINICAL') || code.includes('PHYSICIAN') || code.includes('NURSE'))) {
      baseModules.push({
        id: 'ehr-system-training',
        name: 'EHR System Training',
        description: 'How to use the electronic health record system',
        duration: 90,
        required: true,
        completed: false,
      });
    }

    if (roleCodes.some(code => code.includes('COMPLIANCE') || code.includes('PRIVACY') || code.includes('SECURITY'))) {
      baseModules.push({
        id: 'advanced-hipaa',
        name: 'Advanced HIPAA Training',
        description: 'Advanced HIPAA compliance for officers',
        duration: 120,
        required: true,
        completed: false,
      });
    }

    return baseModules;
  }

  /**
   * Add stage transition to history
   */
  private static async addStageTransition(
    employeeId: string,
    from: OnboardingStage,
    to: OnboardingStage,
    performedBy: string,
    notes?: string
  ): Promise<void> {
    const onboarding = await prisma.employeeOnboarding.findUnique({
      where: { employeeId },
    });

    if (!onboarding) {
      return;
    }

    const stageHistory = onboarding.stageHistory as StageTransition[];
    stageHistory.push({
      from,
      to,
      timestamp: new Date(),
      performedBy,
      notes,
    });

    await prisma.employeeOnboarding.update({
      where: { employeeId },
      data: {
        stageHistory: stageHistory as any,
      },
    });
  }

  /**
   * Validate stage transition
   */
  private static isValidStageTransition(
    from: OnboardingStage,
    to: OnboardingStage
  ): boolean {
    const validTransitions: Record<OnboardingStage, OnboardingStage[]> = {
      [OnboardingStage.INVITATION]: [OnboardingStage.ACCOUNT_SETUP],
      [OnboardingStage.ACCOUNT_SETUP]: [OnboardingStage.ROLE_ASSIGNMENT],
      [OnboardingStage.ROLE_ASSIGNMENT]: [OnboardingStage.TRAINING],
      [OnboardingStage.TRAINING]: [OnboardingStage.COMPLIANCE],
      [OnboardingStage.COMPLIANCE]: [OnboardingStage.PROVISIONING],
      [OnboardingStage.PROVISIONING]: [OnboardingStage.ACTIVE],
      [OnboardingStage.ACTIVE]: [],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * Convert stage to status
   */
  private static stageToStatus(stage: OnboardingStage): OnboardingStatus {
    const mapping: Record<OnboardingStage, OnboardingStatus> = {
      [OnboardingStage.INVITATION]: OnboardingStatus.INVITED,
      [OnboardingStage.ACCOUNT_SETUP]: OnboardingStatus.ACCOUNT_SETUP,
      [OnboardingStage.ROLE_ASSIGNMENT]: OnboardingStatus.ROLE_ASSIGNMENT,
      [OnboardingStage.TRAINING]: OnboardingStatus.TRAINING,
      [OnboardingStage.COMPLIANCE]: OnboardingStatus.COMPLIANCE,
      [OnboardingStage.PROVISIONING]: OnboardingStatus.PROVISIONING,
      [OnboardingStage.ACTIVE]: OnboardingStatus.ACTIVE,
    };

    return mapping[stage];
  }
}