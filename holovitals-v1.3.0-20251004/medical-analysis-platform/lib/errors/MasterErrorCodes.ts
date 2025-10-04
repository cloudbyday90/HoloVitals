/**
 * Master Error Code System
 * Groups similar errors under master codes for better tracking and resolution
 */

export enum MasterErrorCategory {
  DATABASE = 'DATABASE',
  API_INTEGRATION = 'API_INTEGRATION',
  EHR_SYNC = 'EHR_SYNC',
  VALIDATION = 'VALIDATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SYSTEM = 'SYSTEM',
  NETWORK = 'NETWORK',
  HIPAA_COMPLIANCE = 'HIPAA_COMPLIANCE',
}

export interface MasterErrorDefinition {
  code: string;
  category: MasterErrorCategory;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolutionGuide: string;
  subCodes: string[];
}

/**
 * Master Error Code Definitions
 */
export const MASTER_ERROR_CODES: Record<string, MasterErrorDefinition> = {
  // ============================================================================
  // DATABASE ERRORS
  // ============================================================================
  DB_CONNECTION_ERROR: {
    code: 'DB_CONNECTION_ERROR',
    category: MasterErrorCategory.DATABASE,
    description: 'Database connection failures',
    severity: 'CRITICAL',
    resolutionGuide: 'Check database connection string, network connectivity, and database server status',
    subCodes: [
      'DB_TIMEOUT',
      'DB_AUTH_FAILED',
      'DB_POOL_EXHAUSTED',
      'DB_CONNECTION_REFUSED',
      'DB_HOST_UNREACHABLE',
    ],
  },

  DB_QUERY_ERROR: {
    code: 'DB_QUERY_ERROR',
    category: MasterErrorCategory.DATABASE,
    description: 'Database query execution failures',
    severity: 'HIGH',
    resolutionGuide: 'Review query syntax, check table schema, verify data types',
    subCodes: [
      'DB_SYNTAX_ERROR',
      'DB_CONSTRAINT_VIOLATION',
      'DB_DEADLOCK',
      'DB_TRANSACTION_FAILED',
      'DB_FOREIGN_KEY_VIOLATION',
    ],
  },

  // ============================================================================
  // API INTEGRATION ERRORS
  // ============================================================================
  API_INTEGRATION_ERROR: {
    code: 'API_INTEGRATION_ERROR',
    category: MasterErrorCategory.API_INTEGRATION,
    description: 'External API integration failures',
    severity: 'HIGH',
    resolutionGuide: 'Check API credentials, rate limits, and service status',
    subCodes: [
      'API_TIMEOUT',
      'API_RATE_LIMIT',
      'API_AUTH_FAILED',
      'API_INVALID_RESPONSE',
      'API_SERVICE_UNAVAILABLE',
      'API_BAD_REQUEST',
    ],
  },

  // ============================================================================
  // EHR SYNCHRONIZATION ERRORS
  // ============================================================================
  EHR_SYNC_ERROR: {
    code: 'EHR_SYNC_ERROR',
    category: MasterErrorCategory.EHR_SYNC,
    description: 'EHR data synchronization failures',
    severity: 'HIGH',
    resolutionGuide: 'Verify EHR credentials, check data format, review sync logs',
    subCodes: [
      'EHR_INVALID_CREDENTIALS',
      'EHR_DATA_FORMAT_ERROR',
      'EHR_CONNECTION_TIMEOUT',
      'EHR_SYNC_CONFLICT',
      'EHR_MISSING_REQUIRED_FIELD',
      'EPIC_SYNC_ERROR',
      'CERNER_SYNC_ERROR',
      'ALLSCRIPTS_SYNC_ERROR',
    ],
  },

  EHR_FHIR_ERROR: {
    code: 'EHR_FHIR_ERROR',
    category: MasterErrorCategory.EHR_SYNC,
    description: 'FHIR protocol errors',
    severity: 'MEDIUM',
    resolutionGuide: 'Check FHIR resource format, validate against FHIR specification',
    subCodes: [
      'FHIR_VALIDATION_ERROR',
      'FHIR_RESOURCE_NOT_FOUND',
      'FHIR_INVALID_RESOURCE',
      'FHIR_VERSION_MISMATCH',
    ],
  },

  // ============================================================================
  // VALIDATION ERRORS
  // ============================================================================
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    category: MasterErrorCategory.VALIDATION,
    description: 'Input validation failures',
    severity: 'MEDIUM',
    resolutionGuide: 'Review input data format and required fields',
    subCodes: [
      'INVALID_INPUT_FORMAT',
      'MISSING_REQUIRED_FIELD',
      'DATA_TYPE_MISMATCH',
      'INVALID_DATE_FORMAT',
      'INVALID_EMAIL_FORMAT',
      'INVALID_PHONE_FORMAT',
      'VALUE_OUT_OF_RANGE',
    ],
  },

  // ============================================================================
  // AUTHORIZATION ERRORS
  // ============================================================================
  AUTHORIZATION_ERROR: {
    code: 'AUTHORIZATION_ERROR',
    category: MasterErrorCategory.AUTHORIZATION,
    description: 'Access control and authentication failures',
    severity: 'HIGH',
    resolutionGuide: 'Verify user permissions, check authentication tokens',
    subCodes: [
      'INSUFFICIENT_PERMISSIONS',
      'INVALID_TOKEN',
      'SESSION_EXPIRED',
      'UNAUTHORIZED_ACCESS',
      'INVALID_CREDENTIALS',
      'MFA_REQUIRED',
      'ACCOUNT_LOCKED',
    ],
  },

  // ============================================================================
  // SYSTEM ERRORS
  // ============================================================================
  SYSTEM_ERROR: {
    code: 'SYSTEM_ERROR',
    category: MasterErrorCategory.SYSTEM,
    description: 'System-level failures',
    severity: 'CRITICAL',
    resolutionGuide: 'Check system resources, logs, and service status',
    subCodes: [
      'OUT_OF_MEMORY',
      'DISK_FULL',
      'CPU_OVERLOAD',
      'SERVICE_UNAVAILABLE',
      'CONFIGURATION_ERROR',
      'DEPENDENCY_MISSING',
    ],
  },

  FILE_SYSTEM_ERROR: {
    code: 'FILE_SYSTEM_ERROR',
    category: MasterErrorCategory.SYSTEM,
    description: 'File system operation failures',
    severity: 'MEDIUM',
    resolutionGuide: 'Check file permissions, disk space, and file paths',
    subCodes: [
      'FILE_NOT_FOUND',
      'PERMISSION_DENIED',
      'DISK_FULL',
      'FILE_LOCKED',
      'INVALID_PATH',
    ],
  },

  // ============================================================================
  // NETWORK ERRORS
  // ============================================================================
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    category: MasterErrorCategory.NETWORK,
    description: 'Network connectivity failures',
    severity: 'HIGH',
    resolutionGuide: 'Check network connectivity, firewall rules, and DNS resolution',
    subCodes: [
      'CONNECTION_TIMEOUT',
      'CONNECTION_REFUSED',
      'DNS_RESOLUTION_FAILED',
      'NETWORK_UNREACHABLE',
      'SSL_CERTIFICATE_ERROR',
    ],
  },

  // ============================================================================
  // HIPAA COMPLIANCE ERRORS
  // ============================================================================
  HIPAA_VIOLATION: {
    code: 'HIPAA_VIOLATION',
    category: MasterErrorCategory.HIPAA_COMPLIANCE,
    description: 'HIPAA compliance violations',
    severity: 'CRITICAL',
    resolutionGuide: 'Immediate review required - potential PHI exposure or unauthorized access',
    subCodes: [
      'PHI_ACCESS_ERROR',
      'UNAUTHORIZED_PHI_ACCESS',
      'PHI_DISCLOSURE_ERROR',
      'AUDIT_LOG_FAILURE',
      'ENCRYPTION_ERROR',
      'BAA_VIOLATION',
    ],
  },
};

