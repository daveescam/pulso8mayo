import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ApiError } from "./api/error";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as schema from "./db/schema"; // Assuming company_users table exists or similar for linking user to company

// For now, we will simulate or get the organization based on the active session.
// In Better Auth, we might need a specific plugin or custom logic if organization plugin is not fully active.
// Assuming we store current companyId in cookies or select it from user's list.

export const TENANT_HEADER = "x-pulso-tenant-id";

export async function getCurrentTenant() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw ApiError.unauthorized();
    }

    // First, try to get tenant from header (for explicit tenant selection in the future)
    const headerTenantId = (await headers()).get(TENANT_HEADER);

    if (headerTenantId) {
        // TODO: Verify user has access to this tenant
        return {
            id: headerTenantId,
            userId: session.user.id
        };
    }

    // Fall back to user's default company
    const user = session.user;
    if (user.companyId) {
        return {
            id: user.companyId,
            userId: session.user.id
        };
    }

    // No tenant available
    return {
        id: null,
        userId: session.user.id,
        unassigned: true
    };
}

export async function requireTenant() {
  const tenant = await getCurrentTenant();
  if (!tenant?.id && !tenant?.unassigned) {
    throw ApiError.badRequest("Tenant header or selection is missing.");
  }
  return tenant;
}

/**
 * Get authenticated user with role information
 * Throws if not authenticated
 */
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw ApiError.unauthorized();
  }

  return {
    user: session.user as { id: string; role: string; companyId?: string | null; branchId?: string | null; email: string; name?: string },
    session: session.session,
  };
}
