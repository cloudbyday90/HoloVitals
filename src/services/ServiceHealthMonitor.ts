/**
 * Service Health Monitor
 * 
 * Continuously monitors service health, detects issues, and triggers
 * automated recovery when needed.
 */

import { PrismaClient, ServiceHealth, HealthStatus } from '@prisma/client';
import IncidentManagementService from './IncidentManagementService';
import AIErrorDiagnosisService from './AIErrorDiagnosisService';

const prisma = new PrismaClient();

interface HealthCheckResult {
  serviceName: string;
  status: HealthStatus;
  metrics: {
    uptime?: number;
    responseTime?: number;
    errorRate?: number;
    requestRate?: number;
  };
  resources: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkUsage?: number;
  };
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
  issues: string[];
}

interface AlertThresholds {
  responseTime: number;      // ms
  errorRate: number;          // percentage
  cpuUsage: number;           // percentage
  memoryUsage: number;        // percentage
  diskUsage: number;          // percentage
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  responseTime: 1000,         // 1 second
  errorRate: 1,               // 1%
  cpuUsage: 80,               // 80%
  memoryUsage: 85,            // 85%
  diskUsage: 90,              // 90%
};

export class ServiceHealthMonitor {
  private incidentService: IncidentManagementService;
  private diagnosisService: AIErrorDiagnosisService;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.incidentService = new IncidentManagementService();
    this.diagnosisService = new AIErrorDiagnosisService();
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalSeconds: number = 30): void {
    if (this.monitoringInterval) {
      console.log('Monitoring already running');
      return;
    }

    console.log(`Starting health monitoring (interval: ${intervalSeconds}s)`);

    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, intervalSeconds * 1000);

    // Perform initial check
    this.performHealthChecks();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Health monitoring stopped');
    }
  }

  /**
   * Perform health checks on all services
   */
  async performHealthChecks(): Promise<void> {
    const services = [
      'api-gateway',
      'authentication',
      'patient-repository',
      'ai-analysis',
      'consent-management',
      'database',
      'cache',
    ];

    const environments = ['PRODUCTION', 'STAGING'];

    for (const environment of environments) {
      for (const service of services) {
        try {
          const result = await this.checkServiceHealth(service, environment);
          await this.updateServiceHealth(result, environment);
          await this.analyzeHealthStatus(result, environment);
        } catch (error) {
          console.error(`Health check failed for ${service} in ${environment}:`, error);
        }
      }
    }
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(serviceName: string, environment: string): Promise<HealthCheckResult> {
    const checks = [];
    const issues = [];
    let status: HealthStatus = HealthStatus.HEALTHY;

    // 1. Availability Check
    const availabilityCheck = await this.checkAvailability(serviceName);
    checks.push(availabilityCheck);
    if (!availabilityCheck.passed) {
      status = HealthStatus.DOWN;
      issues.push(`Service unavailable: ${availabilityCheck.message}`);
    }

    // 2. Response Time Check
    const responseTimeCheck = await this.checkResponseTime(serviceName);
    checks.push(responseTimeCheck);
    if (!responseTimeCheck.passed) {
      if (status === HealthStatus.HEALTHY) {
        status = HealthStatus.DEGRADED;
      }
      issues.push(`Slow response time: ${responseTimeCheck.message}`);
    }

    // 3. Error Rate Check
    const errorRateCheck = await this.checkErrorRate(serviceName);
    checks.push(errorRateCheck);
    if (!errorRateCheck.passed) {
      if (status === HealthStatus.HEALTHY) {
        status = HealthStatus.DEGRADED;
      }
      issues.push(`High error rate: ${errorRateCheck.message}`);
    }

    // 4. Resource Usage Check
    const resourceCheck = await this.checkResourceUsage(serviceName);
    checks.push(resourceCheck);
    if (!resourceCheck.passed) {
      if (status === HealthStatus.HEALTHY) {
        status = HealthStatus.DEGRADED;
      }
      issues.push(`Resource usage high: ${resourceCheck.message}`);
    }

    // 5. Dependency Check
    const dependencyCheck = await this.checkDependencies(serviceName);
    checks.push(dependencyCheck);
    if (!dependencyCheck.passed) {
      if (status === HealthStatus.HEALTHY) {
        status = HealthStatus.DEGRADED;
      }
      issues.push(`Dependency issue: ${dependencyCheck.message}`);
    }

    // Get metrics
    const metrics = await this.getServiceMetrics(serviceName);
    const resources = await this.getResourceMetrics(serviceName);

    return {
      serviceName,
      status,
      metrics,
      resources,
      checks,
      issues,
    };
  }

  /**
   * Update service health in database
   */
  async updateServiceHealth(result: HealthCheckResult, environment: string): Promise<void> {
    const existing = await prisma.serviceHealth.findUnique({
      where: {
        serviceName_environment: {
          serviceName: result.serviceName,
          environment,
        },
      },
    });

    const data = {
      status: result.status,
      previousStatus: existing?.status,
      statusChangedAt: existing?.status !== result.status ? new Date() : existing?.statusChangedAt,
      uptime: result.metrics.uptime,
      responseTime: result.metrics.responseTime,
      errorRate: result.metrics.errorRate,
      requestRate: result.metrics.requestRate,
      cpuUsage: result.resources.cpuUsage,
      memoryUsage: result.resources.memoryUsage,
      diskUsage: result.resources.diskUsage,
      networkUsage: result.resources.networkUsage,
      lastCheckAt: new Date(),
      checksPerformed: result.checks.map(c => c.name),
      failedChecks: result.checks.filter(c => !c.passed).map(c => c.name),
      activeIssues: result.issues,
      warningCount: result.checks.filter(c => !c.passed && result.status === HealthStatus.DEGRADED).length,
      errorCount: result.checks.filter(c => !c.passed && result.status === HealthStatus.DOWN).length,
    };

    await prisma.serviceHealth.upsert({
      where: {
        serviceName_environment: {
          serviceName: result.serviceName,
          environment,
        },
      },
      create: {
        serviceName: result.serviceName,
        environment,
        ...data,
      },
      update: data,
    });
  }

  /**
   * Analyze health status and trigger alerts/incidents
   */
  async analyzeHealthStatus(result: HealthCheckResult, environment: string): Promise<void> {
    // Only trigger incidents for production
    if (environment !== 'PRODUCTION') return;

    // Service is down - create SEV1 incident
    if (result.status === HealthStatus.DOWN) {
      await this.handleServiceDown(result);
    }

    // Service is degraded - create SEV2 incident if persistent
    if (result.status === HealthStatus.DEGRADED) {
      await this.handleServiceDegraded(result);
    }

    // Check for threshold violations
    await this.checkThresholds(result);
  }

  /**
   * Handle service down scenario
   */
  async handleServiceDown(result: HealthCheckResult): Promise<void> {
    // Check if incident already exists
    const existingIncident = await prisma.incident.findFirst({
      where: {
        affectedServices: { has: result.serviceName },
        status: {
          in: ['DETECTED', 'ACKNOWLEDGED', 'INVESTIGATING', 'IDENTIFIED', 'RESOLVING'],
        },
      },
    });

    if (existingIncident) {
      // Update existing incident
      await this.incidentService.addStatusUpdate(existingIncident.id, {
        status: existingIncident.status,
        message: `Service still down. Issues: ${result.issues.join(', ')}`,
        updatedBy: 'SYSTEM',
      });
      return;
    }

    // Create new SEV1 incident
    const incident = await this.incidentService.createIncident({
      severity: 'SEV1',
      title: `Service Down: ${result.serviceName}`,
      description: `${result.serviceName} is completely unavailable. Issues detected: ${result.issues.join(', ')}`,
      affectedServices: [result.serviceName],
      detectedBy: 'SYSTEM',
      detectionMethod: 'HEALTH_MONITORING',
    });

    // Trigger automated incident response
    await this.incidentService.automatedIncidentResponse(incident.id);
  }

  /**
   * Handle service degraded scenario
   */
  async handleServiceDegraded(result: HealthCheckResult): Promise<void> {
    // Check if service has been degraded for > 5 minutes
    const serviceHealth = await prisma.serviceHealth.findUnique({
      where: {
        serviceName_environment: {
          serviceName: result.serviceName,
          environment: 'PRODUCTION',
        },
      },
    });

    if (!serviceHealth || !serviceHealth.statusChangedAt) return;

    const degradedDuration = Date.now() - serviceHealth.statusChangedAt.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (degradedDuration > fiveMinutes) {
      // Check if incident already exists
      const existingIncident = await prisma.incident.findFirst({
        where: {
          affectedServices: { has: result.serviceName },
          status: {
            in: ['DETECTED', 'ACKNOWLEDGED', 'INVESTIGATING', 'IDENTIFIED', 'RESOLVING'],
          },
        },
      });

      if (!existingIncident) {
        // Create SEV2 incident
        await this.incidentService.createIncident({
          severity: 'SEV2',
          title: `Service Degraded: ${result.serviceName}`,
          description: `${result.serviceName} has been degraded for ${Math.floor(degradedDuration / 60000)} minutes. Issues: ${result.issues.join(', ')}`,
          affectedServices: [result.serviceName],
          detectedBy: 'SYSTEM',
          detectionMethod: 'HEALTH_MONITORING',
        });
      }
    }
  }

  /**
   * Check for threshold violations
   */
  async checkThresholds(result: HealthCheckResult): Promise<void> {
    const thresholds = DEFAULT_THRESHOLDS;

    // Response time threshold
    if (result.metrics.responseTime && result.metrics.responseTime > thresholds.responseTime) {
      await this.diagnosisService.reportAndDiagnoseError({
        severity: 'MEDIUM',
        category: 'PERFORMANCE',
        errorMessage: `Response time (${result.metrics.responseTime}ms) exceeds threshold (${thresholds.responseTime}ms)`,
        service: result.serviceName,
        environment: 'PRODUCTION',
      });
    }

    // Error rate threshold
    if (result.metrics.errorRate && result.metrics.errorRate > thresholds.errorRate) {
      await this.diagnosisService.reportAndDiagnoseError({
        severity: 'HIGH',
        category: 'SERVICE_FAILURE',
        errorMessage: `Error rate (${result.metrics.errorRate}%) exceeds threshold (${thresholds.errorRate}%)`,
        service: result.serviceName,
        environment: 'PRODUCTION',
      });
    }

    // CPU usage threshold
    if (result.resources.cpuUsage && result.resources.cpuUsage > thresholds.cpuUsage) {
      await this.diagnosisService.reportAndDiagnoseError({
        severity: 'MEDIUM',
        category: 'PERFORMANCE',
        errorMessage: `CPU usage (${result.resources.cpuUsage}%) exceeds threshold (${thresholds.cpuUsage}%)`,
        service: result.serviceName,
        environment: 'PRODUCTION',
      });
    }

    // Memory usage threshold
    if (result.resources.memoryUsage && result.resources.memoryUsage > thresholds.memoryUsage) {
      await this.diagnosisService.reportAndDiagnoseError({
        severity: 'HIGH',
        category: 'PERFORMANCE',
        errorMessage: `Memory usage (${result.resources.memoryUsage}%) exceeds threshold (${thresholds.memoryUsage}%)`,
        service: result.serviceName,
        environment: 'PRODUCTION',
      });
    }
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<any> {
    const services = await prisma.serviceHealth.findMany({
      where: { environment: 'PRODUCTION' },
    });

    const healthyCount = services.filter(s => s.status === HealthStatus.HEALTHY).length;
    const degradedCount = services.filter(s => s.status === HealthStatus.DEGRADED).length;
    const downCount = services.filter(s => s.status === HealthStatus.DOWN).length;

    let overallStatus: HealthStatus = HealthStatus.HEALTHY;
    if (downCount > 0) {
      overallStatus = HealthStatus.DOWN;
    } else if (degradedCount > 0) {
      overallStatus = HealthStatus.DEGRADED;
    }

    return {
      overallStatus,
      totalServices: services.length,
      healthy: healthyCount,
      degraded: degradedCount,
      down: downCount,
      services: services.map(s => ({
        name: s.serviceName,
        status: s.status,
        uptime: s.uptime,
        responseTime: s.responseTime,
        errorRate: s.errorRate,
        issues: s.activeIssues,
      })),
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async checkAvailability(serviceName: string): Promise<any> {
    // TODO: Implement actual availability check
    // This would ping the service endpoint
    return {
      name: 'Availability',
      passed: true,
      message: 'Service is available',
    };
  }

  private async checkResponseTime(serviceName: string): Promise<any> {
    // TODO: Implement actual response time check
    const responseTime = Math.random() * 500; // Simulated
    const passed = responseTime < DEFAULT_THRESHOLDS.responseTime;
    
    return {
      name: 'Response Time',
      passed,
      message: passed ? `Response time: ${responseTime.toFixed(0)}ms` : `Slow response: ${responseTime.toFixed(0)}ms`,
    };
  }

  private async checkErrorRate(serviceName: string): Promise<any> {
    // TODO: Implement actual error rate check
    const errorRate = Math.random() * 2; // Simulated
    const passed = errorRate < DEFAULT_THRESHOLDS.errorRate;
    
    return {
      name: 'Error Rate',
      passed,
      message: passed ? `Error rate: ${errorRate.toFixed(2)}%` : `High error rate: ${errorRate.toFixed(2)}%`,
    };
  }

  private async checkResourceUsage(serviceName: string): Promise<any> {
    // TODO: Implement actual resource check
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    const passed = cpuUsage < DEFAULT_THRESHOLDS.cpuUsage && memoryUsage < DEFAULT_THRESHOLDS.memoryUsage;
    
    return {
      name: 'Resource Usage',
      passed,
      message: passed ? 'Resources within limits' : `High resource usage: CPU ${cpuUsage.toFixed(0)}%, Memory ${memoryUsage.toFixed(0)}%`,
    };
  }

  private async checkDependencies(serviceName: string): Promise<any> {
    // TODO: Implement actual dependency check
    return {
      name: 'Dependencies',
      passed: true,
      message: 'All dependencies available',
    };
  }

  private async getServiceMetrics(serviceName: string): Promise<any> {
    // TODO: Get actual metrics from monitoring system
    return {
      uptime: 99.9,
      responseTime: Math.random() * 500,
      errorRate: Math.random() * 2,
      requestRate: Math.random() * 1000,
    };
  }

  private async getResourceMetrics(serviceName: string): Promise<any> {
    // TODO: Get actual resource metrics
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkUsage: Math.random() * 100,
    };
  }
}

export default ServiceHealthMonitor;