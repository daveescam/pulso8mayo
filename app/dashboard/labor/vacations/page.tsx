"use client";

import { VacationManager } from "@/components/labor/vacation-manager"
import { useRequireRole } from "@/hooks/use-session"

export default function VacationsPage() {
  const { loading, session } = useRequireRole(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR'])

  if (loading) {
    return null
  }

  const userId = session?.user?.id
  const companyId = session?.user?.companyId
  const userRole = session?.user?.role

  if (!userId || !companyId) {
    return null
  }

  const canApprove = ["ADMIN", "GERENTE", "SUPER_ADMIN"].includes(userRole || "")

  return (
    <div className="space-y-6">
      <VacationManager
        companyId={companyId}
        branchId={session?.user?.branchId}
        userId={userId}
        canApprove={canApprove}
      />
    </div>
  )
}
