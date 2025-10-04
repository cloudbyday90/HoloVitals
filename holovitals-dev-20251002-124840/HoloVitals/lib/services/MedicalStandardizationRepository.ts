/**
 * Medical Standardization Repository
 * 
 * Centralized repository for medical terminology standardization using LOINC codes.
 * Provides standardized lab results, units, reference ranges, and medical coding
 * that other repositories can reference.
 * 
 * Key Features:
 * - LOINC code management (Mayo Clinic dataset)
 * - Unit standardization (UCUM)
 * - Reference range management
 * - Code mapping and validation
 * - Multi-language support
 * - Version tracking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// LOINC Code Categories
export enum LOINCCategory {
  LABORATORY = 'LABORATORY',
  CLINICAL = 'CLINICAL',
  SURVEY = 'SURVEY',
  CLAIMS = 'CLAIMS',
  DOCUMENT = 'DOCUMENT',
  RADIOLOGY = 'RADIOLOGY',
}

// LOINC Component Types
export enum ComponentType {
  CHEMISTRY = 'CHEMISTRY',
  HEMATOLOGY = 'HEMATOLOGY',
  MICROBIOLOGY = 'MICROBIOLOGY',
  IMMUNOLOGY = 'IMMUNOLOGY',
  TOXICOLOGY = 'TOXICOLOGY',
  GENETICS = 'GENETICS',
  PATHOLOGY = 'PATHOLOGY',
  VITAL_SIGNS = 'VITAL_SIGNS',
  OTHER = 'OTHER',
}

// Unit Systems
export enum UnitSystem {
  UCUM = 'UCUM', // Unified Code for Units of Measure
  SI = 'SI', // International System of Units
  CONVENTIONAL = 'CONVENTIONAL',
}

// Reference Range Types
export enum ReferenceRangeType {
  NORMAL = 'NORMAL',
  CRITICAL_LOW = 'CRITICAL_LOW',
  CRITICAL_HIGH = 'CRITICAL_HIGH',
  THERAPEUTIC = 'THERAPEUTIC',
  TOXIC = 'TOXIC',
}

// LOINC Code Interface
export interface LOINCCode {
  id: string;
  loincNumber: string; // e.g., "2345-7"
  component: string; // e.g., "Glucose"
  property: string; // e.g., "MCnc" (Mass Concentration)
  timeAspect: string; // e.g., "Pt" (Point in time)
  system: string; // e.g., "Ser/Plas" (Serum or Plasma)
  scale: string; // e.g., "Qn" (Quantitative)
  method?: string; // e.g., "Enzymatic"
  category: LOINCCategory;
  componentType: ComponentType;
  commonName: string;
  shortName: string;
  longName: string;
  relatedNames?: string[];
  units: LOINCUnit[];
  referenceRanges: ReferenceRange[];
  status: 'ACTIVE' | 'DEPRECATED' | 'TRIAL';
  version: string;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// LOINC Unit Interface
export interface LOINCUnit {
  id: string;
  loincCodeId: string;
  unit: string; // e.g., "mg/dL"
  ucumCode: string; // e.g., "mg/dL"
  unitSystem: UnitSystem;
  conversionFactor?: number; // For unit conversion
  isPrimary: boolean;
  createdAt: Date;
}

// Reference Range Interface
export interface ReferenceRange {
  id: string;
  loincCodeId: string;
  type: ReferenceRangeType;
  lowValue?: number;
  highValue?: number;
  unit: string;
  ageMin?: number; // Age in years
  ageMax?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'ALL';
  condition?: string; // e.g., "Pregnant", "Fasting"
  population?: string; // e.g., "Adult", "Pediatric"
  source: string; // e.g., "Mayo Clinic"
  effectiveDate: Date;
  createdAt: Date;
}

// Code Mapping Interface (for mapping between different coding systems)
export interface CodeMapping {
  id: string;
  loincCode: string;
  targetSystem: string; // e.g., "SNOMED-CT", "CPT", "ICD-10"
  targetCode: string;
  relationship: 'EQUIVALENT' | 'BROADER' | 'NARROWER' | 'RELATED';
  confidence: number; // 0-1
  source: string;
  createdAt: Date;
}

// Validation Result Interface
export interface ValidationResult {
  isValid: boolean;
  loincCode?: LOINCCode;
  errors: string[];
  warnings: string[];
  suggestions: LOINCCode[];
}

// Standardization Result Interface
export interface StandardizationResult {
  originalValue: any;
  standardizedValue: any;
  loincCode: LOINCCode;
  unit: LOINCUnit;
  referenceRange?: ReferenceRange;
  isWithinRange: boolean;
  interpretation?: string;
  flags: string[]; // e.g., "HIGH", "LOW", "CRITICAL"
}

export class MedicalStandardizationRepository {
  /**
   * Search for LOINC codes by various criteria
   */
  async searchLOINCCodes(params: {
    query?: string;
    category?: LOINCCategory;
    componentType?: ComponentType;
    component?: string;
    system?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ codes: LOINCCode[]; total: number }> {
    const {
      query,
      category,
      componentType,
      component,
      system,
      limit = 50,
      offset = 0,
    } = params;

    const where: any = { status: 'ACTIVE' };

    if (query) {
      where.OR = [
        { loincNumber: { contains: query, mode: 'insensitive' } },
        { component: { contains: query, mode: 'insensitive' } },
        { commonName: { contains: query, mode: 'insensitive' } },
        { shortName: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (componentType) where.componentType = componentType;
    if (component) where.component = { contains: component, mode: 'insensitive' };
    if (system) where.system = { contains: system, mode: 'insensitive' };

    const [codes, total] = await Promise.all([
      prisma.lOINCCode.findMany({
        where,
        include: {
          units: true,
          referenceRanges: true,
        },
        take: limit,
        skip: offset,
        orderBy: { commonName: 'asc' },
      }),
      prisma.lOINCCode.count({ where }),
    ]);

    return { codes: codes as any, total };
  }

  /**
   * Get LOINC code by LOINC number
   */
  async getLOINCCode(loincNumber: string): Promise<LOINCCode | null> {
    const code = await prisma.lOINCCode.findUnique({
      where: { loincNumber },
      include: {
        units: true,
        referenceRanges: true,
      },
    });

    return code as any;
  }

  /**
   * Get LOINC code by ID
   */
  async getLOINCCodeById(id: string): Promise<LOINCCode | null> {
    const code = await prisma.lOINCCode.findUnique({
      where: { id },
      include: {
        units: true,
        referenceRanges: true,
      },
    });

    return code as any;
  }

  /**
   * Validate a lab result against LOINC standards
   */
  async validateLabResult(params: {
    loincNumber?: string;
    testName?: string;
    value: any;
    unit?: string;
    customerAge?: number;
    customerGender?: 'MALE' | 'FEMALE' | 'OTHER';
  }): Promise<ValidationResult> {
    const { loincNumber, testName, value, unit, customerAge, customerGender } = params;

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: LOINCCode[] = [];

    // Find LOINC code
    let loincCode: LOINCCode | null = null;

    if (loincNumber) {
      loincCode = await this.getLOINCCode(loincNumber);
      if (!loincCode) {
        errors.push(`LOINC code ${loincNumber} not found`);
      }
    } else if (testName) {
      const searchResult = await this.searchLOINCCodes({
        query: testName,
        limit: 5,
      });
      if (searchResult.codes.length === 0) {
        errors.push(`No LOINC codes found for test name: ${testName}`);
      } else if (searchResult.codes.length === 1) {
        loincCode = searchResult.codes[0];
      } else {
        warnings.push(`Multiple LOINC codes found for test name: ${testName}`);
        suggestions.push(...searchResult.codes);
        loincCode = searchResult.codes[0]; // Use first match
      }
    } else {
      errors.push('Either loincNumber or testName must be provided');
    }

    // Validate unit
    if (loincCode && unit) {
      const validUnit = loincCode.units.find(u => 
        u.unit.toLowerCase() === unit.toLowerCase() ||
        u.ucumCode.toLowerCase() === unit.toLowerCase()
      );
      if (!validUnit) {
        warnings.push(`Unit ${unit} is not standard for this test. Expected: ${loincCode.units.map(u => u.unit).join(', ')}`);
      }
    }

    // Validate value type
    if (loincCode && value !== null && value !== undefined) {
      if (loincCode.scale === 'Qn') {
        // Quantitative - should be numeric
        if (isNaN(Number(value))) {
          errors.push(`Value should be numeric for quantitative test`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      loincCode: loincCode || undefined,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Standardize a lab result
   */
  async standardizeLabResult(params: {
    loincNumber: string;
    value: any;
    unit: string;
    customerAge?: number;
    customerGender?: 'MALE' | 'FEMALE' | 'OTHER';
    condition?: string;
  }): Promise<StandardizationResult> {
    const { loincNumber, value, unit, customerAge, customerGender, condition } = params;

    // Get LOINC code
    const loincCode = await this.getLOINCCode(loincNumber);
    if (!loincCode) {
      throw new Error(`LOINC code ${loincNumber} not found`);
    }

    // Find matching unit
    const loincUnit = loincCode.units.find(u => 
      u.unit.toLowerCase() === unit.toLowerCase() ||
      u.ucumCode.toLowerCase() === unit.toLowerCase()
    );

    if (!loincUnit) {
      throw new Error(`Unit ${unit} not found for LOINC code ${loincNumber}`);
    }

    // Convert to primary unit if needed
    let standardizedValue = Number(value);
    const primaryUnit = loincCode.units.find(u => u.isPrimary);
    
    if (primaryUnit && loincUnit.id !== primaryUnit.id && loincUnit.conversionFactor) {
      standardizedValue = standardizedValue * loincUnit.conversionFactor;
    }

    // Find applicable reference range
    const referenceRange = this.findApplicableReferenceRange(
      loincCode.referenceRanges,
      customerAge,
      customerGender,
      condition
    );

    // Determine if within range
    let isWithinRange = true;
    const flags: string[] = [];
    let interpretation: string | undefined;

    if (referenceRange) {
      if (referenceRange.lowValue !== null && standardizedValue < referenceRange.lowValue) {
        isWithinRange = false;
        flags.push('LOW');
        if (referenceRange.type === ReferenceRangeType.CRITICAL_LOW) {
          flags.push('CRITICAL');
          interpretation = 'Critically low value';
        } else {
          interpretation = 'Below normal range';
        }
      }
      if (referenceRange.highValue !== null && standardizedValue > referenceRange.highValue) {
        isWithinRange = false;
        flags.push('HIGH');
        if (referenceRange.type === ReferenceRangeType.CRITICAL_HIGH) {
          flags.push('CRITICAL');
          interpretation = 'Critically high value';
        } else {
          interpretation = 'Above normal range';
        }
      }
      if (isWithinRange) {
        interpretation = 'Within normal range';
      }
    }

    return {
      originalValue: value,
      standardizedValue,
      loincCode,
      unit: primaryUnit || loincUnit,
      referenceRange,
      isWithinRange,
      interpretation,
      flags,
    };
  }

  /**
   * Find applicable reference range based on patient demographics
   */
  private findApplicableReferenceRange(
    ranges: ReferenceRange[],
    age?: number,
    gender?: 'MALE' | 'FEMALE' | 'OTHER',
    condition?: string
  ): ReferenceRange | undefined {
    // Filter by normal ranges first
    let applicableRanges = ranges.filter(r => r.type === ReferenceRangeType.NORMAL);

    // Filter by age
    if (age !== undefined) {
      applicableRanges = applicableRanges.filter(r => {
        if (r.ageMin !== null && age < r.ageMin) return false;
        if (r.ageMax !== null && age > r.ageMax) return false;
        return true;
      });
    }

    // Filter by gender
    if (gender) {
      applicableRanges = applicableRanges.filter(r => 
        r.gender === gender || r.gender === 'ALL' || r.gender === null
      );
    }

    // Filter by condition
    if (condition) {
      const conditionRanges = applicableRanges.filter(r => 
        r.condition?.toLowerCase() === condition.toLowerCase()
      );
      if (conditionRanges.length > 0) {
        applicableRanges = conditionRanges;
      }
    }

    // Return most specific range (prefer with condition, then gender, then age)
    return applicableRanges.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (a.condition) scoreA += 4;
      if (b.condition) scoreB += 4;
      if (a.gender && a.gender !== 'ALL') scoreA += 2;
      if (b.gender && b.gender !== 'ALL') scoreB += 2;
      if (a.ageMin !== null || a.ageMax !== null) scoreA += 1;
      if (b.ageMin !== null || b.ageMax !== null) scoreB += 1;
      return scoreB - scoreA;
    })[0];
  }

  /**
   * Get code mappings for a LOINC code
   */
  async getCodeMappings(loincNumber: string): Promise<CodeMapping[]> {
    const mappings = await prisma.codeMapping.findMany({
      where: { loincCode: loincNumber },
      orderBy: { confidence: 'desc' },
    });

    return mappings as any;
  }

  /**
   * Map LOINC code to another coding system
   */
  async mapToSystem(
    loincNumber: string,
    targetSystem: string
  ): Promise<CodeMapping[]> {
    const mappings = await prisma.codeMapping.findMany({
      where: {
        loincCode: loincNumber,
        targetSystem,
      },
      orderBy: { confidence: 'desc' },
    });

    return mappings as any;
  }

  /**
   * Get popular LOINC codes by category
   */
  async getPopularCodes(
    category: LOINCCategory,
    limit: number = 20
  ): Promise<LOINCCode[]> {
    const codes = await prisma.lOINCCode.findMany({
      where: {
        category,
        status: 'ACTIVE',
      },
      include: {
        units: true,
        referenceRanges: true,
      },
      take: limit,
      orderBy: { commonName: 'asc' },
    });

    return codes as any;
  }

  /**
   * Get statistics about the LOINC database
   */
  async getStatistics(): Promise<{
    totalCodes: number;
    activeCodesByCategory: Record<LOINCCategory, number>;
    activeCodesByType: Record<ComponentType, number>;
    totalUnits: number;
    totalReferenceRanges: number;
    totalMappings: number;
  }> {
    const [
      totalCodes,
      activeCodesByCategory,
      activeCodesByType,
      totalUnits,
      totalReferenceRanges,
      totalMappings,
    ] = await Promise.all([
      prisma.lOINCCode.count(),
      prisma.lOINCCode.groupBy({
        by: ['category'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
      prisma.lOINCCode.groupBy({
        by: ['componentType'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
      prisma.lOINCUnit.count(),
      prisma.referenceRange.count(),
      prisma.codeMapping.count(),
    ]);

    return {
      totalCodes,
      activeCodesByCategory: activeCodesByCategory.reduce((acc, item) => {
        acc[item.category as LOINCCategory] = item._count;
        return acc;
      }, {} as Record<LOINCCategory, number>),
      activeCodesByType: activeCodesByType.reduce((acc, item) => {
        acc[item.componentType as ComponentType] = item._count;
        return acc;
      }, {} as Record<ComponentType, number>),
      totalUnits,
      totalReferenceRanges,
      totalMappings,
    };
  }

  /**
   * Batch standardize lab results
   */
  async batchStandardize(
    results: Array<{
      loincNumber: string;
      value: any;
      unit: string;
      customerAge?: number;
      customerGender?: 'MALE' | 'FEMALE' | 'OTHER';
      condition?: string;
    }>
  ): Promise<StandardizationResult[]> {
    return Promise.all(
      results.map(result => this.standardizeLabResult(result))
    );
  }

  /**
   * Convert between units
   */
  async convertUnit(
    loincNumber: string,
    value: number,
    fromUnit: string,
    toUnit: string
  ): Promise<{ value: number; unit: string }> {
    const loincCode = await this.getLOINCCode(loincNumber);
    if (!loincCode) {
      throw new Error(`LOINC code ${loincNumber} not found`);
    }

    const fromUnitObj = loincCode.units.find(u => 
      u.unit.toLowerCase() === fromUnit.toLowerCase() ||
      u.ucumCode.toLowerCase() === fromUnit.toLowerCase()
    );

    const toUnitObj = loincCode.units.find(u => 
      u.unit.toLowerCase() === toUnit.toLowerCase() ||
      u.ucumCode.toLowerCase() === toUnit.toLowerCase()
    );

    if (!fromUnitObj || !toUnitObj) {
      throw new Error(`Unit conversion not available`);
    }

    // Convert to primary unit first, then to target unit
    const primaryUnit = loincCode.units.find(u => u.isPrimary);
    if (!primaryUnit) {
      throw new Error(`No primary unit defined for LOINC code ${loincNumber}`);
    }

    let convertedValue = value;

    // Convert from source to primary
    if (fromUnitObj.id !== primaryUnit.id && fromUnitObj.conversionFactor) {
      convertedValue = convertedValue * fromUnitObj.conversionFactor;
    }

    // Convert from primary to target
    if (toUnitObj.id !== primaryUnit.id && toUnitObj.conversionFactor) {
      convertedValue = convertedValue / toUnitObj.conversionFactor;
    }

    return {
      value: convertedValue,
      unit: toUnitObj.unit,
    };
  }
}

// Export singleton instance
let instance: MedicalStandardizationRepository | null = null;

export function getMedicalStandardizationRepository(): MedicalStandardizationRepository {
  if (!instance) {
    instance = new MedicalStandardizationRepository();
  }
  return instance;
}