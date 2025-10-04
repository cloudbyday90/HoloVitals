/**
 * Data Transformation Service
 * 
 * Handles data transformation, mapping, and validation between HoloVitals
 * internal format and various EHR provider formats.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Transformation Rule Types
export enum TransformationRuleType {
  FIELD_MAPPING = 'FIELD_MAPPING',
  VALUE_MAPPING = 'VALUE_MAPPING',
  DATA_TYPE_CONVERSION = 'DATA_TYPE_CONVERSION',
  CONCATENATION = 'CONCATENATION',
  SPLIT = 'SPLIT',
  CALCULATION = 'CALCULATION',
  CONDITIONAL = 'CONDITIONAL',
  LOOKUP = 'LOOKUP',
  CUSTOM_FUNCTION = 'CUSTOM_FUNCTION',
}

// Data Format Types
export enum DataFormat {
  FHIR_R4 = 'FHIR_R4',
  FHIR_STU3 = 'FHIR_STU3',
  FHIR_DSTU2 = 'FHIR_DSTU2',
  HL7_V2 = 'HL7_V2',
  CDA = 'CDA',
  CUSTOM_JSON = 'CUSTOM_JSON',
  CUSTOM_XML = 'CUSTOM_XML',
}

// Transformation Rule
export interface TransformationRule {
  ruleId: string;
  name: string;
  type: TransformationRuleType;
  sourceFormat: DataFormat;
  targetFormat: DataFormat;
  sourceField: string;
  targetField: string;
  mapping?: Record<string, any>;
  function?: string;
  condition?: string;
  priority: number;
  enabled: boolean;
  metadata?: Record<string, any>;
}

// Transformation Context
export interface TransformationContext {
  ehrProvider: string;
  resourceType: string;
  direction: 'INBOUND' | 'OUTBOUND';
  sourceFormat: DataFormat;
  targetFormat: DataFormat;
  options?: {
    validateOutput?: boolean;
    strictMode?: boolean;
    preserveUnmapped?: boolean;
    includeMetadata?: boolean;
  };
}

// Transformation Result
export interface TransformationResult {
  success: boolean;
  data: any;
  errors: TransformationError[];
  warnings: TransformationWarning[];
  metadata: {
    rulesApplied: number;
    fieldsTransformed: number;
    duration: number;
    sourceFormat: DataFormat;
    targetFormat: DataFormat;
  };
}

// Transformation Error
export interface TransformationError {
  field: string;
  rule?: string;
  message: string;
  severity: 'CRITICAL' | 'ERROR';
  context?: Record<string, any>;
}

// Transformation Warning
export interface TransformationWarning {
  field: string;
  rule?: string;
  message: string;
  context?: Record<string, any>;
}

// Field Mapping
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  defaultValue?: any;
  transform?: (value: any) => any;
}

/**
 * Data Transformation Service
 */
export class DataTransformationService {
  private transformationRules: Map<string, TransformationRule[]> = new Map();
  private fieldMappings: Map<string, FieldMapping[]> = new Map();

  constructor() {
    this.initializeTransformationRules();
    this.initializeFieldMappings();
  }

