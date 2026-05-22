import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/rbac/permissions";

const MANAGEMENT_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR'];

export async function requireManagementRole() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const userRole = ((session.user as any).role || 'EMPLEADO') as UserRole;

  if (!MANAGEMENT_ROLES.includes(userRole)) {
    redirect("/dashboard/workflows");
  }

  return { session, userRole };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const userRole = ((session.user as any).role || 'EMPLEADO') as UserRole;

  if (!allowedRoles.includes(userRole)) {
    redirect("/dashboard/workflows");
  }

  return { session, userRole };
}
