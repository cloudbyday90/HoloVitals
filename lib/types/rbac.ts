/**
 * Role-Based Access Control (RBAC) Types
 * Defines roles, permissions, and access control for HoloVitals
 */

// ============================================================================
// USER ROLES
// ============================================================================

export enum UserRole {
  OWNER = 'OWNER',           // Platform owner - full access
  ADMIN = 'ADMIN',           // System administrator - most access
  DOCTOR = 'DOCTOR',         // Medical professional - patient data access
  PATIENT = 'PATIENT',       // End user - own data only
  SUPPORT = 'SUPPORT',       // Customer support - limited access
  ANALYST = 'ANALYST',       // Data analyst - anonymized data only
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export enum Permission {
  // Financial & Cost Permissions
  VIEW_COSTS = 'VIEW_COSTS',
  VIEW_FINANCIALS = 'VIEW_FINANCIALS',
  VIEW_REVENUE = 'VIEW_REVENUE',
  VIEW_EXPENSES = 'VIEW_EXPENSES',
  MANAGE_BILLING = 'MANAGE_BILLING',
  EXPORT_FINANCIAL_DATA = 'EXPORT_FINANCIAL_DATA',
  
  // Administrative Permissions
  VIEW_SYSTEM_STATS = 'VIEW_SYSTEM_STATS',
  VIEW_ALL_USERS = 'VIEW_ALL_USERS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  MANAGE_SYSTEM_CONFIG = 'MANAGE_SYSTEM_CONFIG',
  
  // Instance & Infrastructure Permissions
  VIEW_ALL_INSTANCES = 'VIEW_ALL_INSTANCES',
  PROVISION_INSTANCES = 'PROVISION_INSTANCES',
  TERMINATE_INSTANCES = 'TERMINATE_INSTANCES',
  VIEW_INSTANCE_COSTS = 'VIEW_INSTANCE_COSTS',
  
  // Queue & Task Permissions
  VIEW_ALL_TASKS = 'VIEW_ALL_TASKS',
  MANAGE_QUEUE = 'MANAGE_QUEUE',
  CANCEL_ANY_TASK = 'CANCEL_ANY_TASK',
  
  // Patient Data Permissions
  VIEW_OWN_DATA = 'VIEW_OWN_DATA',
  VIEW_PATIENT_DATA = 'VIEW_PATIENT_DATA',
  MANAGE_OWN_DATA = 'MANAGE_OWN_DATA',
  MANAGE_PATIENT_DATA = 'MANAGE_PATIENT_DATA',
  
  // Document Permissions
  UPLOAD_DOCUMENTS = 'UPLOAD_DOCUMENTS',
  VIEW_OWN_DOCUMENTS = 'VIEW_OWN_DOCUMENTS',
  VIEW_ALL_DOCUMENTS = 'VIEW_ALL_DOCUMENTS',
  DELETE_OWN_DOCUMENTS = 'DELETE_OWN_DOCUMENTS',
  DELETE_ANY_DOCUMENTS = 'DELETE_ANY_DOCUMENTS',
  
  // Chat & AI Permissions
  USE_CHATBOT = 'USE_CHATBOT',
  VIEW_OWN_CONVERSATIONS = 'VIEW_OWN_CONVERSATIONS',
  VIEW_ALL_CONVERSATIONS = 'VIEW_ALL_CONVERSATIONS',
  
  // Analytics Permissions
  VIEW_ANONYMIZED_ANALYTICS = 'VIEW_ANONYMIZED_ANALYTICS',
  VIEW_DETAILED_ANALYTICS = 'VIEW_DETAILED_ANALYTICS',
  EXPORT_ANALYTICS = 'EXPORT_ANALYTICS',
}

// ============================================================================
// ROLE PERMISSIONS MAPPING
// ============================================================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // OWNER - Full access to everything
  [UserRole.OWNER]: [
    // Financial
    Permission.VIEW_COSTS,
    Permission.VIEW_FINANCIALS,
    Permission.VIEW_REVENUE,
    Permission.VIEW_EXPENSES,
    Permission.MANAGE_BILLING,
    Permission.EXPORT_FINANCIAL_DATA,
    
    // Administrative
    Permission.VIEW_SYSTEM_STATS,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_SYSTEM_CONFIG,
    
    // Infrastructure
    Permission.VIEW_ALL_INSTANCES,
    Permission.PROVISION_INSTANCES,
    Permission.TERMINATE_INSTANCES,
    Permission.VIEW_INSTANCE_COSTS,
    
    // Queue
    Permission.VIEW_ALL_TASKS,
    Permission.MANAGE_QUEUE,
    Permission.CANCEL_ANY_TASK,
    
    // Patient Data
    Permission.VIEW_OWN_DATA,
    Permission.VIEW_PATIENT_DATA,
    Permission.MANAGE_OWN_DATA,
    Permission.MANAGE_PATIENT_DATA,
    
    // Documents
    Permission.UPLOAD_DOCUMENTS,
    Permission.VIEW_OWN_DOCUMENTS,
    Permission.VIEW_ALL_DOCUMENTS,
    Permission.DELETE_OWN_DOCUMENTS,
    Permission.DELETE_ANY_DOCUMENTS,
    
    // Chat
    Permission.USE_CHATBOT,
    Permission.VIEW_OWN_CONVERSATIONS,
    Permission.VIEW_ALL_CONVERSATIONS,
    
    // Analytics
    Permission.VIEW_ANONYMIZED_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
  ],
  
