import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { kpiService } from "@/lib/services/kpi-service";
import { users } from "@/lib/db/schema";
import { db } from "@/lib/db/db";
import { eq } from "drizzle-orm";

/**
 * POST /api/kpi/alerts/[id]/acknowledge
 * Acknowledge a KPI alert
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const updatedAlert = await kpiService.acknowledgeAlert(id, session.user.id);

        return NextResponse.json({ alert: updatedAlert });
    } catch (error: any) {
        console.error("Error acknowledging alert:", error);
        return NextResponse.json({ error: error.message || "Failed to acknowledge alert" }, { status: 500 });
    }
}

/**
 * POST /api/kpi/alerts/[id]/resolve
 * Resolve a KPI alert
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
        const { resolutionNotes } = body;

        const updatedAlert = await kpiService.resolveAlert(id, session.user.id, resolutionNotes || "");

        return NextResponse.json({ alert: updatedAlert });
    } catch (error: any) {
        console.error("Error resolving alert:", error);
        return NextResponse.json({ error: error.message || "Failed to resolve alert" }, { status: 500 });
    }
}