/**
 * Error Code Classifier
 * Maps specific error codes to master error codes
 */
export class ErrorCodeClassifier {
  private static codeToMasterMap: Map<string, string> = new Map();

  static {
    // Build reverse mapping from sub-codes to master codes
    Object.entries(MASTER_ERROR_CODES).forEach(([masterCode, definition]) => {
      definition.subCodes.forEach(subCode => {
        this.codeToMasterMap.set(subCode, masterCode);
      });
    });
  }

  /**
   * Get master error code for a specific error code
   */
  static getMasterCode(errorCode: string): string | null {
    return this.codeToMasterMap.get(errorCode) || null;
  }

  /**
   * Get master error definition
   */
  static getMasterDefinition(masterCode: string): MasterErrorDefinition | null {
    return MASTER_ERROR_CODES[masterCode] || null;
  }

  /**
   * Get master error definition for a specific error code
   */
  static getMasterDefinitionForCode(errorCode: string): MasterErrorDefinition | null {
    const masterCode = this.getMasterCode(errorCode);
    return masterCode ? this.getMasterDefinition(masterCode) : null;
  }

  /**
   * Check if error code belongs to a master code
   */
  static belongsToMaster(errorCode: string, masterCode: string): boolean {
    return this.getMasterCode(errorCode) === masterCode;
  }

