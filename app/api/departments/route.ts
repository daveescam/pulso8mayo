import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { employeeProfiles, users } from "@/lib/db/schema";
import { requireTenant } from "@/lib/tenant-context";
import { eq, and, isNotNull, sql } from "drizzle-orm";

/**
 * GET /api/departments
 * Returns a list of distinct departments used in the company's employee profiles
 */
export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        if (!tenant.id) {
            return NextResponse.json({ departments: [] });
        }

        const departmentsResult = await db
            .select({
                name: employeeProfiles.department
            })
            .from(employeeProfiles)
            .innerJoin(users, eq(employeeProfiles.userId, users.id))
            .where(
                and(
                    eq(users.companyId, tenant.id),
                    isNotNull(employeeProfiles.department)
                )
            )
            .groupBy(employeeProfiles.department);

        const departments = departmentsResult
            .map(d => d.name)
            .filter(Boolean)
            .sort();

        return NextResponse.json({ 
            departments: departments.map(name => ({ id: name, name }))
        });
    } catch (error) {
        console.error("Error fetching departments:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
