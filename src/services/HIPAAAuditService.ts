/**
 * HIPAA Audit Service
 * 
 * Performs automated compliance audits including random log sampling,
 * PHI access pattern analysis, and consent compliance verification.
 */

import { PrismaClient, ComplianceAudit, AuditType, AuditStatus, AuditFinding, FindingSeverity, PHIAccessLog, AccessPattern } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditConfig {
  auditType: AuditType;
  startDate: Date;
  endDate: Date;
  scope?: any;
  samplingRate?: number;
  triggeredBy: string;
}

interface PatternAnalysisResult {
  userId: string;
  patterns: AccessPattern;
  anomalies: string[];
  riskScore: number;
  requiresReview: boolean;
}

export class HIPAAAuditService {
  /**
   * Perform compliance audit
   */
  async performAudit(config: AuditConfig): Promise<ComplianceAudit> {
    // Create audit record
    const audit = await prisma.complianceAudit.create({
      data: {
        auditType: config.auditType,
        startDate: config.startDate,
        endDate: config.endDate,
        scope: config.scope || {},
        samplingRate: config.samplingRate,
        triggeredBy: config.triggeredBy,
        status: AuditStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    try {
      let findings: AuditFinding[] = [];

      // Perform audit based on type
      switch (config.auditType) {
        case AuditType.RANDOM_SAMPLING:
          findings = await this.performRandomSampling(audit.id, config);
          break;
        case AuditType.PHI_ACCESS:
          findings = await this.auditPHIAccess(audit.id, config);
          break;
        case AuditType.CONSENT_COMPLIANCE:
          findings = await this.auditConsentCompliance(audit.id, config);
          break;
        case AuditType.AUTHENTICATION:
          findings = await this.auditAuthentication(audit.id, config);
          break;
        case AuditType.AUTHORIZATION:
          findings = await this.auditAuthorization(audit.id, config);
          break;
        case AuditType.DATA_RETENTION:
          findings = await this.auditDataRetention(audit.id, config);
          break;
        case AuditType.ENCRYPTION:
          findings = await this.auditEncryption(audit.id, config);
          break;
        case AuditType.BREACH_DETECTION:
          findings = await this.detectBreaches(audit.id, config);
          break;
        case AuditType.SCHEDULED:
          findings = await this.performComprehensiveAudit(audit.id, config);
          break;
      }

      // Calculate compliance score
      const complianceScore = this.calculateAuditScore(findings);

      // Generate summary
      const summary = this.generateAuditSummary(findings);

      // Generate recommendations
      const recommendations = this.generateRecommendations(findings);

      // Update audit record
      const completedAudit = await prisma.complianceAudit.update({
        where: { id: audit.id },
        data: {
          status: AuditStatus.COMPLETED,
          completedAt: new Date(),
          duration: Math.floor((Date.now() - audit.startedAt!.getTime()) / 1000),
          findingsCount: findings.length,
          violationsCount: findings.filter(f => f.severity === FindingSeverity.CRITICAL || f.severity === FindingSeverity.HIGH).length,
          complianceScore,
          summary,
          recommendations,
        },
      });

      return completedAudit;
    } catch (error: any) {
      // Mark audit as failed
      await prisma.complianceAudit.update({
        where: { id: audit.id },
        data: {
          status: AuditStatus.FAILED,
          completedAt: new Date(),
        },
      });

      throw new Error(`Audit failed: ${error.message}`);
    }
  }

  /**
   * Perform random log sampling
   */
  async performRandomSampling(auditId: string, config: AuditConfig): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];
    const samplingRate = config.samplingRate || 0.1; // Default 10%

    // Get all PHI access logs in the period
    const allLogs = await prisma.pHIAccessLog.findMany({
      where: {
        accessedAt: {
          gte: config.startDate,
          lte: config.endDate,
        },
      },
    });

    // Calculate sample size
    const sampleSize = Math.ceil(allLogs.length * samplingRate);

    // Random sampling
    const sampledLogs = this.randomSample(allLogs, sampleSize);

    // Audit each sampled log
    for (const log of sampledLogs) {
      const logFindings = await this.auditAccessLog(auditId, log);
      findings.push(...logFindings);
    }

    // Update audit with sample info
    await prisma.complianceAudit.update({
      where: { id: auditId },
      data: {
        totalRecords: allLogs.length,
        recordsAudited: sampledLogs.length,
        sampleSize: sampledLogs.length,
      },
    });

    return findings;
  }

  /**
   * Audit PHI access patterns
   */
  async auditPHIAccess(auditId: string, config: AuditConfig): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Get all PHI access logs in the period
    const accessLogs = await prisma.pHIAccessLog.findMany({
      where: {
        accessedAt: {
          gte: config.startDate,
          lte: config.endDate,
        },
      },
    });

    // Group by user
    const userAccess = this.groupByUser(accessLogs);

    // Analyze patterns for each user
    for (const [userId, logs] of Object.entries(userAccess)) {
      const patternAnalysis = await this.analyzeAccessPattern(userId, logs as PHIAccessLog[]);

      if (patternAnalysis.requiresReview) {
        const finding = await prisma.auditFinding.create({
          data: {
            auditId,
            findingType: 'SUSPICIOUS_ACCESS_PATTERN',
            severity: this.mapRiskScoreToSeverity(patternAnalysis.riskScore),
            title: `Suspicious Access Pattern: ${userId}`,
            description: `User ${userId} exhibits suspicious access patterns: ${patternAnalysis.anomalies.join(', ')}`,
            evidence: {
              userId,
              accessCount: logs.length,
              anomalies: patternAnalysis.anomalies,
              riskScore: patternAnalysis.riskScore,
            },
            relatedRules: ['HIPAA-PR-001', 'HIPAA-SR-001'],
            impact: `Potential unauthorized PHI access affecting ${new Set((logs as PHIAccessLog[]).map(l => l.patientId)).size} patients`,
            affectedRecords: logs.length,
            affectedUsers: new Set((logs as PHIAccessLog[]).map(l => l.patientId)).size,
            recommendation: 'Review access logs and interview user to verify legitimate business need',
            requiredAction: 'Immediate review required for high-risk access patterns',
            priority: patternAnalysis.riskScore > 75 ? 1 : 2,
          },
        });

        findings.push(finding);
      }
    }

    return findings;
  }

