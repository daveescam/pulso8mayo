import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { inventoryAlerts, inventoryItems, branches, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";

const updateAlertStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'VIEWED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']),
    notes: z.string().optional(),
});

/**
 * PATCH /api/inventory/alerts/history/[id]
 * Update alert status
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = updateAlertStatusSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.issues },
                { status: 400 }
            );
        }

        const { status, notes } = validated.data;

        // Build update data
        const updateData: any = {
            status,
            updatedAt: new Date(),
        };

        if (notes) {
            updateData.notes = notes;
        }

        if (status === 'VIEWED') {
            updateData.viewedAt = new Date();
        }

        if (status === 'RESOLVED' || status === 'DISMISSED') {
            updateData.resolvedAt = new Date();
            updateData.resolvedBy = session.user.id;
        }

        // Update alert
        const [updatedAlert] = await db.update(inventoryAlerts)
            .set(updateData)
            .where(eq(inventoryAlerts.id, id))
            .returning();

        if (!updatedAlert) {
            return NextResponse.json(
                { error: "Alert not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedAlert,
        });
    } catch (error) {
        console.error("Failed to update alert status:", error);
        return NextResponse.json(
            { error: "Failed to update alert status" },
            { status: 500 }
        );
    }
}
