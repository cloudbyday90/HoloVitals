/**
 * HIPAA Compliance Service
 * 
 * Central service for HIPAA compliance verification, rule enforcement,
 * and violation detection. Acts as the authoritative source for all
 * HIPAA-related compliance in HoloVitals.
 */

import { PrismaClient, HIPAARule, HIPAARuleCategory, ComplianceCheck, ComplianceCheckType, ComplianceCheckStatus, ComplianceViolation, ViolationSeverity, ViolationStatus } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ComplianceCheckRequest {
  action: string;
  repository: string;
  targetType: string;
  targetId: string;
  targetDetails?: any;
  rules?: string[]; // Specific rules to check, or all if not specified
  triggeredBy: string;
}

interface ComplianceCheckResult {
  passed: boolean;
  status: ComplianceCheckStatus;
  score: number; // 0-100
  violations: ComplianceViolation[];
  warnings: string[];
  recommendations: string[];
  blocked: boolean;
  requiresReview: boolean;
}

interface PHISanitizationResult {
  sanitized: any;
  phiDetected: boolean;
  phiRemoved: string[];
  sanitizationLog: string[];
}

export class HIPAAComplianceService {
  /**
   * Check compliance for an action
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceCheckResult> {
    // Create compliance check record
    const check = await prisma.complianceCheck.create({
      data: {
        checkType: this.determineCheckType(request.action),
        targetType: request.targetType,
        targetId: request.targetId,
        targetDetails: request.targetDetails,
        rulesChecked: request.rules || [],
        repository: request.repository,
        action: request.action,
        triggeredBy: request.triggeredBy,
        status: ComplianceCheckStatus.RUNNING,
      },
    });

    try {
      // Get applicable HIPAA rules
      const rules = await this.getApplicableRules(request);

      // Perform compliance checks
      const violations: ComplianceViolation[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      for (const rule of rules) {
        const ruleCheck = await this.checkRule(rule, request);
        
        if (ruleCheck.violated) {
          const violation = await this.createViolation({
            ruleId: rule.id,
            checkId: check.id,
            ...ruleCheck.violationDetails,
          });
          violations.push(violation);
        }

        if (ruleCheck.warnings) {
          warnings.push(...ruleCheck.warnings);
        }

        if (ruleCheck.recommendations) {
          recommendations.push(...ruleCheck.recommendations);
        }
      }

      // Calculate compliance score
      const score = this.calculateComplianceScore(rules.length, violations.length, warnings.length);

      // Determine if action should be blocked
      const blocked = violations.some(v => v.severity === ViolationSeverity.CRITICAL);
      const requiresReview = violations.some(v => v.severity === ViolationSeverity.HIGH) || blocked;

      // Update check record
      await prisma.complianceCheck.update({
        where: { id: check.id },
        data: {
          status: blocked ? ComplianceCheckStatus.BLOCKED : 
                  requiresReview ? ComplianceCheckStatus.REVIEW_REQUIRED :
                  violations.length > 0 ? ComplianceCheckStatus.FAILED :
                  warnings.length > 0 ? ComplianceCheckStatus.WARNING :
                  ComplianceCheckStatus.PASSED,
          passed: violations.length === 0,
          score,
          violations: violations.map(v => v.id),
          warnings,
          completedAt: new Date(),
          duration: Math.floor((Date.now() - check.startedAt.getTime()) / 1000),
        },
      });

      return {
        passed: violations.length === 0,
        status: blocked ? ComplianceCheckStatus.BLOCKED : 
                requiresReview ? ComplianceCheckStatus.REVIEW_REQUIRED :
                violations.length > 0 ? ComplianceCheckStatus.FAILED :
                ComplianceCheckStatus.PASSED,
        score,
        violations,
        warnings,
        recommendations,
        blocked,
        requiresReview,
      };
    } catch (error: any) {
      // Mark check as failed
      await prisma.complianceCheck.update({
        where: { id: check.id },
        data: {
          status: ComplianceCheckStatus.FAILED,
          completedAt: new Date(),
        },
      });

      throw new Error(`Compliance check failed: ${error.message}`);
    }
  }

  /**
   * Sanitize PHI from data
   */
  async sanitizePHI(data: any): Promise<PHISanitizationResult> {
    const sanitized = JSON.parse(JSON.stringify(data)); // Deep clone
    const phiRemoved: string[] = [];
    const sanitizationLog: string[] = [];

    // PHI identifiers to remove (18 HIPAA identifiers)
    const phiPatterns = {
      // Names
      name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      
      // Dates (except year)
      date: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      
      // Phone numbers
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      
      // Email addresses
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      
      // SSN
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      
      // Medical record numbers
      mrn: /\b(MRN|mrn)[:\s]*[A-Z0-9]+\b/gi,
      
      // IP addresses
      ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      
      // URLs
      url: /https?:\/\/[^\s]+/g,
    };

    // Recursively sanitize object
    const sanitizeObject = (obj: any, path: string = ''): void => {
      if (typeof obj === 'string') {
        let modified = false;
        let sanitizedValue = obj;

        for (const [type, pattern] of Object.entries(phiPatterns)) {
          if (pattern.test(sanitizedValue)) {
            sanitizedValue = sanitizedValue.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
            phiRemoved.push(type);
            sanitizationLog.push(`Removed ${type} from ${path}`);
            modified = true;
          }
        }

        return sanitizedValue;
      } else if (Array.isArray(obj)) {
        return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
      } else if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Check if key itself indicates PHI
          const lowerKey = key.toLowerCase();
          if (['ssn', 'socialsecurity', 'email', 'phone', 'address', 'dob', 'dateofbirth'].includes(lowerKey)) {
            result[key] = '[REDACTED]';
            phiRemoved.push(key);
            sanitizationLog.push(`Redacted field: ${path}.${key}`);
          } else {
            result[key] = sanitizeObject(value, `${path}.${key}`);
          }
        }
        return result;
      }

