import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { employeeProfiles, employeeBenefits } from "@/lib/db/schema";
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

        const benefits = await db
            .select()
            .from(employeeBenefits)
            .where(
                and(
                    eq(employeeBenefits.userId, employeeId),
                    eq(employeeBenefits.companyId, companyId)
                )
            )
            .orderBy(desc(employeeBenefits.startDate));

        return NextResponse.json({
            data: benefits,
            success: true
        });

    } catch (error) {
        console.error("Error fetching employee benefits:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!["ADMIN", "GERENTE", "HR"].includes(session.user.role || "")) {
             return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
        }

        const employeeId = (await params).id;
        const body = await request.json();
        
        const companyId = session.user.companyId || body.companyId;

        if (!companyId) {
            return NextResponse.json({ error: "Company info missing" }, { status: 400 });
        }

    const newBenefit = await db.insert(employeeBenefits).values({
      userId: employeeId,
      companyId: companyId,
      benefitType: body.benefitType,
      provider: body.provider || null,
      policyNumber: body.policyNumber || null,
      coverageAmount: body.coverageAmount ? Number(body.coverageAmount) : null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      startDate: new Date(body.startDate || new Date()),
      endDate: body.endDate ? new Date(body.endDate) : null,
      employeeContribution: body.employeeContribution ? Number(body.employeeContribution) : 0,
      employerContribution: body.employerContribution ? Number(body.employerContribution) : 0,
      beneficiaries: body.beneficiaries || [],
      createdBy: session.user.id
    }).returning();

        return NextResponse.json({
            data: newBenefit[0],
            success: true
        });

    } catch (error) {
        console.error("Error creating employee benefit:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}