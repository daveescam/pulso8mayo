import { VacationManager } from "@/components/labor/vacation-manager"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function VacationsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user || !user.companyId) {
    redirect("/onboarding")
  }

  const canApprove = ["ADMIN", "GERENTE", "SUPER_ADMIN"].includes(user.role || "")

  return (
    <div className="space-y-6">
      <VacationManager
        companyId={user.companyId}
        branchId={(user as any).branchId || undefined}
        userId={user.id}
        canApprove={canApprove}
      />
    </div>
  )
}
