import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { InventoryService } from "@/lib/services/inventory-service";
import { db } from "@/lib/db";
import { inventoryItems, inventoryBatches, branches } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * GET /api/inventory/low-stock
 * Get items with low stock levels
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id || !session?.user?.branchId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId") || session.user.branchId;
        const includeOk = searchParams.get("includeOk") === "true"; // Include items with stock >= minLevel

        // Get all stock levels for this branch
        const stockLevels = await db.select({
            itemId: inventoryBatches.itemId,
            totalStock: sql<number>`sum(${inventoryBatches.currentQuantity})`,
        })
        .from(inventoryBatches)
        .where(
            and(
                eq(inventoryBatches.branchId, branchId),
                eq(inventoryBatches.status, 'AVAILABLE')
            )
        )
        .groupBy(inventoryBatches.itemId);

        // Get item details with minLevel
        const itemIds = stockLevels.map(s => s.itemId);
        if (itemIds.length === 0) {
            return NextResponse.json({
                success: true,
                items: [],
            });
        }

        const items = await db.select({
            id: inventoryItems.id,
            name: inventoryItems.name,
            sku: inventoryItems.sku,
            category: inventoryItems.category,
            minLevel: inventoryItems.minLevel,
            unit: inventoryItems.unit,
            supplierId: inventoryItems.supplierId,
        })
        .from(inventoryItems)
        .where(inArray(inventoryItems.id, itemIds));

        // Map stock to items
        const itemsWithStock = items.map(item => {
            const stock = stockLevels.find(s => s.itemId === item.itemId);
            const currentStock = stock?.totalStock || 0;
            const minLevel = item.minLevel || 0;
            
            return {
                ...item,
                currentStock,
                minLevel,
                isLowStock: currentStock < minLevel,
                shortage: Math.max(0, minLevel - currentStock),
                suggestedReorder: minLevel > 0 ? (minLevel * 2) - currentStock : 0,
            };
        });

        // Filter low stock items unless includeOk is true
        let filteredItems = itemsWithStock;
        if (!includeOk) {
            filteredItems = itemsWithStock.filter(item => item.isLowStock);
        }

        // Sort by shortage (most critical first)
        filteredItems.sort((a, b) => b.shortage - a.shortage);

        return NextResponse.json({
            success: true,
            branchId,
            totalItems: itemsWithStock.length,
            lowStockCount: itemsWithStock.filter(i => i.isLowStock).length,
            items: filteredItems,
        });

    } catch (error) {
        console.error("Get low stock error:", error);
        return NextResponse.json(
            { error: "Failed to fetch low stock items" },
            { status: 500 }
        );
    }
}
