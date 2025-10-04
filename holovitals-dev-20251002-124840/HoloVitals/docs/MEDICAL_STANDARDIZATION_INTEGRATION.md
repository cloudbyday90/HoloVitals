# Medical Standardization Repository Integration Guide

## Overview

This guide shows how to integrate the Medical Standardization Repository with other HoloVitals repositories and services.

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         Medical Standardization Repository                  │
│  (Central source of truth for medical codes)                │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ EHR Sync     │    │ AI Analysis  │    │ Patient      │
│ Services     │    │ Services     │    │ Repository   │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 1. Integration with EHR Sync Services

### Epic Integration

```typescript
// lib/services/EpicEnhancedService.ts

import { getMedicalStandardizationRepository } from './MedicalStandardizationRepository';

export class EpicEnhancedService {
  private medicalStandardization = getMedicalStandardizationRepository();

  async syncDiagnosticReports(connectionId: string): Promise<void> {
    const connection = await this.getConnection(connectionId);
    const reports = await this.fetchDiagnosticReports(connection);

    for (const report of reports) {
      // Extract lab results from report
      const labResults = this.extractLabResults(report);

      // Standardize each result
      const standardizedResults = await this.medicalStandardization.batchStandardize(
        labResults.map(result => ({
          loincNumber: this.mapEpicCodeToLOINC(result.code),
          value: result.value,
          unit: result.unit,
          patientAge: connection.user.age,
          patientGender: connection.user.gender,
        }))
      );

      // Store standardized results
      for (let i = 0; i < standardizedResults.length; i++) {
        const original = labResults[i];
        const standardized = standardizedResults[i];

        await prisma.labResultStandardization.create({
          data: {
            // Original data
            originalCode: original.code,
            originalCodeSystem: 'EPIC',
            originalName: original.name,
            originalValue: String(original.value),
            originalUnit: original.unit,

            // Standardized data
            loincCodeId: standardized.loincCode.id,
            standardizedValue: standardized.standardizedValue,
            standardizedUnit: standardized.unit.unit,

            // Interpretation
            interpretation: this.getInterpretationCode(standardized),
            flags: standardized.flags,
            referenceRangeId: standardized.referenceRange?.id,

            // Context
            patientId: connection.userId,
            fhirResourceId: report.id,
          },
        });
      }
    }
  }

  private mapEpicCodeToLOINC(epicCode: string): string {
    // Epic-specific code mapping
    const mapping: Record<string, string> = {
      'EPIC_GLU': '2345-7',  // Glucose
      'EPIC_NA': '2951-2',   // Sodium
      'EPIC_K': '2823-3',    // Potassium
      'EPIC_WBC': '6690-2',  // WBC
      'EPIC_HGB': '718-7',   // Hemoglobin
      // Add more mappings...
    };

    return mapping[epicCode] || epicCode;
  }

  private getInterpretationCode(result: any): string {
    if (result.flags.includes('CRITICAL')) {
      return result.flags.includes('LOW') ? 'CRITICAL_LOW' : 'CRITICAL_HIGH';
    }
    if (result.flags.includes('LOW')) return 'LOW';
    if (result.flags.includes('HIGH')) return 'HIGH';
    return 'NORMAL';
  }
}
```

### Cerner Integration