  // ADMIN - Most access except financial details
  [UserRole.ADMIN]: [
    // Limited Financial (no revenue/expenses)
    Permission.VIEW_COSTS,
    
    // Administrative
    Permission.VIEW_SYSTEM_STATS,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_SYSTEM_CONFIG,
    
    // Infrastructure
    Permission.VIEW_ALL_INSTANCES,
    Permission.PROVISION_INSTANCES,
    Permission.TERMINATE_INSTANCES,
    Permission.VIEW_INSTANCE_COSTS,
    
    // Queue
    Permission.VIEW_ALL_TASKS,
    Permission.MANAGE_QUEUE,
    Permission.CANCEL_ANY_TASK,
    
    // Patient Data
    Permission.VIEW_PATIENT_DATA,
    Permission.MANAGE_PATIENT_DATA,
    
    // Documents
    Permission.VIEW_ALL_DOCUMENTS,
    Permission.DELETE_ANY_DOCUMENTS,
    
    // Chat
    Permission.VIEW_ALL_CONVERSATIONS,
    
    // Analytics
    Permission.VIEW_ANONYMIZED_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
  ],
  
  // DOCTOR - Patient care focused
  [UserRole.DOCTOR]: [
    // Patient Data
    Permission.VIEW_OWN_DATA,
    Permission.VIEW_PATIENT_DATA,
    Permission.MANAGE_OWN_DATA,
    
    // Documents
    Permission.UPLOAD_DOCUMENTS,
    Permission.VIEW_OWN_DOCUMENTS,
    Permission.DELETE_OWN_DOCUMENTS,
    
    // Chat
    Permission.USE_CHATBOT,
    Permission.VIEW_OWN_CONVERSATIONS,
    
    // Limited Infrastructure
    Permission.PROVISION_INSTANCES,
  ],
  
  // PATIENT - Own data only
  [UserRole.PATIENT]: [
    // Own Data Only
    Permission.VIEW_OWN_DATA,
    Permission.MANAGE_OWN_DATA,
    
    // Documents
    Permission.UPLOAD_DOCUMENTS,
    Permission.VIEW_OWN_DOCUMENTS,
    Permission.DELETE_OWN_DOCUMENTS,
    
    // Chat
    Permission.USE_CHATBOT,
    Permission.VIEW_OWN_CONVERSATIONS,
  ],
  
  // SUPPORT - Customer support access
  [UserRole.SUPPORT]: [
    // Limited User Access
    Permission.VIEW_ALL_USERS,
    
    // Limited Patient Data (with consent)
    Permission.VIEW_PATIENT_DATA,
    
    // Documents (view only)
    Permission.VIEW_ALL_DOCUMENTS,
    
    // Chat (view only)
    Permission.VIEW_ALL_CONVERSATIONS,
  ],
  
