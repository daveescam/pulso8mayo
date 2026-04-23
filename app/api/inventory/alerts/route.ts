import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { StockAlertService } from "@/lib/services/stock-alert-service";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/inventory/alerts
 * Get stock alerts for a branch
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");

        if (!branchId) {
            return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
        }

        // Verify branch belongs to user's company
        const branch = await db.query.branches.findFirst({
            where: eq(branches.id, branchId)
        });

        if (!branch || branch.companyId !== session.user.companyId) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }

        const [lowStock, outOfStock, expiringSoon, expired] = await Promise.all([
            StockAlertService.getLowStockItems(branchId),
            StockAlertService.getOutOfStockItems(branchId),
            StockAlertService.getExpiringSoonItems(branchId),
            StockAlertService.getExpiredItems(branchId)
        ]);

        return NextResponse.json({
            lowStock,
            outOfStock,
            expiringSoon,
            expired,
            summary: {
                lowStockCount: lowStock.length,
                outOfStockCount: outOfStock.length,
                expiringSoonCount: expiringSoon.length,
                expiredCount: expired.length
            }
        });

    } catch (error) {
        console.error("[Inventory Alerts API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/inventory/alerts/check
 * Check stock levels and send alerts
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");

        // Check all branches if no branchId provided
        const branchIds = branchId ? [branchId] : 
            (await db.query.branches.findMany({
                where: eq(branches.companyId, session.user.companyId)
            })).map(b => b.id);

        const allAlerts = [];

        for (const bid of branchIds) {
            const alerts = await StockAlertService.checkStockLevels(bid);
            allAlerts.push(...alerts);
        }

        // Send notifications
        const { sent, failed } = await StockAlertService.sendAlerts(
            allAlerts,
            session.user.companyId
        );

        return NextResponse.json({
            alertsGenerated: allAlerts.length,
            notificationsSent: sent,
            notificationsFailed: failed
        });

    } catch (error) {
        console.error("[Inventory Alerts API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