```typescript
// lib/services/CernerEnhancedService.ts

import { getMedicalStandardizationRepository } from './MedicalStandardizationRepository';

export class CernerEnhancedService {
  private medicalStandardization = getMedicalStandardizationRepository();

  async syncObservations(connectionId: string): Promise<void> {
    const connection = await this.getConnection(connectionId);
    const observations = await this.fetchObservations(connection);

    // Filter for lab results (Observation resources with LOINC codes)
    const labObservations = observations.filter(obs => 
      obs.code?.coding?.some((c: any) => c.system === 'http://loinc.org')
    );

    // Batch standardize
    const standardizedResults = await this.medicalStandardization.batchStandardize(
      labObservations.map(obs => {
        const loincCoding = obs.code.coding.find((c: any) => c.system === 'http://loinc.org');
        return {
          loincNumber: loincCoding.code,
          value: obs.valueQuantity.value,
          unit: obs.valueQuantity.unit,
          patientAge: connection.user.age,
          patientGender: connection.user.gender,
        };
      })
    );

    // Store results
    await prisma.labResultStandardization.createMany({
      data: standardizedResults.map((result, index) => {
        const obs = labObservations[index];
        const loincCoding = obs.code.coding.find((c: any) => c.system === 'http://loinc.org');

        return {
          originalCode: loincCoding.code,
          originalCodeSystem: 'CERNER',
          originalName: obs.code.text,
          originalValue: String(obs.valueQuantity.value),
          originalUnit: obs.valueQuantity.unit,
          loincCodeId: result.loincCode.id,
          standardizedValue: result.standardizedValue,
          standardizedUnit: result.unit.unit,
          interpretation: this.getInterpretationCode(result),
          flags: result.flags,
          referenceRangeId: result.referenceRange?.id,
          patientId: connection.userId,
          fhirResourceId: obs.id,
        };
      }),
    });
  }

  private getInterpretationCode(result: any): string {
    if (result.flags.includes('CRITICAL')) {
      return result.flags.includes('LOW') ? 'CRITICAL_LOW' : 'CRITICAL_HIGH';
    }
    if (result.flags.includes('LOW')) return 'LOW';
    if (result.flags.includes('HIGH')) return 'HIGH';
    return 'NORMAL';
  }
}
```

### Allscripts Integration

```typescript
// lib/services/AllscriptsEnhancedService.ts

import { getMedicalStandardizationRepository } from './MedicalStandardizationRepository';

export class AllscriptsEnhancedService {
  private medicalStandardization = getMedicalStandardizationRepository();

  async syncDiagnosticReports(connectionId: string): Promise<void> {
    const connection = await this.getConnection(connectionId);
    const reports = await this.fetchDiagnosticReports(connection);

    for (const report of reports) {
      const labResults = this.extractLabResults(report);

      // Validate before standardizing
      const validationResults = await Promise.all(
        labResults.map(result =>
          this.medicalStandardization.validateLabResult({
            loincNumber: this.mapAllscriptsCodeToLOINC(result.code),
            value: result.value,
            unit: result.unit,
            patientAge: connection.user.age,
            patientGender: connection.user.gender,
          })
        )
      );

      // Only standardize valid results
      const validResults = labResults.filter((_, index) => validationResults[index].isValid);

      if (validResults.length > 0) {
        const standardized = await this.medicalStandardization.batchStandardize(
          validResults.map(result => ({
            loincNumber: this.mapAllscriptsCodeToLOINC(result.code),
            value: result.value,
            unit: result.unit,
            patientAge: connection.user.age,
            patientGender: connection.user.gender,
          }))
        );

        // Store standardized results
        await this.storeStandardizedResults(standardized, validResults, connection);
      }

      // Log invalid results for review
      const invalidResults = labResults.filter((_, index) => !validationResults[index].isValid);
      if (invalidResults.length > 0) {
        await this.logInvalidResults(invalidResults, validationResults, connection);
      }
    }
  }

  private mapAllscriptsCodeToLOINC(allscriptsCode: string): string {
    // Allscripts-specific code mapping
    const mapping: Record<string, string> = {
      'AS_GLU': '2345-7',
      'AS_NA': '2951-2',
      'AS_K': '2823-3',
      // Add more mappings...
    };

    return mapping[allscriptsCode] || allscriptsCode;
  }
}
```

---

## 2. Integration with AI Analysis Services

### Lab Result Analysis

