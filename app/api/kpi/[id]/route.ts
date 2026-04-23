import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { kpiService } from "@/lib/services/kpi-service";
import { users } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * GET /api/kpi/[id]
 * Get a specific KPI by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get user's company
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!user || !user.companyId) {
            return NextResponse.json({ error: "User not associated with a company" }, { status: 400 });
        }

        const kpi = await kpiService.getKpiById(id, user.companyId);
        
        if (!kpi) {
            return NextResponse.json({ error: "KPI not found" }, { status: 404 });
        }

        return NextResponse.json({ kpi });
    } catch (error) {
        console.error("Error fetching KPI:", error);
        return NextResponse.json({ error: "Failed to fetch KPI" }, { status: 500 });
    }
}

/**
 * PUT /api/kpi/[id]
 * Update a KPI
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const updatedKpi = await kpiService.updateKpi({
            id,
            ...body,
            updatedBy: session.user.id,
        });

        return NextResponse.json({ kpi: updatedKpi });
    } catch (error: any) {
        console.error("Error updating KPI:", error);
        return NextResponse.json({ error: error.message || "Failed to update KPI" }, { status: 500 });
    }
}

/**
 * DELETE /api/kpi/[id]
 * Delete a KPI
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get user's company
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!user || !user.companyId) {
            return NextResponse.json({ error: "User not associated with a company" }, { status: 400 });
        }

        await kpiService.deleteKpi(id, user.companyId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting KPI:", error);
        return NextResponse.json({ error: error.message || "Failed to delete KPI" }, { status: 500 });
    }
}
