import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, employeeProfiles } from "@/lib/db/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import { requireTenant } from "@/lib/tenant-context";

/**
 * POST /api/communications/recipients/count
 * Calculates the number of employees that match the given targeting criteria
 */
export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        if (!tenant.id) {
            return NextResponse.json({ count: 0 });
        }

        const body = await req.json();
        const { targetType, targetIds, targetRoles } = body;

        const conditions = [
            eq(users.companyId, tenant.id),
            isNull(users.deletedAt)
        ];

        // Role filtering
        if (targetRoles && targetRoles.length > 0) {
            conditions.push(inArray(users.role, targetRoles));
        }

        // Branch filtering
        if (targetType === 'BRANCH' && targetIds && targetIds.length > 0) {
            conditions.push(inArray(users.branchId, targetIds));
        }

        // Individual targeting
        if (targetType === 'INDIVIDUAL' && targetIds && targetIds.length > 0) {
            conditions.push(inArray(users.id, targetIds));
        }

        let query = db.select({ count: sql<number>`count(*)::int` }).from(users);

        // Department filtering requires join
        if (targetType === 'DEPARTMENT' && targetIds && targetIds.length > 0) {
            // @ts-ignore
            query = query.leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId));
            conditions.push(inArray(employeeProfiles.department, targetIds));
        }

        const [{ count }] = await query.where(and(...conditions));

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error counting recipients:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