```typescript
// lib/services/LabResultAnalysisService.ts

import { getMedicalStandardizationRepository } from './MedicalStandardizationRepository';

export class LabResultAnalysisService {
  private medicalStandardization = getMedicalStandardizationRepository();

  async analyzeLabResults(patientId: string): Promise<AnalysisResult> {
    // Get all standardized lab results for patient
    const results = await prisma.labResultStandardization.findMany({
      where: { patientId },
      include: {
        loincCode: true,
        referenceRange: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by LOINC code for trend analysis
    const groupedResults = this.groupByLOINCCode(results);

    // Analyze each test
    const analyses = [];
    for (const [loincNumber, testResults] of Object.entries(groupedResults)) {
      const analysis = await this.analyzeTest(loincNumber, testResults);
      analyses.push(analysis);
    }

    // Generate overall assessment
    const assessment = await this.generateAssessment(analyses);

    return {
      analyses,
      assessment,
      abnormalCount: analyses.filter(a => a.isAbnormal).length,
      criticalCount: analyses.filter(a => a.isCritical).length,
    };
  }

  private async analyzeTest(loincNumber: string, results: any[]): Promise<TestAnalysis> {
    const loincCode = await this.medicalStandardization.getLOINCCode(loincNumber);
    
    if (!loincCode) {
      throw new Error(`LOINC code ${loincNumber} not found`);
    }

    // Get latest result
    const latest = results[0];

    // Calculate trend (if multiple results)
    const trend = results.length > 1 ? this.calculateTrend(results) : 'STABLE';

    // Check for abnormalities
    const isAbnormal = latest.interpretation !== 'NORMAL';
    const isCritical = latest.flags.includes('CRITICAL');

    // Generate interpretation
    const interpretation = await this.generateInterpretation(
      loincCode,
      latest,
      trend,
      results
    );

    return {
      loincCode: loincCode.commonName,
      loincNumber,
      latestValue: latest.standardizedValue,
      unit: latest.standardizedUnit,
      referenceRange: latest.referenceRange,
      interpretation: latest.interpretation,
      trend,
      isAbnormal,
      isCritical,
      aiInterpretation: interpretation,
      historicalValues: results.map(r => ({
        value: r.standardizedValue,
        date: r.createdAt,
      })),
    };
  }

  private calculateTrend(results: any[]): 'INCREASING' | 'DECREASING' | 'STABLE' {
    if (results.length < 2) return 'STABLE';

    const latest = results[0].standardizedValue;
    const previous = results[1].standardizedValue;
    const change = ((latest - previous) / previous) * 100;

    if (Math.abs(change) < 5) return 'STABLE';
    return change > 0 ? 'INCREASING' : 'DECREASING';
  }

  private async generateInterpretation(
    loincCode: any,
    result: any,
    trend: string,
    history: any[]
  ): Promise<string> {
    // Use AI to generate interpretation
    const prompt = `
      Analyze this lab result:
      Test: ${loincCode.commonName}
      Value: ${result.standardizedValue} ${result.standardizedUnit}
      Reference Range: ${result.referenceRange.lowValue} - ${result.referenceRange.highValue}
      Interpretation: ${result.interpretation}
      Trend: ${trend}
      Historical Values: ${history.map(h => h.standardizedValue).join(', ')}

      Provide a brief clinical interpretation for the patient.
    `;

    // Call AI service (GPT-4, Claude, etc.)
    const interpretation = await this.callAIService(prompt);

    return interpretation;
  }
}
```

### Trend Analysis

