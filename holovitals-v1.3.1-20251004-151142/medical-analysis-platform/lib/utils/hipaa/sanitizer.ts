/**
 * HIPAA Compliance Data Sanitizer
 * Removes all PII (Personally Identifiable Information) and PHI (Protected Health Information)
 * from data before storing in cache or processing
 */

export interface SanitizationResult {
  sanitizedData: any;
  removedFields: string[];
  sanitizationLevel: 'full' | 'partial' | 'none';
  timestamp: Date;
}

export class HIPAASanitizer {
  // PII/PHI fields that must be removed or anonymized
  private static readonly SENSITIVE_FIELDS = [
    // Direct Identifiers (must be removed)
    'name', 'firstName', 'lastName', 'fullName',
    'ssn', 'socialSecurityNumber',
    'email', 'emailAddress',
    'phone', 'phoneNumber', 'telephone', 'mobile',
    'address', 'streetAddress', 'street', 'city', 'state', 'zipCode', 'postalCode',
    'dateOfBirth', 'dob', 'birthDate',
    'medicalRecordNumber', 'mrn', 'patientId',
    'accountNumber', 'certificateNumber', 'licenseNumber',
    'vehicleIdentifier', 'deviceIdentifier', 'serialNumber',
    'url', 'website', 'ipAddress', 'macAddress',
    'biometricIdentifier', 'facePhoto', 'fingerprint',
    '
', 'photograph', 'image',
    
    // Quasi-identifiers (may need anonymization)
    'age', 'gender', 'race', 'ethnicity',
    'occupation', 'employer',
    'geographicLocation', 'location', 'coordinates',
  ];

  // Patterns to detect in text
  private static readonly SENSITIVE_PATTERNS = [
    // SSN patterns
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{9}\b/g,
    
    // Phone patterns
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
    
    // Email patterns
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    
    // Date patterns (potential DOB)
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g,
    
    // Address patterns
    /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi,
    
    // ZIP code patterns
    /\b\d{5}(?:-\d{4})?\b/g,
    
    // Medical Record Number patterns
    /\b(?:MRN|Medical Record|Patient ID)[\s:]*[A-Z0-9-]+\b/gi,
  ];

  /**
   * Sanitize data by removing all PII/PHI
   */
  static sanitize(data: any, options: SanitizationOptions = {}): SanitizationResult {
    const removedFields: string[] = [];
    const sanitizedData = this.deepSanitize(data, removedFields, options);
    
    return {
      sanitizedData,
      removedFields,
      sanitizationLevel: removedFields.length > 0 ? 'full' : 'none',
      timestamp: new Date()
    };
  }

  /**
   * Deep sanitization of nested objects
   */
  private static deepSanitize(
    obj: any,
    removedFields: string[],
    options: SanitizationOptions,
    path: string = ''
  ): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        this.deepSanitize(item, removedFields, options, `${path}[${index}]`)
      );
    }

    // Handle objects
    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if field should be removed
        if (this.isSensitiveField(key)) {
          removedFields.push(currentPath);
          
          // Optionally replace with placeholder
          if (options.usePlaceholders) {
            sanitized[key] = this.getPlaceholder(key);
          }
          continue;
        }

        // Recursively sanitize nested objects
        if (typeof value === 'object') {
          sanitized[key] = this.deepSanitize(value, removedFields, options, currentPath);
        } 
        // Sanitize string values
        else if (typeof value === 'string') {
          const sanitizedString = this.sanitizeString(value);
          if (sanitizedString !== value) {
            removedFields.push(`${currentPath} (pattern match)`);
          }
          sanitized[key] = sanitizedString;
        } 
        // Keep other primitive values
        else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }

    // Handle strings
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    // Return primitive values as-is
    return obj;
  }

  /**
   * Check if a field name is sensitive
   */
  private static isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.SENSITIVE_FIELDS.some(sensitive => 
      lowerField.includes(sensitive.toLowerCase())
    );
  }

  /**
   * Sanitize string content by removing patterns
   */
  private static sanitizeString(text: string): string {
    let sanitized = text;
    
    for (const pattern of this.SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    
    return sanitized;
  }

  /**
   * Get placeholder for sensitive field
   */
  private static getPlaceholder(fieldName: string): string {
    const lowerField = fieldName.toLowerCase();
    
    if (lowerField.includes('name')) return '[NAME_REDACTED]';
    if (lowerField.includes('email')) return '[EMAIL_REDACTED]';
    if (lowerField.includes('phone')) return '[PHONE_REDACTED]';
    if (lowerField.includes('address')) return '[ADDRESS_REDACTED]';
    if (lowerField.includes('ssn')) return '[SSN_REDACTED]';
    if (lowerField.includes('date')) return '[DATE_REDACTED]';
    
    return '[REDACTED]';
  }

  /**
   * Validate that data is properly sanitized
   */
  static validate(data: any): ValidationResult {
    const issues: string[] = [];
    this.deepValidate(data, issues);
    
    return {
      isValid: issues.length === 0,
      issues,
      timestamp: new Date()
    };
  }

  /**
   * Deep validation of sanitized data
   */
  private static deepValidate(obj: any, issues: string[], path: string = ''): void {
    if (obj === null || obj === undefined) return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => 
        this.deepValidate(item, issues, `${path}[${index}]`)
      );
      return;
    }

    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check for sensitive field names
        if (this.isSensitiveField(key)) {
          issues.push(`Sensitive field found: ${currentPath}`);
        }

        // Recursively validate
        this.deepValidate(value, issues, currentPath);
      }
      return;
    }

    // Check string content for patterns
    if (typeof obj === 'string') {
      for (const pattern of this.SENSITIVE_PATTERNS) {
        if (pattern.test(obj)) {
          issues.push(`Sensitive pattern found in: ${path}`);
          break;
        }
      }
    }
  }

  /**
   * Create anonymized version of data (keeps structure, removes values)
   */
  static anonymize(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.anonymize(item));
    }

    if (typeof data === 'object') {
      const anonymized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          anonymized[key] = this.getPlaceholder(key);
        } else if (typeof value === 'object') {
          anonymized[key] = this.anonymize(value);
        } else {
          anonymized[key] = value;
        }
      }
      return anonymized;
    }

    return data;
  }
}

export interface SanitizationOptions {
  usePlaceholders?: boolean;
  preserveStructure?: boolean;
  customSensitiveFields?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  timestamp: Date;
}