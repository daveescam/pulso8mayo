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
 * GET /api/inventory/alerts/history
 * Get alert history with filtering
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const branchId = searchParams.get("branchId");
        const severity = searchParams.get("severity");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const limit = parseInt(searchParams.get("limit") || "100");

        // Build conditions
        const conditions = [
            eq(inventoryAlerts.companyId, session.user.companyId)
        ];

        if (status) {
            conditions.push(eq(inventoryAlerts.status, status as any));
        }

        if (type) {
            conditions.push(eq(inventoryAlerts.type, type as any));
        }

        if (branchId) {
            conditions.push(eq(inventoryAlerts.branchId, branchId));
        }

        if (severity) {
            conditions.push(eq(inventoryAlerts.severity, severity));
        }

        if (dateFrom) {
            conditions.push(gte(inventoryAlerts.detectedAt, new Date(dateFrom)));
        }

        if (dateTo) {
            conditions.push(lte(inventoryAlerts.detectedAt, new Date(dateTo)));
        }

        // Fetch alerts with related data
        const alerts = await db.select({
            id: inventoryAlerts.id,
            type: inventoryAlerts.type,
            severity: inventoryAlerts.severity,
            status: inventoryAlerts.status,
            currentStock: inventoryAlerts.currentStock,
            minLevel: inventoryAlerts.minLevel,
            detectedAt: inventoryAlerts.detectedAt,
            viewedAt: inventoryAlerts.viewedAt,
            resolvedAt: inventoryAlerts.resolvedAt,
            resolvedBy: inventoryAlerts.resolvedBy,
            notes: inventoryAlerts.notes,
            itemName: inventoryItems.name,
            itemSku: inventoryItems.sku,
            branchName: branches.name,
            resolvedByName: users.name,
        })
            .from(inventoryAlerts)
            .leftJoin(inventoryItems, eq(inventoryAlerts.itemId, inventoryItems.id))
            .leftJoin(branches, eq(inventoryAlerts.branchId, branches.id))
            .leftJoin(users, eq(inventoryAlerts.resolvedBy, users.id))
            .where(and(...conditions))
            .orderBy(desc(inventoryAlerts.detectedAt))
            .limit(limit);

        // Get summary statistics
        const summary = await db.select({
            total: sql<number>`COUNT(*)`,
            active: sql<number>`COUNT(*) FILTER (WHERE ${inventoryAlerts.status} = 'ACTIVE')`,
            viewed: sql<number>`COUNT(*) FILTER (WHERE ${inventoryAlerts.status} = 'VIEWED')`,
            inProgress: sql<number>`COUNT(*) FILTER (WHERE ${inventoryAlerts.status} = 'IN_PROGRESS')`,
            resolved: sql<number>`COUNT(*) FILTER (WHERE ${inventoryAlerts.status} = 'RESOLVED')`,
            dismissed: sql<number>`COUNT(*) FILTER (WHERE ${inventoryAlerts.status} = 'DISMISSED')`,
        })
            .from(inventoryAlerts)
            .where(eq(inventoryAlerts.companyId, session.user.companyId));

        return NextResponse.json({
            success: true,
            data: alerts,
            summary: summary[0],
        });
    } catch (error) {
        console.error("Failed to fetch alert history:", error);
        return NextResponse.json(
            { error: "Failed to fetch alert history" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/inventory/alerts/[id]
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

/**
 * POST /api/inventory/alerts
 * Create a new alert (used by cron jobs)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        // Allow cron jobs without session
        const isCron = request.headers.get("x-cron-secret") === process.env.CRON_SECRET;
        
        if (!session?.user?.companyId && !isCron) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { companyId, branchId, itemId, type, severity, currentStock, minLevel, batchId } = body;

        // Check if active alert already exists
        const existingAlert = await db.query.inventoryAlerts.findFirst({
            where: and(
                eq(inventoryAlerts.companyId, companyId),
                eq(inventoryAlerts.branchId, branchId),
                eq(inventoryAlerts.itemId, itemId),
                eq(inventoryAlerts.type, type as any),
                eq(inventoryAlerts.status, 'ACTIVE')
            )
        });

        if (existingAlert) {
            return NextResponse.json({
                success: true,
                data: existingAlert,
                message: "Alert already exists",
            });
        }

        // Create new alert
        const [newAlert] = await db.insert(inventoryAlerts).values({
            companyId,
            branchId,
            itemId,
            type,
            severity,
            currentStock,
            minLevel,
            batchId: batchId || null,
            status: 'ACTIVE',
        }).returning();

        return NextResponse.json({
            success: true,
            data: newAlert,
        });
    } catch (error) {
        console.error("Failed to create alert:", error);
        return NextResponse.json(
            { error: "Failed to create alert" },
            { status: 500 }
        );
    }
}
