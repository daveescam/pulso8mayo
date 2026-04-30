import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { kpiService } from "@/lib/services/kpi-service";
import { users } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * GET /api/kpi/alerts
 * Get active KPI alerts
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's company and branch
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!user || !user.companyId) {
            return NextResponse.json({ error: "User not associated with a company" }, { status: 400 });
        }

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get("branchId");
    const effectiveBranchId = (branchId && branchId !== "all") ? branchId : (user.branchId || undefined);

    const alerts = await kpiService.getActiveAlerts(user.companyId, effectiveBranchId);

        return NextResponse.json({ alerts });
    } catch (error) {
        console.error("Error fetching KPI alerts:", error);
        return NextResponse.json({ error: "Failed to fetch KPI alerts" }, { status: 500 });
    }
}
