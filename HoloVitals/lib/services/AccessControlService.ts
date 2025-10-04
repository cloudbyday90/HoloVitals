/**
 * Access Control Service
 * Handles role-based access control (RBAC) for HoloVitals
 */

import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  ResourceType,
  AccessControlContext,
  AccessDecision,
  AccessAuditLog,
} from '../types/rbac';
import { prisma } from '../prisma';

export class AccessControlService {
  private static instance: AccessControlService;

  private constructor() {}

  public static getInstance(): AccessControlService {
    if (!AccessControlService.instance) {
      AccessControlService.instance = new AccessControlService();
    }
    return AccessControlService.instance;
  }

  // ============================================================================
  // PERMISSION CHECKING
  // ============================================================================

  /**
   * Check if a user has a specific permission
   */
  public hasPermission(role: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if a user has any of the specified permissions
   */
  public hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Check if a user has all of the specified permissions
   */
  public hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Get all permissions for a role
   */
  public getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role];
  }

  // ============================================================================
  // ROLE CHECKING
  // ============================================================================

  /**
   * Check if a role has sufficient hierarchy level
   */
  public hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  }

  /**
   * Check if user is owner
   */
  public isOwner(role: UserRole): boolean {
    return role === UserRole.OWNER;
  }

  /**
   * Check if user is admin or higher
   */
  public isAdminOrHigher(role: UserRole): boolean {
    return this.hasRoleLevel(role, UserRole.ADMIN);
  }

  // ============================================================================
  // RESOURCE ACCESS CONTROL
  // ============================================================================

  /**
   * Check if user can access a specific resource
   */
  public async canAccessResource(
    context: AccessControlContext
  ): Promise<AccessDecision> {
    const { userId, role, permissions, resourceType, resourceId, resourceOwnerId } = context;

    // OWNER can access everything
    if (role === UserRole.OWNER) {
      return { allowed: true, reason: 'Owner has full access' };
    }

    // Check if user has required permissions
    const hasRequiredPermissions = permissions.every(permission =>
      this.hasPermission(role, permission)
    );

    if (!hasRequiredPermissions) {
      return {
        allowed: false,
        reason: 'Insufficient permissions',
        requiredPermission: permissions[0],
      };
    }

    // Resource-specific access control
    if (resourceType && resourceId) {
      // Check if user owns the resource
      if (resourceOwnerId && resourceOwnerId === userId) {
        return { allowed: true, reason: 'User owns the resource' };
      }

      // Check resource-specific permissions
      switch (resourceType) {
        case ResourceType.CUSTOMER:
          return this.canAccessPatientData(role, userId, resourceId);
        
        case ResourceType.DOCUMENT:
          return this.canAccessDocument(role, userId, resourceId);
        
        case ResourceType.CONVERSATION:
          return this.canAccessConversation(role, userId, resourceId);
        
        case ResourceType.COST:
        case ResourceType.FINANCIAL:
          return this.canAccessFinancialData(role);
        
        case ResourceType.INSTANCE:
          return this.canAccessInstance(role, userId, resourceId);
        
        default:
          return { allowed: true };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if user can access customer data
   */
  private async canAccessPatientData(
    role: UserRole,
    userId: string,
    customerId: string
  ): Promise<AccessDecision> {
    // OWNER and ADMIN can access all customer data
    if (this.isAdminOrHigher(role)) {
      return { allowed: true, reason: 'Admin access to customer data' };
    }

    // CUSTOMER can only access their own data
    if (role === UserRole.CUSTOMER) {
      if (userId === customerId) {
        return { allowed: true, reason: 'User accessing own data' };
      }
      return {
        allowed: false,
        reason: 'Customers can only access their own data',
      };
    }

    // DOCTOR needs consent to access customer data
    if (role === UserRole.DOCTOR) {
      const hasConsent = await this.checkPatientConsent(userId, customerId);
      if (hasConsent) {
        return { allowed: true, reason: 'Doctor has customer consent' };
      }
      return {
        allowed: false,
        reason: 'Doctor requires customer consent',
      };
    }

    // SUPPORT can view with proper permissions
    if (role === UserRole.SUPPORT) {
      return { allowed: true, reason: 'Support access for assistance' };
    }

    return { allowed: false, reason: 'Insufficient role for customer data access' };
  }

  /**
   * Check if user can access document
   */
  private async canAccessDocument(
    role: UserRole,
    userId: string,
    documentId: string
  ): Promise<AccessDecision> {
    // OWNER and ADMIN can access all documents
    if (this.isAdminOrHigher(role)) {
      return { allowed: true, reason: 'Admin access to documents' };
    }

    // Check if user owns the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { userId: true },
    });

    if (!document) {
      return { allowed: false, reason: 'Document not found' };
    }

    if (document.userId === userId) {
      return { allowed: true, reason: 'User owns the document' };
    }

    // SUPPORT can view documents
    if (role === UserRole.SUPPORT) {
      return { allowed: true, reason: 'Support access to documents' };
    }

    return { allowed: false, reason: 'User does not own this document' };
  }

  /**
   * Check if user can access conversation
   */
  private async canAccessConversation(
    role: UserRole,
    userId: string,
    conversationId: string
  ): Promise<AccessDecision> {
    // OWNER and ADMIN can access all conversations
    if (this.isAdminOrHigher(role)) {
      return { allowed: true, reason: 'Admin access to conversations' };
    }

    // Check if user owns the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!conversation) {
      return { allowed: false, reason: 'Conversation not found' };
    }

    if (conversation.userId === userId) {
      return { allowed: true, reason: 'User owns the conversation' };
    }

    return { allowed: false, reason: 'User does not own this conversation' };
  }

  /**
   * Check if user can access financial data
   */
  private canAccessFinancialData(role: UserRole): AccessDecision {
    // Only OWNER can access financial data
    if (role === UserRole.OWNER) {
      return { allowed: true, reason: 'Owner access to financial data' };
    }

    return {
      allowed: false,
      reason: 'Only owner can access financial data',
      requiredRole: UserRole.OWNER,
    };
  }

  /**
   * Check if user can access instance
   */
  private async canAccessInstance(
    role: UserRole,
    userId: string,
    instanceId: string
  ): Promise<AccessDecision> {
    // OWNER and ADMIN can access all instances
    if (this.isAdminOrHigher(role)) {
      return { allowed: true, reason: 'Admin access to instances' };
    }

    // Check if user owns the instance
    const instance = await prisma.cloudInstance.findUnique({
      where: { id: instanceId },
      select: { userId: true },
    });

    if (!instance) {
      return { allowed: false, reason: 'Instance not found' };
    }

    if (instance.userId === userId) {
      return { allowed: true, reason: 'User owns the instance' };
    }

    return { allowed: false, reason: 'User does not own this instance' };
  }

  /**
   * Check customer consent for doctor access
   */
  private async checkPatientConsent(
    doctorId: string,
    customerId: string
  ): Promise<boolean> {
    const consent = await prisma.consentGrant.findFirst({
      where: {
        customerId,
        grantedToUserId: doctorId,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return !!consent;
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  /**
   * Log access attempt
   */
  public async logAccess(
    context: AccessControlContext,
    action: string,
    decision: AccessDecision,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      await prisma.accessLog.create({
        data: {
          userId: context.userId,
          action,
          resourceType: context.resourceType || 'UNKNOWN',
          resourceId: context.resourceId,
          allowed: decision.allowed,
          reason: decision.reason,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log access:', error);
    }
  }

  /**
   * Get access logs for a user
   */
  public async getUserAccessLogs(
    userId: string,
    limit: number = 100
  ): Promise<AccessAuditLog[]> {
    const logs = await prisma.accessLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userRole: UserRole.CUSTOMER, // Would need to fetch from user
      action: log.action,
      resourceType: log.resourceType as ResourceType,
      resourceId: log.resourceId || undefined,
      permission: Permission.VIEW_OWN_DATA, // Would need to determine from action
      allowed: log.allowed,
      reason: log.reason || undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
    }));
  }

  /**
   * Get suspicious access patterns
   */
  public async getSuspiciousAccess(
    timeWindowMinutes: number = 60
  ): Promise<AccessAuditLog[]> {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    // Find users with many failed access attempts
    const suspiciousLogs = await prisma.accessLog.findMany({
      where: {
        timestamp: { gte: since },
        allowed: false,
      },
      orderBy: { timestamp: 'desc' },
    });

    // Group by user and count failures
    const userFailures = new Map<string, number>();
    suspiciousLogs.forEach(log => {
      const count = userFailures.get(log.userId) || 0;
      userFailures.set(log.userId, count + 1);
    });

    // Return logs for users with >5 failures
    const suspiciousUserIds = Array.from(userFailures.entries())
      .filter(([_, count]) => count > 5)
      .map(([userId]) => userId);

    const logs = await prisma.accessLog.findMany({
      where: {
        userId: { in: suspiciousUserIds },
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userRole: UserRole.CUSTOMER,
      action: log.action,
      resourceType: log.resourceType as ResourceType,
      resourceId: log.resourceId || undefined,
      permission: Permission.VIEW_OWN_DATA,
      allowed: log.allowed,
      reason: log.reason || undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
    }));
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get user role from database
   */
  public async getUserRole(userId: string): Promise<UserRole | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role as UserRole | null;
  }

  /**
   * Update user role
   */
  public async updateUserRole(
    userId: string,
    newRole: UserRole,
    updatedBy: string
  ): Promise<void> {
    // Only OWNER can change roles
    const updaterRole = await this.getUserRole(updatedBy);
    if (updaterRole !== UserRole.OWNER) {
      throw new Error('Only owner can change user roles');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // Log the role change
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: 'ROLE_CHANGE',
        resourceType: 'USER',
        resourceId: userId,
        details: { newRole },
        timestamp: new Date(),
      },
    });
  }

  /**
   * Check if route is protected
   */
  public isProtectedRoute(path: string): boolean {
    const protectedPaths = [
      '/dashboard/costs',
      '/dashboard/financials',
      '/dashboard/admin',
      '/dashboard/users',
      '/api/costs',
      '/api/admin',
      '/api/financials',
    ];

    return protectedPaths.some(protectedPath =>
      path.startsWith(protectedPath)
    );
  }

  /**
   * Get required permissions for a route
   */
  public getRoutePermissions(path: string): Permission[] {
    if (path.startsWith('/dashboard/costs') || path.startsWith('/api/costs')) {
      return [Permission.VIEW_COSTS];
    }
    if (path.startsWith('/dashboard/financials') || path.startsWith('/api/financials')) {
      return [Permission.VIEW_FINANCIALS];
    }
    if (path.startsWith('/dashboard/admin') || path.startsWith('/api/admin')) {
      return [Permission.VIEW_SYSTEM_STATS];
    }
    if (path.startsWith('/dashboard/users')) {
      return [Permission.VIEW_ALL_USERS];
    }
    if (path.startsWith('/dashboard/instances') || path.startsWith('/api/instances')) {
      return [Permission.VIEW_ALL_INSTANCES];
    }
    if (path.startsWith('/dashboard/queue') || path.startsWith('/api/queue')) {
      return [Permission.VIEW_ALL_TASKS];
    }

    return [];
  }
}

// Export singleton instance
export const accessControl = AccessControlService.getInstance();