/**
 * Role-based access control configuration
 * Defines which roles can access which routes
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'SUPERVISOR' | 'EMPLEADO' | 'READONLY';

export interface RoutePermission {
    path: string;
    allowedRoles: UserRole[];
    description?: string;
}

/**
 * Route permissions configuration
 * More specific paths should come first
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
    // Super Admin only routes (e.g. billing, global settings if needed)
    {
        path: '/dashboard/billing',
        allowedRoles: ['SUPER_ADMIN'],
        description: 'Billing and subscription management'
    },

    // Company Management - Admin only
    {
        path: '/dashboard/company',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Company settings, branches, and organization management'
    },

    // Team Management - Admin and Gerente
    {
        path: '/dashboard/team',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE'],
        description: 'User management and team settings'
    },

  // Analytics - Admin, Gerente, Supervisor, ReadOnly
  {
    path: '/dashboard/analytics',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'READONLY'],
    description: 'Analytics and reports'
  },

  // Branch Performance - Admin, Gerente, Supervisor, ReadOnly
  {
    path: '/dashboard/branches',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'READONLY'],
    description: 'Branch performance comparison and ranking'
  },

    // Workflow Builder - Admin and Gerente
    {
        path: '/dashboard/builder',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE'],
        description: 'Workflow template builder'
    },

    // Schedules - Admin, Gerente, Supervisor
    {
        path: '/dashboard/schedules',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR'],
        description: 'Schedule management'
    },

    // Incidents - All roles except ReadOnly (but filtered by branch)
    {
        path: '/dashboard/incidents',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'EMPLEADO'],
        description: 'Incident management'
    },

    // Workflows - All roles except ReadOnly
    {
        path: '/dashboard/workflows',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'EMPLEADO'],
        description: 'Execute and view workflows'
    },

    // Labor/Shifts - All roles except ReadOnly (employees can clock in/out)
    {
        path: '/dashboard/labor',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'EMPLEADO'],
        description: 'Time tracking and labor management'
    },

    // Profile - All roles
    {
        path: '/dashboard/profile',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'EMPLEADO', 'READONLY'],
        description: 'User profile settings'
    },

    // Dashboard home - All roles
    {
        path: '/dashboard',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'EMPLEADO', 'READONLY'],
        description: 'Main dashboard'
    }
];

/**
 * Check if a user role has access to a specific path
 */
export function hasAccess(userRole: UserRole, path: string): boolean {
    // Find the most specific matching route
    const matchingRoute = ROUTE_PERMISSIONS.find(route =>
        path.startsWith(route.path)
    );

    if (!matchingRoute) {
        // Default: deny access if no route matches
        console.warn(`[RBAC] No permission defined for path: ${path}`);
        return false;
    }

    return matchingRoute.allowedRoles.includes(userRole);
}

/**
 * Get the redirect path for a user based on their role
 */
export function getDefaultDashboard(userRole: UserRole): string {
    switch (userRole) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
        case 'GERENTE':
        case 'SUPERVISOR':
            return '/dashboard';
        case 'EMPLEADO':
            return '/dashboard/workflows';
        case 'READONLY':
            return '/dashboard/analytics';
        default:
            return '/dashboard';
    }
}

/**
 * Get accessible routes for a specific role
 */
export function getAccessibleRoutes(userRole: UserRole): RoutePermission[] {
    return ROUTE_PERMISSIONS.filter(route =>
        route.allowedRoles.includes(userRole)
    );
}