  /**
   * Transform data from source format to target format
   */
  async transform(
    data: any,
    context: TransformationContext
  ): Promise<TransformationResult> {
    const startTime = Date.now();
    const errors: TransformationError[] = [];
    const warnings: TransformationWarning[] = [];
    let transformedData: any = {};
    let rulesApplied = 0;
    let fieldsTransformed = 0;

    try {
      // Get applicable transformation rules
      const rules = this.getApplicableRules(context);

      // Sort rules by priority
      rules.sort((a, b) => a.priority - b.priority);

      // Apply transformation rules
      for (const rule of rules) {
        if (!rule.enabled) continue;

        try {
          const result = await this.applyRule(data, rule, context);
          if (result.success) {
            transformedData = { ...transformedData, ...result.data };
            rulesApplied++;
            fieldsTransformed += Object.keys(result.data).length;
          } else {
            errors.push(...result.errors);
          }
          warnings.push(...result.warnings);
        } catch (error) {
          errors.push({
            field: rule.sourceField,
            rule: rule.ruleId,
            message: `Rule application failed: ${error.message}`,
            severity: 'ERROR',
          });
        }
      }

      // Validate output if requested
      if (context.options?.validateOutput) {
        const validationErrors = await this.validateTransformedData(
          transformedData,
          context
        );
        errors.push(...validationErrors);
      }

      // Preserve unmapped fields if requested
      if (context.options?.preserveUnmapped) {
        const unmappedFields = this.getUnmappedFields(data, rules);
        transformedData = { ...transformedData, ...unmappedFields };
      }

      const duration = Date.now() - startTime;

      return {
        success: errors.filter(e => e.severity === 'CRITICAL').length === 0,
        data: transformedData,
        errors,
        warnings,
        metadata: {
          rulesApplied,
          fieldsTransformed,
          duration,
          sourceFormat: context.sourceFormat,
          targetFormat: context.targetFormat,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        errors: [{
          field: 'root',
          message: `Transformation failed: ${error.message}`,
          severity: 'CRITICAL',
        }],
        warnings,
        metadata: {
          rulesApplied,
          fieldsTransformed,
          duration: Date.now() - startTime,
          sourceFormat: context.sourceFormat,
          targetFormat: context.targetFormat,
        },
      };
    }
  }

  /**
   * Transform batch of data
   */
  async transformBatch(
    dataArray: any[],
    context: TransformationContext
  ): Promise<TransformationResult[]> {
    const results: TransformationResult[] = [];

    for (const data of dataArray) {
      const result = await this.transform(data, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Apply a single transformation rule
   */
  private async applyRule(
    data: any,
    rule: TransformationRule,
    context: TransformationContext
  ): Promise<TransformationResult> {
    const errors: TransformationError[] = [];
    const warnings: TransformationWarning[] = [];
    let transformedData: any = {};

    try {
      const sourceValue = this.getNestedValue(data, rule.sourceField);

      // Check if source value exists
      if (sourceValue === undefined || sourceValue === null) {
        if (context.options?.strictMode) {
          errors.push({
            field: rule.sourceField,
            rule: rule.ruleId,
            message: 'Source field not found',
            severity: 'ERROR',
          });
        } else {
          warnings.push({
            field: rule.sourceField,
            rule: rule.ruleId,
            message: 'Source field not found, skipping',
          });
        }
        return { success: true, data: {}, errors, warnings, metadata: {} as any };
      }

      // Apply transformation based on rule type
      let transformedValue: any;

      switch (rule.type) {
        case TransformationRuleType.FIELD_MAPPING:
          transformedValue = sourceValue;
          break;

        case TransformationRuleType.VALUE_MAPPING:
          transformedValue = this.applyValueMapping(sourceValue, rule.mapping);
          break;

        case TransformationRuleType.DATA_TYPE_CONVERSION:
          transformedValue = this.convertDataType(sourceValue, rule.mapping?.targetType);
          break;

        case TransformationRuleType.CONCATENATION:
          transformedValue = this.applyConcatenation(data, rule.mapping);
          break;

        case TransformationRuleType.SPLIT:
          transformedValue = this.applySplit(sourceValue, rule.mapping);
          break;

        case TransformationRuleType.CALCULATION:
          transformedValue = this.applyCalculation(data, rule.function);
          break;

        case TransformationRuleType.CONDITIONAL:
          transformedValue = this.applyConditional(data, rule.condition, rule.mapping);
          break;

        case TransformationRuleType.LOOKUP:
          transformedValue = await this.applyLookup(sourceValue, rule.mapping);
          break;

        case TransformationRuleType.CUSTOM_FUNCTION:
          transformedValue = this.applyCustomFunction(sourceValue, rule.function);
          break;

        default:
          throw new Error(`Unknown transformation rule type: ${rule.type}`);
      }

      // Set transformed value
      this.setNestedValue(transformedData, rule.targetField, transformedValue);

      return {
        success: true,
        data: transformedData,
        errors,
        warnings,
        metadata: {} as any,
      };
    } catch (error) {
      errors.push({
        field: rule.sourceField,
        rule: rule.ruleId,
        message: `Transformation failed: ${error.message}`,
        severity: 'ERROR',
      });

      return {
        success: false,
        data: {},
        errors,
        warnings,
        metadata: {} as any,
      };
    }
  }

  /**
   * Apply value mapping
   */
  private applyValueMapping(value: any, mapping?: Record<string, any>): any {
    if (!mapping) return value;
    return mapping[value] !== undefined ? mapping[value] : value;
  }

  /**
   * Convert data type
   */
  private convertDataType(value: any, targetType?: string): any {
    if (!targetType) return value;

    switch (targetType.toLowerCase()) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      default:
        return value;
    }
  }

  /**
   * Apply concatenation
   */
  private applyConcatenation(data: any, mapping?: Record<string, any>): string {
    if (!mapping || !mapping.fields) return '';

    const values = mapping.fields.map((field: string) => 
      this.getNestedValue(data, field)
    ).filter((v: any) => v !== undefined && v !== null);

    const separator = mapping.separator || ' ';
    return values.join(separator);
  }

  /**
   * Apply split
   */
  private applySplit(value: string, mapping?: Record<string, any>): string[] {
    if (typeof value !== 'string') return [value];
    const separator = mapping?.separator || ' ';
    return value.split(separator);
  }

  /**
   * Apply calculation
   */
  private applyCalculation(data: any, functionStr?: string): any {
    if (!functionStr) return null;

    try {
      // Create a safe evaluation context
      const context = { data, Math };
      const func = new Function('context', `with(context) { return ${functionStr}; }`);
      return func(context);
    } catch (error) {
      throw new Error(`Calculation failed: ${error.message}`);
    }
  }

  /**
   * Apply conditional transformation
   */
  private applyConditional(
    data: any,
    condition?: string,
    mapping?: Record<string, any>
  ): any {
    if (!condition || !mapping) return null;

    try {
      const context = { data };
      const func = new Function('context', `with(context) { return ${condition}; }`);
      const conditionResult = func(context);

      return conditionResult ? mapping.trueValue : mapping.falseValue;
    } catch (error) {
      throw new Error(`Conditional evaluation failed: ${error.message}`);
    }
  }

  /**
   * Apply lookup transformation
   */
  private async applyLookup(value: any, mapping?: Record<string, any>): Promise<any> {
    if (!mapping || !mapping.lookupTable) return value;

    // This would typically query a database or external service
    // For now, return the value as-is
    return value;
  }

  /**
   * Apply custom function
   */
  private applyCustomFunction(value: any, functionStr?: string): any {
    if (!functionStr) return value;

    try {
      const func = new Function('value', `return ${functionStr};`);
      return func(value);
    } catch (error) {
      throw new Error(`Custom function failed: ${error.message}`);
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }

    return value;
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * Get applicable transformation rules
   */
  private getApplicableRules(context: TransformationContext): TransformationRule[] {
    const key = `${context.ehrProvider}-${context.resourceType}-${context.direction}`;
    return this.transformationRules.get(key) || [];
  }

  /**
   * Get unmapped fields
   */
  private getUnmappedFields(data: any, rules: TransformationRule[]): Record<string, any> {
    const mappedFields = new Set(rules.map(r => r.sourceField));
    const unmapped: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (!mappedFields.has(key)) {
        unmapped[key] = value;
      }
    }

    return unmapped;
  }

  /**
   * Validate transformed data
   */
  private async validateTransformedData(
    data: any,
    context: TransformationContext
  ): Promise<TransformationError[]> {
    const errors: TransformationError[] = [];

    // Get field mappings for validation
    const key = `${context.ehrProvider}-${context.resourceType}`;
    const mappings = this.fieldMappings.get(key) || [];

    // Check required fields
    for (const mapping of mappings) {
      if (mapping.required) {
        const value = this.getNestedValue(data, mapping.targetField);
        if (value === undefined || value === null) {
          errors.push({
            field: mapping.targetField,
            message: 'Required field is missing',
            severity: 'CRITICAL',
          });
        }
      }
    }

    return errors;
  }

  /**
   * Initialize transformation rules
   */
  private initializeTransformationRules(): void {
    // This would typically load rules from database
    // For now, we'll initialize with empty maps
    // Rules will be added dynamically or loaded from configuration
  }

  /**
   * Initialize field mappings
   */
  private initializeFieldMappings(): void {
    // This would typically load mappings from database
    // For now, we'll initialize with empty maps
    // Mappings will be added dynamically or loaded from configuration
  }

  /**
   * Add transformation rule
   */
  addTransformationRule(
    ehrProvider: string,
    resourceType: string,
    direction: 'INBOUND' | 'OUTBOUND',
    rule: TransformationRule
  ): void {
    const key = `${ehrProvider}-${resourceType}-${direction}`;
    const rules = this.transformationRules.get(key) || [];
    rules.push(rule);
    this.transformationRules.set(key, rules);
  }

  /**
   * Add field mapping
   */
  addFieldMapping(
    ehrProvider: string,
    resourceType: string,
    mapping: FieldMapping
  ): void {
    const key = `${ehrProvider}-${resourceType}`;
    const mappings = this.fieldMappings.get(key) || [];
    mappings.push(mapping);
    this.fieldMappings.set(key, mappings);
  }

  /**
   * Get transformation rules
   */
  getTransformationRules(
    ehrProvider: string,
    resourceType: string,
    direction: 'INBOUND' | 'OUTBOUND'
  ): TransformationRule[] {
    const key = `${ehrProvider}-${resourceType}-${direction}`;
    return this.transformationRules.get(key) || [];
  }

  /**
   * Get field mappings
   */
  getFieldMappings(ehrProvider: string, resourceType: string): FieldMapping[] {
    const key = `${ehrProvider}-${resourceType}`;
    return this.fieldMappings.get(key) || [];
  }
}

// Export singleton instance
export const dataTransformationService = new DataTransformationService();