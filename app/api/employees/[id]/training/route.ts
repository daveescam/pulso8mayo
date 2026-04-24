import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { employeeProfiles, employeeTraining } from "@/lib/db/schema";
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

        const trainings = await db
            .select()
            .from(employeeTraining)
            .where(
                and(
                    eq(employeeTraining.userId, employeeId),
                    eq(employeeTraining.companyId, companyId)
                )
            )
            .orderBy(desc(employeeTraining.startDate));

        return NextResponse.json({
            data: trainings,
            success: true
        });

    } catch (error) {
        console.error("Error fetching employee training:", error);
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

        const newTraining = await db.insert(employeeTraining).values({
            userId: employeeId,
            companyId: companyId,
            trainingName: body.trainingName,
            trainingType: body.trainingType || 'TRAINING',
            provider: body.provider || null,
            startDate: new Date(body.startDate || new Date()),
            endDate: body.endDate ? new Date(body.endDate) : null,
            completionDate: body.completionDate ? new Date(body.completionDate) : null,
            expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
            status: body.status || 'SCHEDULED',
            certificationNumber: body.certificationNumber || null,
            isMandatory: body.isMandatory !== undefined ? body.isMandatory : false,
            cost: body.cost ? Number(body.cost) : 0,
            notes: body.notes || null,
        }).returning();

        return NextResponse.json({
            data: newTraining[0],
            success: true
        });

    } catch (error) {
        console.error("Error creating employee training:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