  /**
   * Audit consent compliance
   */
  async auditConsentCompliance(auditId: string, config: AuditConfig): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Get all PHI access logs in the period
    const accessLogs = await prisma.pHIAccessLog.findMany({
      where: {
        accessedAt: {
          gte: config.startDate,
          lte: config.endDate,
        },
      },
    });

    // Check each access for valid consent
    for (const log of accessLogs) {
      const consentCheck = await this.verifyConsent(log);

      if (!consentCheck.valid) {
        const finding = await prisma.auditFinding.create({
          data: {
            auditId,
            findingType: 'CONSENT_VIOLATION',
            severity: FindingSeverity.HIGH,
            title: `Access Without Valid Consent`,
            description: `User ${log.userId} accessed patient ${log.patientId} without valid consent`,
            evidence: {
              accessLogId: log.id,
              userId: log.userId,
              patientId: log.patientId,
              accessedAt: log.accessedAt,
              consentStatus: consentCheck.reason,
            },
            relatedRules: ['HIPAA-PR-001'],
            impact: 'Unauthorized PHI access - potential HIPAA violation',
            affectedRecords: 1,
            affectedUsers: 1,
            recommendation: 'Obtain valid consent or revoke access',
            requiredAction: 'Immediate action required - potential breach',
            priority: 1,
          },
        });

        findings.push(finding);
      }
    }