```typescript
// lib/services/LabTrendAnalysisService.ts

import { getMedicalStandardizationRepository } from './MedicalStandardizationRepository';

export class LabTrendAnalysisService {
  private medicalStandardization = getMedicalStandardizationRepository();

  async analyzeTrends(patientId: string, loincNumber: string): Promise<TrendAnalysis> {
    // Get historical results
    const results = await prisma.labResultStandardization.findMany({
      where: {
        patientId,
        loincCode: {
          loincNumber,
        },
      },
      include: {
        loincCode: true,
        referenceRange: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (results.length < 2) {
      return {
        hasEnoughData: false,
        message: 'Need at least 2 results for trend analysis',
      };
    }

    // Calculate statistics
    const values = results.map(r => r.standardizedValue!);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate trend
    const trend = this.calculateLinearTrend(results);

    // Detect anomalies
    const anomalies = this.detectAnomalies(results, mean, stdDev);

    // Predict next value
    const prediction = this.predictNextValue(results, trend);

    return {
      hasEnoughData: true,
      testName: results[0].loincCode.commonName,
      dataPoints: results.length,
      mean,
      stdDev,
      trend: {
        direction: trend.slope > 0 ? 'INCREASING' : 'DECREASING',
        slope: trend.slope,
        confidence: trend.rSquared,
      },
      anomalies,
      prediction,
      recommendation: this.generateRecommendation(results, trend, anomalies),
    };
  }

  private calculateLinearTrend(results: any[]): { slope: number; intercept: number; rSquared: number } {
    const n = results.length;
    const x = results.map((_, i) => i);
    const y = results.map(r => r.standardizedValue!);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return { slope, intercept, rSquared };
  }

  private detectAnomalies(results: any[], mean: number, stdDev: number): any[] {
    // Use 2 standard deviations as threshold
    const threshold = 2 * stdDev;

    return results
      .filter(r => Math.abs(r.standardizedValue! - mean) > threshold)
      .map(r => ({
        date: r.createdAt,
        value: r.standardizedValue,
        deviation: Math.abs(r.standardizedValue! - mean) / stdDev,
      }));
  }

  private predictNextValue(results: any[], trend: any): { value: number; confidence: string } {
    const nextX = results.length;
    const predictedValue = trend.slope * nextX + trend.intercept;

    let confidence: string;
    if (trend.rSquared > 0.8) confidence = 'HIGH';
    else if (trend.rSquared > 0.5) confidence = 'MEDIUM';
    else confidence = 'LOW';

    return {
      value: predictedValue,
      confidence,
    };
  }

  private generateRecommendation(results: any[], trend: any, anomalies: any[]): string {
    const latest = results[results.length - 1];
    const isAbnormal = latest.interpretation !== 'NORMAL';
    const isCritical = latest.flags.includes('CRITICAL');
    const hasAnomalies = anomalies.length > 0;
    const trendingUp = trend.slope > 0;

    if (isCritical) {
      return 'URGENT: Critical value detected. Immediate medical attention required.';
    }

    if (isAbnormal && trendingUp && trend.rSquared > 0.7) {
      return 'WARNING: Abnormal value with strong upward trend. Schedule follow-up soon.';
    }

    if (hasAnomalies) {
      return 'NOTICE: Anomalous values detected. Consider retesting for accuracy.';
    }

    if (isAbnormal) {
      return 'ATTENTION: Abnormal value detected. Monitor and retest as recommended.';
    }

    return 'NORMAL: Values within expected range. Continue routine monitoring.';
  }
}
```

---

## 3. Integration with Patient Repository

### Store Standardized Results

