/**
 * Employee Record Management - Field-Level Permissions
 * Defines which roles can view/edit specific employee data fields
 */

export type PermissionAction = 'view' | 'edit' | 'delete' | 'export';
export type PermissionEntity = 
  | 'profile' 
  | 'salary' 
  | 'contracts' 
  | 'documents' 
  | 'performance' 
  | 'audit'
  | 'leave'
  | 'benefits'
  | 'training'
  | 'communications';

export type PermissionScope = 'own' | 'team' | 'branch' | 'company' | 'all';

export interface PermissionRule {
  entity: PermissionEntity;
  action: PermissionAction;
  scope: PermissionScope;
  conditions?: Record<string, any>;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'SUPERVISOR' | 'EMPLEADO' | 'READONLY' | 'HR';

// Permission matrix defining what each role can do
export const ROLE_PERMISSIONS: Record<UserRole, PermissionRule[]> = {
  SUPER_ADMIN: [
    // Full access to everything
    { entity: 'profile', action: 'view', scope: 'all' },
    { entity: 'profile', action: 'edit', scope: 'all' },
    { entity: 'profile', action: 'delete', scope: 'all' },
    { entity: 'profile', action: 'export', scope: 'all' },
    { entity: 'salary', action: 'view', scope: 'all' },
    { entity: 'salary', action: 'edit', scope: 'all' },
    { entity: 'contracts', action: 'view', scope: 'all' },
    { entity: 'contracts', action: 'edit', scope: 'all' },
    { entity: 'contracts', action: 'delete', scope: 'all' },
    { entity: 'documents', action: 'view', scope: 'all' },
    { entity: 'documents', action: 'edit', scope: 'all' },
    { entity: 'documents', action: 'delete', scope: 'all' },
    { entity: 'documents', action: 'export', scope: 'all' },
    { entity: 'performance', action: 'view', scope: 'all' },
    { entity: 'performance', action: 'edit', scope: 'all' },
    { entity: 'performance', action: 'delete', scope: 'all' },
    { entity: 'audit', action: 'view', scope: 'all' },
    { entity: 'audit', action: 'export', scope: 'all' },
    { entity: 'leave', action: 'view', scope: 'all' },
    { entity: 'leave', action: 'edit', scope: 'all' },
    { entity: 'leave', action: 'delete', scope: 'all' },
    { entity: 'benefits', action: 'view', scope: 'all' },
    { entity: 'benefits', action: 'edit', scope: 'all' },
    { entity: 'training', action: 'view', scope: 'all' },
    { entity: 'training', action: 'edit', scope: 'all' },
    { entity: 'communications', action: 'view', scope: 'all' },
    { entity: 'communications', action: 'edit', scope: 'all' },
    { entity: 'communications', action: 'delete', scope: 'all' },
  ],

  ADMIN: [
    // Company-wide access, no deletion
    { entity: 'profile', action: 'view', scope: 'company' },
    { entity: 'profile', action: 'edit', scope: 'company' },
    { entity: 'profile', action: 'export', scope: 'company' },
    { entity: 'salary', action: 'view', scope: 'company' },
    { entity: 'salary', action: 'edit', scope: 'company' },
    { entity: 'contracts', action: 'view', scope: 'company' },
    { entity: 'contracts', action: 'edit', scope: 'company' },
    { entity: 'documents', action: 'view', scope: 'company' },
    { entity: 'documents', action: 'edit', scope: 'company' },
    { entity: 'documents', action: 'export', scope: 'company' },
    { entity: 'performance', action: 'view', scope: 'company' },
    { entity: 'performance', action: 'edit', scope: 'company' },
    { entity: 'audit', action: 'view', scope: 'company' },
    { entity: 'audit', action: 'export', scope: 'company' },
    { entity: 'leave', action: 'view', scope: 'company' },
    { entity: 'leave', action: 'edit', scope: 'company' },
    { entity: 'leave', action: 'delete', scope: 'company' },
    { entity: 'benefits', action: 'view', scope: 'company' },
    { entity: 'benefits', action: 'edit', scope: 'company' },
    { entity: 'training', action: 'view', scope: 'company' },
    { entity: 'training', action: 'edit', scope: 'company' },
    { entity: 'communications', action: 'view', scope: 'company' },
    { entity: 'communications', action: 'edit', scope: 'company' },
  ],

  HR: [
    // HR-specific permissions (similar to ADMIN but focused on HR tasks)
    { entity: 'profile', action: 'view', scope: 'company' },
    { entity: 'profile', action: 'edit', scope: 'company' },
    { entity: 'profile', action: 'export', scope: 'company' },
    { entity: 'salary', action: 'view', scope: 'company' },
    { entity: 'salary', action: 'edit', scope: 'company' },
    { entity: 'contracts', action: 'view', scope: 'company' },
    { entity: 'contracts', action: 'edit', scope: 'company' },
    { entity: 'documents', action: 'view', scope: 'company' },
    { entity: 'documents', action: 'edit', scope: 'company' },
    { entity: 'documents', action: 'export', scope: 'company' },
    { entity: 'performance', action: 'view', scope: 'company' },
    { entity: 'performance', action: 'edit', scope: 'company' },
    { entity: 'audit', action: 'view', scope: 'company' },
    { entity: 'leave', action: 'view', scope: 'company' },
    { entity: 'leave', action: 'edit', scope: 'company' },
    { entity: 'leave', action: 'delete', scope: 'company' },
    { entity: 'benefits', action: 'view', scope: 'company' },
    { entity: 'benefits', action: 'edit', scope: 'company' },
    { entity: 'training', action: 'view', scope: 'company' },
    { entity: 'training', action: 'edit', scope: 'company' },
    { entity: 'communications', action: 'view', scope: 'company' },
    { entity: 'communications', action: 'edit', scope: 'company' },
  ],

  GERENTE: [
    // Branch management
    { entity: 'profile', action: 'view', scope: 'branch' },
    { entity: 'profile', action: 'edit', scope: 'branch' },
    { entity: 'profile', action: 'export', scope: 'branch' },
    { entity: 'salary', action: 'view', scope: 'branch' },
    { entity: 'salary', action: 'edit', scope: 'branch' },
    { entity: 'contracts', action: 'view', scope: 'branch' },
    { entity: 'contracts', action: 'edit', scope: 'branch' },
    { entity: 'documents', action: 'view', scope: 'branch' },
    { entity: 'documents', action: 'edit', scope: 'branch' },
    { entity: 'documents', action: 'export', scope: 'branch' },
    { entity: 'performance', action: 'view', scope: 'branch' },
    { entity: 'performance', action: 'edit', scope: 'branch' },
    { entity: 'audit', action: 'view', scope: 'branch' },
    { entity: 'leave', action: 'view', scope: 'branch' },
    { entity: 'leave', action: 'edit', scope: 'branch' },
    { entity: 'benefits', action: 'view', scope: 'branch' },
    { entity: 'training', action: 'view', scope: 'branch' },
    { entity: 'communications', action: 'view', scope: 'branch' },
    { entity: 'communications', action: 'edit', scope: 'branch' },
  ],

  SUPERVISOR: [
    // Team-level view and limited edit
    { entity: 'profile', action: 'view', scope: 'team' },
    { entity: 'profile', action: 'export', scope: 'team' },
    { entity: 'salary', action: 'view', scope: 'team' },
    { entity: 'contracts', action: 'view', scope: 'team' },
    { entity: 'documents', action: 'view', scope: 'team' },
    { entity: 'documents', action: 'export', scope: 'team' },
    { entity: 'performance', action: 'view', scope: 'team' },
    { entity: 'performance', action: 'edit', scope: 'team', conditions: { reviewType: 'MANAGER' } },
    { entity: 'audit', action: 'view', scope: 'team' },
    { entity: 'leave', action: 'view', scope: 'team' },
    { entity: 'leave', action: 'edit', scope: 'team', conditions: { action: 'approve' } },
    { entity: 'training', action: 'view', scope: 'team' },
    { entity: 'communications', action: 'view', scope: 'team' },
    { entity: 'communications', action: 'edit', scope: 'team' },
  ],

  EMPLEADO: [
    // Own data only
    { entity: 'profile', action: 'view', scope: 'own' },
    { entity: 'profile', action: 'edit', scope: 'own', conditions: { 
      fields: ['personalEmail', 'personalPhone', 'address', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactEmail'] 
    }},
    { entity: 'salary', action: 'view', scope: 'own' },
    { entity: 'contracts', action: 'view', scope: 'own' },
    { entity: 'documents', action: 'view', scope: 'own' },
    { entity: 'documents', action: 'edit', scope: 'own' },
    { entity: 'documents', action: 'export', scope: 'own' },
    { entity: 'performance', action: 'view', scope: 'own' },
    { entity: 'performance', action: 'edit', scope: 'own', conditions: { reviewType: 'SELF' } },
    { entity: 'leave', action: 'view', scope: 'own' },
    { entity: 'leave', action: 'edit', scope: 'own', conditions: { action: 'create' } },
    { entity: 'benefits', action: 'view', scope: 'own' },
    { entity: 'training', action: 'view', scope: 'own' },
    { entity: 'communications', action: 'view', scope: 'own' },
  ],

  READONLY: [
    // View-only access to company data
    { entity: 'profile', action: 'view', scope: 'company' },
    { entity: 'documents', action: 'view', scope: 'company' },
    { entity: 'performance', action: 'view', scope: 'company' },
    { entity: 'audit', action: 'view', scope: 'company' },
    { entity: 'leave', action: 'view', scope: 'company' },
    { entity: 'training', action: 'view', scope: 'company' },
    { entity: 'communications', action: 'view', scope: 'company' },
  ],
};

/**
 * Check if a user role has permission to perform an action on an entity
 */
export function hasPermission(
  userRole: UserRole,
  entity: PermissionEntity,
  action: PermissionAction,
  scope: PermissionScope,
  conditions?: Record<string, any>
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions) {
    return false;
  }

  return permissions.some(permission => {
    // Check entity match
    if (permission.entity !== entity) return false;
    
    // Check action match
    if (permission.action !== action) return false;
    
    // Check scope compatibility
    const scopeHierarchy: Record<PermissionScope, number> = {
      'own': 1,
      'team': 2,
      'branch': 3,
      'company': 4,
      'all': 5,
    };
    
    // User's permission scope must be >= requested scope
    if (scopeHierarchy[permission.scope] < scopeHierarchy[scope]) {
      return false;
    }
    
    // Check additional conditions if specified
    if (permission.conditions && conditions) {
      return Object.entries(permission.conditions).every(([key, value]) => {
        return conditions[key] === value;
      });
    }
    
    return true;
  });
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: UserRole): PermissionRule[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Get allowed fields for editing based on role
 */
export function getAllowedEditFields(userRole: UserRole): string[] {
  if (userRole === 'EMPLEADO') {
    return ['personalEmail', 'personalPhone', 'address', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactEmail'];
  }
  
  // Admin, HR, Gerente can edit most fields
  if (['ADMIN', 'HR', 'GERENTE', 'SUPER_ADMIN'].includes(userRole)) {
    return ['*']; // All fields
  }
  
  return [];
}

/**
 * Check if a field is sensitive (requires special permissions)
 */
export function isSensitiveField(fieldName: string): boolean {
  const sensitiveFields = [
    'salary',
    'dailySalary',
    'weeklySalary',
    'monthlySalary',
    'bankName',
    'clabe',
    'cardNumber',
    'rfc',
    'curp',
    'nss',
  ];
  
  return sensitiveFields.includes(fieldName);
}

/**
 * Mask sensitive field values for unauthorized users
 */
export function maskSensitiveFields(data: Record<string, any>, allowedFields: string[]): Record<string, any> {
  const masked = { ...data };
  
  Object.keys(masked).forEach(key => {
    if (isSensitiveField(key) && !allowedFields.includes(key) && !allowedFields.includes('*')) {
      masked[key] = '••••••••';
    }
  });
  
  return masked;
}
