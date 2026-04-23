import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryItems, inventoryBatches, branches, users, companies, inventoryAlerts } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { InventoryService } from "@/lib/services/inventory-service";
import { StockAlertService } from "@/lib/services/stock-alert-service";

/**
 * GET /api/cron/stock-check
 * Cron job to check stock levels and generate alerts for low stock items
 * 
 * This should be called daily (or hourly) by a scheduler like:
 * - Vercel Cron
 * - GitHub Actions
 * - External cron service
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret if provided
        const authHeader = req.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized - Invalid cron secret" },
                { status: 401 }
            );
        }

        console.log("[Stock Check] Starting daily stock check...");

        // Get all branches
        const allBranches = await db.select({
            id: branches.id,
            name: branches.name,
            companyId: branches.companyId,
        }).from(branches);

        const alerts = [];

        // Check each branch
        for (const branch of allBranches) {
            console.log(`[Stock Check] Checking branch: ${branch.name}`);

            // Get all stock levels for this branch
            const stockLevels = await db.select({
                itemId: inventoryBatches.itemId,
                totalStock: sql<number>`sum(${inventoryBatches.currentQuantity})`,
            })
            .from(inventoryBatches)
            .where(
                and(
                    eq(inventoryBatches.branchId, branch.id),
                    eq(inventoryBatches.status, 'AVAILABLE')
                )
            )
            .groupBy(inventoryBatches.itemId);

            // Get item details with minLevel
            const itemIds = stockLevels.map(s => s.itemId);
            if (itemIds.length === 0) continue;

            const items = await db.select({
                id: inventoryItems.id,
                name: inventoryItems.name,
                sku: inventoryItems.sku,
                minLevel: inventoryItems.minLevel,
                unit: inventoryItems.unit,
                companyId: inventoryItems.companyId,
            })
            .from(inventoryItems)
            .where(inArray(inventoryItems.id, itemIds));

            // Find items below min level
            for (const item of items) {
                const stock = stockLevels.find(s => s.itemId === item.itemId);
                const currentStock = stock?.totalStock || 0;
                const minLevel = item.minLevel || 0;

                if (currentStock < minLevel) {
                    const shortage = minLevel - currentStock;
                    
                    // Calculate suggested reorder quantity (2x min level as a starting point)
                    const suggestedReorder = minLevel * 2 - currentStock;

                    alerts.push({
                        branchId: branch.id,
                        branchName: branch.name,
                        companyId: branch.companyId,
                        itemId: item.id,
                        itemName: item.name,
                        sku: item.sku,
                        currentStock,
                        minLevel,
                        shortage,
                        suggestedReorder,
                        unit: item.unit,
                    });

                    console.log(
                        `[Stock Alert] ${item.name}: Stock ${currentStock} < Min ${minLevel} (Shortage: ${shortage})`
                    );
                }
            }
        }

        // Send notifications to responsible users
        console.log(`[Stock Check] Found ${alerts.length} low stock alerts`);
        
        let notificationsSent = 0;
        let notificationsFailed = 0;
        
        if (alerts.length > 0) {
            // Group alerts by company
            const alertsByCompany = alerts.reduce((acc, alert) => {
                if (!acc[alert.companyId]) {
                    acc[alert.companyId] = [];
                }
                acc[alert.companyId].push(alert);
                return acc;
            }, {} as Record<string, typeof alerts>);

            // Send alerts for each company
            for (const [companyId, companyAlerts] of Object.entries(alertsByCompany)) {
                console.log(`[Stock Check] Sending alerts for company ${companyId}...`);
                
                // Convert to StockAlert format
                const stockAlerts = companyAlerts.map(alert => ({
                    itemId: alert.itemId,
                    itemName: alert.itemName,
                    currentStock: alert.currentStock,
                    minLevel: alert.minLevel,
                    branchId: alert.branchId,
                    branchName: alert.branchName,
                    severity: alert.currentStock === 0 ? 'CRITICA' as const : 
                              alert.currentStock < alert.minLevel / 2 ? 'ALTA' as const :
                              alert.currentStock < alert.minLevel * 0.75 ? 'MEDIA' as const : 'BAJA' as const,
                    type: alert.currentStock === 0 ? 'OUT_OF_STOCK' as const : 'LOW_STOCK' as const,
                }));

                const result = await StockAlertService.sendAlerts(stockAlerts, companyId);
                notificationsSent += result.sent;
                notificationsFailed += result.failed;
            }
        }

        console.log(`[Stock Check] Notifications sent: ${notificationsSent}, failed: ${notificationsFailed}`);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            branchesChecked: allBranches.length,
            alertsCount: alerts.length,
            notificationsSent,
            notificationsFailed,
            alerts,
        });

    } catch (error) {
        console.error("[Stock Check] Error:", error);
        return NextResponse.json(
            { error: "Failed to check stock levels" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/cron/stock-check
 * Manually trigger stock check (for testing)
 */
export async function POST(req: NextRequest) {
    return GET(req);
}