  /**
   * Get all sub-codes for a master code
   */
  static getSubCodes(masterCode: string): string[] {
    const definition = this.getMasterDefinition(masterCode);
    return definition ? definition.subCodes : [];
  }

  /**
   * Classify error by message pattern
   */
  static classifyByMessage(message: string): string | null {
    const lowerMessage = message.toLowerCase();

    // Database errors
    if (lowerMessage.includes('connection') && (lowerMessage.includes('database') || lowerMessage.includes('db'))) {
      return 'DB_CONNECTION_ERROR';
    }
    if (lowerMessage.includes('query') || lowerMessage.includes('sql')) {
      return 'DB_QUERY_ERROR';
    }

    // API errors
    if (lowerMessage.includes('api') || lowerMessage.includes('endpoint')) {
      return 'API_INTEGRATION_ERROR';
    }

    // EHR errors
    if (lowerMessage.includes('ehr') || lowerMessage.includes('epic') || lowerMessage.includes('cerner')) {
      return 'EHR_SYNC_ERROR';
    }
    if (lowerMessage.includes('fhir')) {
      return 'EHR_FHIR_ERROR';
    }

    // Validation errors
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }

    // Authorization errors
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('permission') || lowerMessage.includes('auth')) {
      return 'AUTHORIZATION_ERROR';
    }

    // Network errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('network') || lowerMessage.includes('connection refused')) {
      return 'NETWORK_ERROR';
    }

    // HIPAA errors
    if (lowerMessage.includes('phi') || lowerMessage.includes('hipaa')) {
      return 'HIPAA_VIOLATION';
    }

    // System errors
    if (lowerMessage.includes('memory') || lowerMessage.includes('disk') || lowerMessage.includes('cpu')) {
      return 'SYSTEM_ERROR';
    }
    if (lowerMessage.includes('file') || lowerMessage.includes('path')) {
      return 'FILE_SYSTEM_ERROR';
    }

    return null;
  }

  /**
   * Get all master codes by category
   */
  static getMasterCodesByCategory(category: MasterErrorCategory): string[] {
    return Object.entries(MASTER_ERROR_CODES)
      .filter(([_, definition]) => definition.category === category)
      .map(([code, _]) => code);
  }

  /**
   * Get all master codes
   */
  static getAllMasterCodes(): string[] {
    return Object.keys(MASTER_ERROR_CODES);
  }
}