    return findings;
  }

  /**
   * Audit authentication
   */
  async auditAuthentication(auditId: string, config: AuditConfig): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check for weak authentication
    // TODO: Implement authentication audit
    // - Check for MFA usage
    // - Check for password strength
    // - Check for session management
    // - Check for failed login attempts

    return findings;
  }

  /**
   * Audit authorization
   */
  async auditAuthorization(auditId: string, config: AuditConfig): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check for proper authorization
    // TODO: Implement authorization audit
    // - Check role-based access control
    // - Check minimum necessary
    // - Check access justification

    return findings;
  }

  /**
   * Audit data retention
   */
  async auditDataRetention(auditId: string, config: AuditConfig): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check data retention policies
    // TODO: Implement retention audit
    // - Check for data past retention period
    // - Check for proper disposal
    // - Check for retention documentation

    return findings;
  }

  /**
   * Audit encryption
   */
  async auditEncryption(auditId: string, config: AuditConfig): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check encryption compliance
    // TODO: Implement encryption audit
    // - Check PHI encrypted at rest
    // - Check PHI encrypted in transit
    // - Check key management

    return findings;
  }

  /**
   * Detect potential breaches
   */
  async detectBreaches(auditId: string, config: AuditConfig): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Detect potential breaches
    // TODO: Implement breach detection
    // - Check for unauthorized access
    // - Check for data exfiltration
    // - Check for suspicious patterns

    return findings;
  }

  /**
   * Perform comprehensive audit
   */
  async performComprehensiveAudit(auditId: string, config: AuditConfig): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Run all audit types
    const auditTypes = [
      AuditType.PHI_ACCESS,
      AuditType.CONSENT_COMPLIANCE,
      AuditType.AUTHENTICATION,
      AuditType.AUTHORIZATION,
      AuditType.ENCRYPTION,
    ];

    for (const type of auditTypes) {
      const typeFindings = await this.performAudit({
        ...config,
        auditType: type,
      });

      if (typeFindings.findings) {
        findings.push(...typeFindings.findings);
      }
    }

    return findings;
  }

  /**
   * Analyze access pattern for a user
   */
  async analyzeAccessPattern(userId: string, logs: PHIAccessLog[]): Promise<PatternAnalysisResult> {
    const anomalies: string[] = [];
    let riskScore = 0;

    // Calculate metrics
    const accessCount = logs.length;
    const uniquePatients = new Set(logs.map(l => l.patientId)).size;
    const accessTimes = logs.map(l => l.accessedAt.getHours());
    const averageAccessTime = accessTimes.reduce((a, b) => a + b, 0) / accessTimes.length;

    // Check for unusual time access (2-5 AM)
    const nightAccess = logs.filter(l => {
      const hour = l.accessedAt.getHours();
      return hour >= 2 && hour <= 5;
    });

    if (nightAccess.length > 0) {
      anomalies.push('unusual_time');
      riskScore += 20;
    }

    // Check for unusual volume (>100 accesses per day)
    const daysDiff = (logs[logs.length - 1].accessedAt.getTime() - logs[0].accessedAt.getTime()) / (1000 * 60 * 60 * 24);
    const accessesPerDay = accessCount / Math.max(daysDiff, 1);

    if (accessesPerDay > 100) {
      anomalies.push('unusual_volume');
      riskScore += 30;
    }

    // Check for accessing many unrelated patients
    if (uniquePatients > 50 && accessCount / uniquePatients < 2) {
      anomalies.push('unusual_resources');
      riskScore += 25;
    }

    // Check for rapid sequential access
    const rapidAccess = logs.filter((log, index) => {
      if (index === 0) return false;
      const timeDiff = log.accessedAt.getTime() - logs[index - 1].accessedAt.getTime();
      return timeDiff < 1000; // Less than 1 second between accesses
    });

    if (rapidAccess.length > 10) {
      anomalies.push('rapid_sequential_access');
      riskScore += 15;
    }

    // Check for geographic anomalies
    const locations = new Set(logs.map(l => l.location).filter(l => l));
    if (locations.size > 3) {
      anomalies.push('geographic_anomaly');
      riskScore += 10;
    }

    // Create or update access pattern
    const pattern = await prisma.accessPattern.upsert({
      where: {
        userId_analyzedAt: {
          userId,
          analyzedAt: new Date(),
        },
      },
      create: {
        userId,
        userName: logs[0].userName,
        patternType: riskScore > 50 ? 'ANOMALOUS' : riskScore > 25 ? 'SUSPICIOUS' : 'NORMAL',
        timeWindow: `${logs[0].accessedAt.toISOString()} - ${logs[logs.length - 1].accessedAt.toISOString()}`,
        accessCount,
        uniquePatients,
        averageAccessTime,
        accessFrequency: accessesPerDay,
        anomalies: { anomalies },
        riskScore,
        unusualTime: anomalies.includes('unusual_time'),
        unusualVolume: anomalies.includes('unusual_volume'),
        unusualResources: anomalies.includes('unusual_resources'),
        geographicAnomaly: anomalies.includes('geographic_anomaly'),
        requiresReview: riskScore > 50,
        periodStart: logs[0].accessedAt,
        periodEnd: logs[logs.length - 1].accessedAt,
      },
      update: {
        patternType: riskScore > 50 ? 'ANOMALOUS' : riskScore > 25 ? 'SUSPICIOUS' : 'NORMAL',
        accessCount,
        uniquePatients,
        averageAccessTime,
        accessFrequency: accessesPerDay,
        anomalies: { anomalies },
        riskScore,
        unusualTime: anomalies.includes('unusual_time'),
        unusualVolume: anomalies.includes('unusual_volume'),
        unusualResources: anomalies.includes('unusual_resources'),
        geographicAnomaly: anomalies.includes('geographic_anomaly'),
        requiresReview: riskScore > 50,
      },
    });

    return {
      userId,
      patterns: pattern,
      anomalies,
      riskScore,
      requiresReview: riskScore > 50,
    };
  }

  /**
   * Schedule automated audits
   */
  async scheduleAutomatedAudits(): Promise<void> {
    const now = new Date();

    // Daily random sampling
    await this.performAudit({
      auditType: AuditType.RANDOM_SAMPLING,
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endDate: now,
      samplingRate: 0.1,
      triggeredBy: 'SYSTEM',
    });

    // Weekly PHI access audit
    if (now.getDay() === 1) { // Monday
      await this.performAudit({
        auditType: AuditType.PHI_ACCESS,
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now,
        triggeredBy: 'SYSTEM',
      });
    }

    // Monthly comprehensive audit
    if (now.getDate() === 1) { // First of month
      await this.performAudit({
        auditType: AuditType.SCHEDULED,
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0),
        triggeredBy: 'SYSTEM',
      });
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private randomSample<T>(array: T[], size: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }

  private groupByUser(logs: PHIAccessLog[]): { [userId: string]: PHIAccessLog[] } {
    return logs.reduce((acc, log) => {
      if (!acc[log.userId]) {
        acc[log.userId] = [];
      }
      acc[log.userId].push(log);
      return acc;
    }, {} as { [userId: string]: PHIAccessLog[] });
  }

  private async auditAccessLog(auditId: string, log: PHIAccessLog): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check if access was authorized
    if (!log.authorized) {
      const finding = await prisma.auditFinding.create({
        data: {
          auditId,
          findingType: 'UNAUTHORIZED_ACCESS',
          severity: FindingSeverity.CRITICAL,
          title: 'Unauthorized PHI Access',
          description: `Unauthorized access to patient ${log.patientId} by user ${log.userId}`,
          evidence: { accessLogId: log.id },
          relatedRules: ['HIPAA-PR-001', 'HIPAA-SR-001'],
          impact: 'Potential HIPAA violation - unauthorized PHI access',
          affectedRecords: 1,
          recommendation: 'Investigate and take corrective action',
          priority: 1,
        },
      });
      findings.push(finding);
    }

    // Check if minimum necessary was applied
    if (!log.minimumNecessary) {
      const finding = await prisma.auditFinding.create({
        data: {
          auditId,
          findingType: 'MINIMUM_NECESSARY_VIOLATION',
          severity: FindingSeverity.MEDIUM,
          title: 'Minimum Necessary Not Applied',
          description: `Access to patient ${log.patientId} did not apply minimum necessary standard`,
          evidence: { accessLogId: log.id },
          relatedRules: ['HIPAA-PR-001'],
          impact: 'Excessive PHI access',
          affectedRecords: 1,
          recommendation: 'Implement minimum necessary controls',
          priority: 2,
        },
      });
      findings.push(finding);
    }

    return findings;
  }

  private async verifyConsent(log: PHIAccessLog): Promise<{ valid: boolean; reason?: string }> {
    // TODO: Implement actual consent verification
    // This would check if valid consent exists for the access
    if (!log.consentId) {
      return { valid: false, reason: 'No consent ID provided' };
    }

    return { valid: true };
  }

  private calculateAuditScore(findings: AuditFinding[]): number {
    if (findings.length === 0) return 100;

    const criticalCount = findings.filter(f => f.severity === FindingSeverity.CRITICAL).length;
    const highCount = findings.filter(f => f.severity === FindingSeverity.HIGH).length;
    const mediumCount = findings.filter(f => f.severity === FindingSeverity.MEDIUM).length;
    const lowCount = findings.filter(f => f.severity === FindingSeverity.LOW).length;

    const penalty = (criticalCount * 25) + (highCount * 15) + (mediumCount * 8) + (lowCount * 3);

    return Math.max(0, 100 - penalty);
  }

  private generateAuditSummary(findings: AuditFinding[]): string {
    const criticalCount = findings.filter(f => f.severity === FindingSeverity.CRITICAL).length;
    const highCount = findings.filter(f => f.severity === FindingSeverity.HIGH).length;

    if (criticalCount > 0) {
      return `CRITICAL: ${criticalCount} critical findings require immediate attention. ${highCount} high-severity findings also identified.`;
    } else if (highCount > 0) {
      return `${highCount} high-severity findings identified requiring prompt action.`;
    } else if (findings.length > 0) {
      return `${findings.length} findings identified. Review and address as appropriate.`;
    } else {
      return 'No compliance issues identified. System is operating within HIPAA guidelines.';
    }
  }

  private generateRecommendations(findings: AuditFinding[]): string[] {
    const recommendations = new Set<string>();

    for (const finding of findings) {
      recommendations.add(finding.recommendation);
    }

    return Array.from(recommendations);
  }

  private mapRiskScoreToSeverity(riskScore: number): FindingSeverity {
    if (riskScore >= 75) return FindingSeverity.CRITICAL;
    if (riskScore >= 50) return FindingSeverity.HIGH;
    if (riskScore >= 25) return FindingSeverity.MEDIUM;
    return FindingSeverity.LOW;
  }
}

export default HIPAAAuditService;