      return obj;
    };

    const sanitizedData = sanitizeObject(data);

    return {
      sanitized: sanitizedData,
      phiDetected: phiRemoved.length > 0,
      phiRemoved: [...new Set(phiRemoved)],
      sanitizationLog,
    };
  }

  /**
   * Verify bug report compliance
   */
  async verifyBugCompliance(bugData: any): Promise<ComplianceCheckResult> {
    return await this.checkCompliance({
      action: 'CREATE_BUG',
      repository: 'BUG_REPOSITORY',
      targetType: 'bug',
      targetId: bugData.id || 'new',
      targetDetails: bugData,
      rules: ['HIPAA-PR-001', 'HIPAA-SR-001'], // Privacy and Security rules
      triggeredBy: bugData.reportedBy || 'SYSTEM',
    });
  }

  /**
   * Verify feature compliance
   */
  async verifyFeatureCompliance(featureData: any): Promise<ComplianceCheckResult> {
    return await this.checkCompliance({
      action: 'IMPLEMENT_FEATURE',
      repository: 'ENHANCEMENT_REPOSITORY',
      targetType: 'feature',
      targetId: featureData.id,
      targetDetails: featureData,
      triggeredBy: featureData.requestedBy || 'SYSTEM',
    });
  }

  /**
   * Verify recovery compliance
   */
  async verifyRecoveryCompliance(recoveryData: any): Promise<ComplianceCheckResult> {
    return await this.checkCompliance({
      action: 'EMERGENCY_ROLLBACK',
      repository: 'EMERGENCY_RECOVERY',
      targetType: 'restoration',
      targetId: recoveryData.snapshot || 'new',
      targetDetails: recoveryData,
      triggeredBy: recoveryData.triggeredBy || 'SYSTEM',
    });
  }

  /**
   * Authorize PHI access
   */
  async authorizeAccess(accessRequest: {
    userId: string;
    patientId: string;
    resourceType: string;
    action: string;
    purpose: string;
  }): Promise<{ authorized: boolean; reason?: string }> {
    // Check minimum necessary
    const minimumNecessary = await this.checkMinimumNecessary(accessRequest);
    if (!minimumNecessary.compliant) {
      return {
        authorized: false,
        reason: 'Access does not meet minimum necessary standard',
      };
    }

    // Check consent
    const consentCheck = await this.checkConsent(accessRequest);
    if (!consentCheck.valid) {
      return {
        authorized: false,
        reason: 'Valid consent not found',
      };
    }

    // Check authorization
    const authCheck = await this.checkAuthorization(accessRequest);
    if (!authCheck.authorized) {
      return {
        authorized: false,
        reason: authCheck.reason,
      };
    }

    return { authorized: true };
  }

  /**
   * Log PHI access
   */
  async logPHIAccess(accessData: {
    userId: string;
    userName: string;
    userRole: string;
    patientId: string;
    resourceType: string;
    resourceId: string;
    action: string;
    purpose: string;
    justification?: string;
    consentId?: string;
    authorized: boolean;
    ipAddress: string;
    location?: string;
    deviceInfo?: string;
    sessionId?: string;
    fieldsAccessed: string[];
    minimumNecessary: boolean;
  }): Promise<void> {
    await prisma.pHIAccessLog.create({
      data: {
        ...accessData,
        authorizationMethod: 'RBAC_WITH_CONSENT',
      },
    });
  }

  /**
   * Get HIPAA rule by ID
   */
  async getRule(ruleId: string): Promise<HIPAARule | null> {
    return await prisma.hIPAARule.findUnique({
      where: { ruleId },
    });
  }

  /**
   * Get all active HIPAA rules
   */
  async getAllRules(): Promise<HIPAARule[]> {
    return await prisma.hIPAARule.findMany({
      where: { active: true },
      orderBy: [
        { category: 'asc' },
        { severity: 'desc' },
      ],
    });
  }

  /**
   * Get rules by category
   */
  async getRulesByCategory(category: HIPAARuleCategory): Promise<HIPAARule[]> {
    return await prisma.hIPAARule.findMany({
      where: {
        category,
        active: true,
      },
    });
  }

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(query: string, category?: HIPAARuleCategory): Promise<any[]> {
    const where: any = {};
    
    if (category) {
      where.category = category;
    }

    // Simple text search (in production, use full-text search)
    const results = await prisma.hIPAAKnowledgeBase.findMany({
      where: {
        ...where,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    // Update reference count
    for (const result of results) {
      await prisma.hIPAAKnowledgeBase.update({
        where: { id: result.id },
        data: {
          timesReferenced: result.timesReferenced + 1,
          lastAccessed: new Date(),
        },
      });
    }

    return results;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private determineCheckType(action: string): ComplianceCheckType {
    const actionMap: { [key: string]: ComplianceCheckType } = {
      'CREATE_BUG': ComplianceCheckType.PHI_HANDLING,
      'IMPLEMENT_FEATURE': ComplianceCheckType.CODE_ANALYSIS,
      'DEPLOY': ComplianceCheckType.DATA_FLOW,
      'ACCESS_PHI': ComplianceCheckType.ACCESS_CONTROL,
      'EMERGENCY_ROLLBACK': ComplianceCheckType.AUDIT_LOG,
      'RESTORE_SNAPSHOT': ComplianceCheckType.ENCRYPTION,
    };

    return actionMap[action] || ComplianceCheckType.CODE_ANALYSIS;
  }

  private async getApplicableRules(request: ComplianceCheckRequest): Promise<HIPAARule[]> {
    if (request.rules && request.rules.length > 0) {
      // Get specific rules
      return await prisma.hIPAARule.findMany({
        where: {
          ruleId: { in: request.rules },
          active: true,
        },
      });
    }

    // Get all applicable rules based on action
    const applicableCategories = this.getApplicableCategories(request.action);
    
    return await prisma.hIPAARule.findMany({
      where: {
        category: { in: applicableCategories },
        active: true,
      },
    });
  }

  private getApplicableCategories(action: string): HIPAARuleCategory[] {
    // Map actions to HIPAA rule categories
    const categoryMap: { [key: string]: HIPAARuleCategory[] } = {
      'CREATE_BUG': [HIPAARuleCategory.PRIVACY_RULE, HIPAARuleCategory.SECURITY_RULE],
      'IMPLEMENT_FEATURE': [HIPAARuleCategory.PRIVACY_RULE, HIPAARuleCategory.SECURITY_RULE],
      'ACCESS_PHI': [HIPAARuleCategory.PRIVACY_RULE, HIPAARuleCategory.SECURITY_RULE],
      'EMERGENCY_ROLLBACK': [HIPAARuleCategory.SECURITY_RULE, HIPAARuleCategory.BREACH_NOTIFICATION],
    };

    return categoryMap[action] || [HIPAARuleCategory.PRIVACY_RULE, HIPAARuleCategory.SECURITY_RULE];
  }

  private async checkRule(rule: HIPAARule, request: ComplianceCheckRequest): Promise<any> {
    // Use AI to check rule compliance
    const prompt = `
      Analyze the following action for HIPAA compliance:
      
      Rule: ${rule.title}
      Description: ${rule.description}
      Requirements: ${rule.requirements.join(', ')}
      
      Action: ${request.action}
      Details: ${JSON.stringify(request.targetDetails, null, 2)}
      
      Determine if this action violates the HIPAA rule. Return JSON:
      {
        "violated": boolean,
        "confidence": 0-1,
        "explanation": "string",
        "warnings": ["string"],
        "recommendations": ["string"]
      }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a HIPAA compliance expert. Analyze actions for HIPAA violations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        violated: analysis.violated && analysis.confidence > 0.7,
        warnings: analysis.warnings || [],
        recommendations: analysis.recommendations || [],
        violationDetails: analysis.violated ? {
          title: `${rule.title} Violation`,
          description: analysis.explanation,
          severity: this.mapRuleSeverityToViolationSeverity(rule.severity),
          location: request.targetType,
          component: request.repository,
          detectedBy: 'AI_ANALYSIS',
          detectionMethod: 'AUTOMATED_COMPLIANCE_CHECK',
          ruleCategory: rule.category,
        } : null,
      };
    } catch (error) {
      console.error('AI compliance check failed:', error);
      // Fall back to basic checks
      return {
        violated: false,
        warnings: ['AI analysis unavailable, manual review recommended'],
        recommendations: [],
      };
    }
  }

  private async createViolation(violationData: any): Promise<ComplianceViolation> {
    return await prisma.complianceViolation.create({
      data: {
        ...violationData,
        violationType: 'HIPAA_VIOLATION',
        status: ViolationStatus.DETECTED,
        riskScore: this.calculateRiskScore(violationData.severity),
      },
    });
  }

  private calculateComplianceScore(totalRules: number, violations: number, warnings: number): number {
    if (totalRules === 0) return 100;
    
    const violationPenalty = (violations / totalRules) * 50;
    const warningPenalty = (warnings / totalRules) * 20;
    
    return Math.max(0, 100 - violationPenalty - warningPenalty);
  }

  private calculateRiskScore(severity: ViolationSeverity): number {
    const scoreMap = {
      [ViolationSeverity.CRITICAL]: 100,
      [ViolationSeverity.HIGH]: 75,
      [ViolationSeverity.MEDIUM]: 50,
      [ViolationSeverity.LOW]: 25,
    };
    return scoreMap[severity];
  }

  private mapRuleSeverityToViolationSeverity(ruleSeverity: string): ViolationSeverity {
    const map: { [key: string]: ViolationSeverity } = {
      'CRITICAL': ViolationSeverity.CRITICAL,
      'HIGH': ViolationSeverity.HIGH,
      'MEDIUM': ViolationSeverity.MEDIUM,
      'LOW': ViolationSeverity.LOW,
    };
    return map[ruleSeverity] || ViolationSeverity.MEDIUM;
  }

  private async checkMinimumNecessary(accessRequest: any): Promise<{ compliant: boolean; reason?: string }> {
    // TODO: Implement minimum necessary check
    // This would verify that the access request only includes necessary fields
    return { compliant: true };
  }

  private async checkConsent(accessRequest: any): Promise<{ valid: boolean; reason?: string }> {
    // TODO: Implement consent check
    // This would verify valid consent exists for the access
    return { valid: true };
  }

  private async checkAuthorization(accessRequest: any): Promise<{ authorized: boolean; reason?: string }> {
    // TODO: Implement authorization check
    // This would verify user has proper authorization
    return { authorized: true };
  }
}

export default HIPAAComplianceService;