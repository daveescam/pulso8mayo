import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { employeeProfiles, employeeContracts } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const employeeId = (await params).id;
        const { searchParams } = new URL(request.url);
        const companyIdParam = searchParams.get("companyId");
        
        const companyId = session.user.companyId || companyIdParam;

        if (!companyId) {
             return NextResponse.json({ error: "Company info missing" }, { status: 400 });
        }

        if (session.user.role === "EMPLEADO" && session.user.id !== employeeId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (["SUPERVISOR", "GERENTE"].includes(session.user.role || "")) {
            const employee = await db.query.employeeProfiles.findFirst({
                where: eq(employeeProfiles.userId, employeeId)
            });

            if (!employee) {
                return NextResponse.json({ error: "Employee not found" }, { status: 404 });
            }
        }

        const contracts = await db
            .select()
            .from(employeeContracts)
            .where(
                and(
                    eq(employeeContracts.userId, employeeId),
                    eq(employeeContracts.companyId, companyId)
                )
            )
            .orderBy(desc(employeeContracts.startDate));

        return NextResponse.json({
            data: contracts,
            success: true
        });

    } catch (error) {
        console.error("Error fetching employee contracts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}