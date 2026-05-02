import type { Role } from "./permissions";

const BRANCH_SCOPED_ROLES: Role[] = ["GERENTE", "SUPERVISOR"];

export function isBranchScopedRole(role: Role): boolean {
  return BRANCH_SCOPED_ROLES.includes(role);
}

export function canAccessAllBranches(role: Role): boolean {
  return !BRANCH_SCOPED_ROLES.includes(role);
}

export function enforceBranchScope(
  userRole: Role,
  userBranchId: string | null | undefined,
  requestedBranchId?: string | null
): string | null {
  if (!isBranchScopedRole(userRole)) {
    return requestedBranchId || null;
  }

  return userBranchId || null;
}

export function getAccessibleBranchIds(
  userRole: Role,
  userBranchId: string | null | undefined,
  allBranchIds: string[]
): string[] {
  if (!isBranchScopedRole(userRole)) {
    return allBranchIds;
  }

  if (userBranchId && allBranchIds.includes(userBranchId)) {
    return [userBranchId];
  }

  return userBranchId ? [userBranchId] : [];
}