  // ANALYST - Anonymized data only
  [UserRole.ANALYST]: [
    // Analytics Only
    Permission.VIEW_ANONYMIZED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    
    // System Stats (no PII)
    Permission.VIEW_SYSTEM_STATS,
  ],
};

// ============================================================================
// RESOURCE TYPES
// ============================================================================

export enum ResourceType {
  USER = 'USER',
  PATIENT = 'PATIENT',
  DOCUMENT = 'DOCUMENT',
  CONVERSATION = 'CONVERSATION',
  TASK = 'TASK',
  INSTANCE = 'INSTANCE',
  COST = 'COST',
  FINANCIAL = 'FINANCIAL',
  SYSTEM = 'SYSTEM',
}

// ============================================================================
// ACCESS CONTROL CONTEXT
// ============================================================================

export interface AccessControlContext {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  resourceType?: ResourceType;
  resourceId?: string;
  resourceOwnerId?: string;
}

// ============================================================================
// ACCESS DECISION
// ============================================================================

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  requiredPermission?: Permission;
  requiredRole?: UserRole;
}

// ============================================================================
// AUDIT LOG ENTRY
// ============================================================================

export interface AccessAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: UserRole;
  action: string;
  resourceType: ResourceType;
  resourceId?: string;
  permission: Permission;
  allowed: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type RoleHierarchy = {
  [key in UserRole]: number;
};

export const ROLE_HIERARCHY: RoleHierarchy = {
  [UserRole.OWNER]: 100,
  [UserRole.ADMIN]: 80,
  [UserRole.DOCTOR]: 60,
  [UserRole.SUPPORT]: 40,
  [UserRole.ANALYST]: 30,
  [UserRole.PATIENT]: 20,
};

// ============================================================================
// PROTECTED ROUTES
// ============================================================================

export interface ProtectedRoute {
  path: string;
  requiredPermissions: Permission[];
  requiredRole?: UserRole;
  description: string;
}

export const PROTECTED_ROUTES: ProtectedRoute[] = [
  // Financial Routes (OWNER only)
  {
    path: '/dashboard/costs',
    requiredPermissions: [Permission.VIEW_COSTS],
    requiredRole: UserRole.OWNER,
    description: 'Cost dashboard - financial data',
  },
  {
    path: '/api/costs/*',
    requiredPermissions: [Permission.VIEW_COSTS],
    requiredRole: UserRole.OWNER,
    description: 'Cost API endpoints',
  },
  {
    path: '/dashboard/financials',
    requiredPermissions: [Permission.VIEW_FINANCIALS],
    requiredRole: UserRole.OWNER,
    description: 'Financial dashboard',
  },
  
  // Administrative Routes (OWNER/ADMIN)
  {
    path: '/dashboard/admin',
    requiredPermissions: [Permission.VIEW_SYSTEM_STATS],
    description: 'Admin dashboard',
  },
  {
    path: '/dashboard/users',
    requiredPermissions: [Permission.VIEW_ALL_USERS],
    description: 'User management',
  },
  {
    path: '/api/admin/*',
    requiredPermissions: [Permission.MANAGE_SYSTEM_CONFIG],
    description: 'Admin API endpoints',
  },
  
  // Instance Routes (OWNER/ADMIN)
  {
    path: '/dashboard/instances',
    requiredPermissions: [Permission.VIEW_ALL_INSTANCES],
    description: 'Instance management',
  },
  {
    path: '/api/instances/*',
    requiredPermissions: [Permission.PROVISION_INSTANCES],
    description: 'Instance API endpoints',
  },
  
  // Queue Routes (OWNER/ADMIN)
  {
    path: '/dashboard/queue',
    requiredPermissions: [Permission.VIEW_ALL_TASKS],
    description: 'Queue management',
  },
  {
    path: '/api/queue/*',
    requiredPermissions: [Permission.MANAGE_QUEUE],
    description: 'Queue API endpoints',
  },
];