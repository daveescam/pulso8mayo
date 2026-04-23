import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { kpiDefinitions, kpiHistory, branches } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/kpi
 * List KPI definitions
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");

        const kpis = await db.query.kpiDefinitions.findMany({
            where: branchId
                ? and(
                    eq(kpiDefinitions.companyId, session.user.companyId),
                    eq(kpiDefinitions.branchId, branchId)
                )
                : eq(kpiDefinitions.companyId, session.user.companyId),
            orderBy: desc(kpiDefinitions.createdAt)
        });

        return NextResponse.json({ kpis });

    } catch (error) {
        console.error("[KPI API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/kpi
 * Create a new KPI definition
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            name,
            description,
            formula,
            metricType,
            target,
            warningThreshold,
            criticalThreshold,
            thresholdType,
            frequency,
            unit,
            category,
            branchId
        } = body;

        // Validate required fields
        if (!name || !formula || !metricType) {
            return NextResponse.json({
                error: "Name, formula, and metric type are required"
            }, { status: 400 });
        }

        // Create KPI
        const [kpi] = await db.insert(kpiDefinitions).values({
            companyId: session.user.companyId,
            branchId: branchId || null,
            name,
            description: description || null,
            formula,
            metricType,
            target: target || null,
            warningThreshold: warningThreshold || null,
            criticalThreshold: criticalThreshold || null,
            thresholdType: thresholdType || "TARGET",
            frequency: frequency || "DAILY",
            unit: unit || "",
            decimalPlaces: 2,
            category: category || "OPERATIONS",
            active: true,
            isSystem: false,
            createdBy: session.user.id,
            updatedBy: session.user.id
        }).returning();

        return NextResponse.json({ success: true, kpi });

    } catch (error) {
        console.error("[KPI API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/kpi/:id
 * Update a KPI definition
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const kpiId = searchParams.get("id");

        if (!kpiId) {
            return NextResponse.json({ error: "KPI ID required" }, { status: 400 });
        }

        const body = await req.json();

        // Verify KPI belongs to user's company
        const existingKpi = await db.query.kpiDefinitions.findFirst({
            where: and(
                eq(kpiDefinitions.id, kpiId),
                eq(kpiDefinitions.companyId, session.user.companyId)
            )
        });

        if (!existingKpi) {
            return NextResponse.json({ error: "KPI not found" }, { status: 404 });
        }

        if (existingKpi.isSystem) {
            return NextResponse.json({ error: "System KPIs cannot be modified" }, { status: 403 });
        }

        // Update KPI
        const [updated] = await db.update(kpiDefinitions)
            .set({
                ...body,
                updatedBy: session.user.id,
                updatedAt: new Date()
            })
            .where(eq(kpiDefinitions.id, kpiId))
            .returning();

        return NextResponse.json({ success: true, kpi: updated });

    } catch (error) {
        console.error("[KPI API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/kpi/:id
 * Delete a KPI definition
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const kpiId = searchParams.get("id");

        if (!kpiId) {
            return NextResponse.json({ error: "KPI ID required" }, { status: 400 });
        }

        // Verify KPI belongs to user's company
        const existingKpi = await db.query.kpiDefinitions.findFirst({
            where: and(
                eq(kpiDefinitions.id, kpiId),
                eq(kpiDefinitions.companyId, session.user.companyId)
            )
        });

        if (!existingKpi) {
            return NextResponse.json({ error: "KPI not found" }, { status: 404 });
        }

        if (existingKpi.isSystem) {
            return NextResponse.json({ error: "System KPIs cannot be deleted" }, { status: 403 });
        }

        // Delete KPI
        await db.delete(kpiDefinitions).where(eq(kpiDefinitions.id, kpiId));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[KPI API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