```typescript
// lib/services/PatientLabResultService.ts

import { getMedicalStandardizationRepository } from './MedicalStandardizationRepository';

export class PatientLabResultService {
  private medicalStandardization = getMedicalStandardizationRepository();

  async addLabResult(params: {
    patientId: string;
    testName: string;
    value: number;
    unit: string;
    testDate: Date;
    providerId?: string;
  }): Promise<void> {
    const { patientId, testName, value, unit, testDate, providerId } = params;

    // Search for LOINC code
    const searchResult = await this.medicalStandardization.searchLOINCCodes({
      query: testName,
      limit: 1,
    });

    if (searchResult.codes.length === 0) {
      throw new Error(`No LOINC code found for test: ${testName}`);
    }

    const loincCode = searchResult.codes[0];

    // Get patient demographics
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Standardize result
    const standardized = await this.medicalStandardization.standardizeLabResult({
      loincNumber: loincCode.loincNumber,
      value,
      unit,
      patientAge: this.calculateAge(patient.dateOfBirth),
      patientGender: patient.gender as any,
    });

    // Store result
    await prisma.labResultStandardization.create({
      data: {
        originalCode: testName,
        originalCodeSystem: 'MANUAL',
        originalName: testName,
        originalValue: String(value),
        originalUnit: unit,
        loincCodeId: standardized.loincCode.id,
        standardizedValue: standardized.standardizedValue,
        standardizedUnit: standardized.unit.unit,
        interpretation: this.getInterpretationCode(standardized),
        flags: standardized.flags,
        referenceRangeId: standardized.referenceRange?.id,
        patientId,
        standardizedBy: providerId || 'PATIENT',
        createdAt: testDate,
      },
    });

    // Create notification if abnormal
    if (!standardized.isWithinRange) {
      await this.createAbnormalResultNotification(patientId, standardized);
    }
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }

  private getInterpretationCode(result: any): string {
    if (result.flags.includes('CRITICAL')) {
      return result.flags.includes('LOW') ? 'CRITICAL_LOW' : 'CRITICAL_HIGH';
    }
    if (result.flags.includes('LOW')) return 'LOW';
    if (result.flags.includes('HIGH')) return 'HIGH';
    return 'NORMAL';
  }

  private async createAbnormalResultNotification(patientId: string, result: any): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: patientId,
        type: result.flags.includes('CRITICAL') ? 'CRITICAL_LAB_RESULT' : 'ABNORMAL_LAB_RESULT',
        title: `Abnormal Lab Result: ${result.loincCode.commonName}`,
        message: `Your ${result.loincCode.commonName} result is ${result.interpretation.toLowerCase()}. Please consult with your healthcare provider.`,
        priority: result.flags.includes('CRITICAL') ? 'HIGH' : 'MEDIUM',
        read: false,
      },
    });
  }
}
```

---

## 4. Code Mapping Management

### Create Provider-Specific Mappings

```typescript
// lib/services/CodeMappingService.ts

import { getMedicalStandardizationRepository } from './MedicalStandardizationRepository';

export class CodeMappingService {
  async createMapping(params: {
    providerCode: string;
    providerSystem: string;
    loincNumber: string;
    confidence?: number;
  }): Promise<void> {
    const { providerCode, providerSystem, loincNumber, confidence = 1.0 } = params;

    await prisma.codeMapping.create({
      data: {
        loincCode: loincNumber,
        targetSystem: providerSystem,
        targetCode: providerCode,
        relationship: 'EQUIVALENT',
        confidence,
        source: 'Manual',
      },
    });
  }

  async getMapping(providerCode: string, providerSystem: string): Promise<string | null> {
    const mapping = await prisma.codeMapping.findFirst({
      where: {
        targetCode: providerCode,
        targetSystem: providerSystem,
      },
      orderBy: { confidence: 'desc' },
    });

    return mapping?.loincCode || null;
  }

  async bulkCreateMappings(mappings: Array<{
    providerCode: string;
    providerSystem: string;
    loincNumber: string;
    confidence?: number;
  }>): Promise<void> {
    await prisma.codeMapping.createMany({
      data: mappings.map(m => ({
        loincCode: m.loincNumber,
        targetSystem: m.providerSystem,
        targetCode: m.providerCode,
        relationship: 'EQUIVALENT',
        confidence: m.confidence || 1.0,
        source: 'Bulk Import',
      })),
      skipDuplicates: true,
    });
  }
}
```

---

## Summary

The Medical Standardization Repository integrates with:

1. **EHR Sync Services**: Standardize lab results from Epic, Cerner, Allscripts
2. **AI Analysis Services**: Provide standardized data for accurate analysis
3. **Patient Repository**: Store and retrieve standardized lab results
4. **Code Mapping**: Manage provider-specific code mappings

All integrations use the centralized repository as the single source of truth for medical codes, ensuring consistency across the platform.