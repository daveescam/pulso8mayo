"use client";

import { useSession } from "./use-session";

interface Tenant {
  id: string | null;
  userId: string;
  companyId?: string | null;
  branchId?: string | null;
  unassigned?: boolean;
}

export function useTenant(): { tenant: Tenant | null; isLoading: boolean } {
  const { session, loading } = useSession();

  if (loading) {
    return { tenant: null, isLoading: true };
  }

  if (!session?.user) {
    return { tenant: null, isLoading: false };
  }

  const tenant: Tenant = {
    id: session.user.companyId || null,
    userId: session.user.id,
    companyId: session.user.companyId,
    branchId: session.user.branchId,
  };

  if (!tenant.id) {
    tenant.unassigned = true;
  }

  return { tenant, isLoading: false };
}
