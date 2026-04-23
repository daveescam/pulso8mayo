import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { InventoryService } from "@/lib/services/inventory-service";
import { db } from "@/lib/db";
import { inventoryBatches, inventoryItems, suppliers, incidents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const receivingSchema = z.object({
    items: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive(),
        batchNumber: z.string().optional(),
        expirationDate: z.string().optional(),
        productionDate: z.string().optional(),
        unitCost: z.number().optional(),
        temperature: z.number().optional(),
    })),
    supplierId: z.string().uuid().optional(),
    purchaseOrderId: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * POST /api/inventory/receiving
 * Process a receiving workflow - scan/enter items being received
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id || !session?.user?.branchId) {
            return NextResponse.json(
                { error: "Unauthorized - User must be logged in and belong to a branch" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validatedData = receivingSchema.parse(body);

        const receivingResults = [];

        // Process each item in the receiving
        for (const itemData of validatedData.items) {
            const { itemId, quantity, batchNumber, expirationDate, productionDate, unitCost, temperature } = itemData;

            // Get item details
            const item = await InventoryService.getItem(itemId);
            if (!item) {
                return NextResponse.json(
                    { error: `Item not found: ${itemId}` },
                    { status: 404 }
                );
            }

            // If purchase order exists, verify quantity
            if (validatedData.purchaseOrderId) {
                // TODO: Implement PO verification logic
                // For now, just log it
                console.log(`PO verification for ${itemId} - quantity: ${quantity}`);
            }

            // Create batch with expiration date and batch number
            const batch = await InventoryService.createBatch({
                itemId,
                branchId: session.user.branchId,
                initialQuantity: quantity,
                currentQuantity: quantity,
                lotNumber: batchNumber || `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                expirationDate: expirationDate ? new Date(expirationDate) : undefined,
                productionDate: productionDate ? new Date(productionDate) : undefined,
                supplierId: validatedData.supplierId || item.supplierId || null,
                unitCost: unitCost ? Math.round(unitCost * 100) : null, // Store in cents
                status: (temperature !== undefined && temperature > 4) ? 'QUARANTINED' : 'AVAILABLE',
                supplierBatchInfo: {
                    receivedBy: session.user.id,
                    receivedAt: new Date().toISOString(),
                    notes: validatedData.notes,
                    temperature: temperature,
                }
            });

            // Record the receiving movement
            const movement = await InventoryService.recordMovement({
                branchId: session.user.branchId,
                itemId,
                batchId: batch.id,
                type: 'RECEIVING',
                quantityChange: quantity,
                reason: validatedData.notes || 'Receiving workflow',
                performedBy: session.user.id,
            });

            // If the item is quarantined due to high temperature, automatically trigger an incident
            if (temperature !== undefined && temperature > 4) {
                await db.insert(incidents).values({
                    instanceId: uuidv4(), // Placeholder since it's not a generic workflow
                    stepId: `RECEIVING_QA_${item.id}`,
                    branchId: session.user.branchId,
                    severity: 'WARNING',
                    status: 'DETECTED',
                    title: `Rechazo de Calidad: ${item.name} por Alta Temperatura`,
                    description: `El producto ${item.name} fue recibido con una temperatura de ${temperature}°C, excediendo el límite máximo de calidad (4°C). Lote mandado a cuarentena automáticamente.`,
                    detectedBy: session.user.id,
                    metadata: {
                        itemId: item.id,
                        quantity,
                        recordedTemperature: temperature,
                        supplierId: validatedData.supplierId || item.supplierId
                    }
                });
            }

            receivingResults.push({
                itemId,
                itemName: item.name,
                batchId: batch.id,
                batchNumber: batch.lotNumber,
                quantity,
                expirationDate: batch.expirationDate,
                movementId: movement.id,
            });
        }

        // Generate receiving report data
        const receivingReport = {
            id: `REC-${Date.now()}`,
            branchId: session.user.branchId,
            receivedAt: new Date().toISOString(),
            receivedBy: session.user.id,
            supplierId: validatedData.supplierId,
            purchaseOrderId: validatedData.purchaseOrderId,
            items: receivingResults,
            totalItems: receivingResults.length,
            notes: validatedData.notes,
        };

        return NextResponse.json({
            success: true,
            receiving: receivingReport,
        });

    } catch (error) {
        console.error("Receiving workflow error:", error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid data", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to process receiving" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/inventory/receiving
 * Get pending receiving workflows or recent receiving history
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const days = parseInt(searchParams.get("days") || "30");

        // Get recent receiving movements
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // TODO: Create a dedicated receiving table if we need to track full receiving documents
        // For now, return recent RECEIVING type movements grouped by batch

        const recentBatches = await db.select({
            id: inventoryBatches.id,
            lotNumber: inventoryBatches.lotNumber,
            itemId: inventoryBatches.itemId,
            branchId: inventoryBatches.branchId,
            initialQuantity: inventoryBatches.initialQuantity,
            receivedAt: inventoryBatches.receivedAt,
            expirationDate: inventoryBatches.expirationDate,
            supplierId: inventoryBatches.supplierId,
            supplierBatchInfo: inventoryBatches.supplierBatchInfo,
            item: {
                name: inventoryItems.name,
                sku: inventoryItems.sku,
            },
            supplier: {
                name: suppliers.name,
            }
        })
        .from(inventoryBatches)
        .leftJoin(inventoryItems, eq(inventoryBatches.itemId, inventoryItems.id))
        .leftJoin(suppliers, eq(inventoryBatches.supplierId, suppliers.id))
        .where(
            and(
                eq(inventoryBatches.branchId, session.user.branchId!),
                // Filter by receivedAt date
            )
        )
        .orderBy((t) => t.receivedAt)
        .limit(limit);

        return NextResponse.json({
            success: true,
            receivings: recentBatches,
        });

    } catch (error) {
        console.error("Get receiving error:", error);
        return NextResponse.json(
            { error: "Failed to fetch receiving data" },
            { status: 500 }
        );
    }
}
