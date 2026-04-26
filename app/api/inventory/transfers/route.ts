import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { InventoryService } from "@/lib/services/inventory-service";
import { z } from "zod";

const transferRequestSchema = z.object({
    toBranchId: z.string().uuid(),
    items: z.array(z.object({
        itemId: z.string().uuid(),
        batchId: z.string().uuid().optional(),
        requestedQuantity: z.number().positive(),
        notes: z.string().optional(),
    })),
    notes: z.string().optional(),
});

/**
 * POST /api/inventory/transfers
 * Create a new transfer request
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
        const validatedData = transferRequestSchema.parse(body);

        // Create transfer
        const result = await InventoryService.createTransfer({
            fromBranchId: session.user.branchId,
            toBranchId: validatedData.toBranchId,
            requestedBy: session.user.id,
            items: validatedData.items,
            notes: validatedData.notes,
        });

        return NextResponse.json({
            success: true,
            transfer: result.transfer,
            items: result.items,
        });

    } catch (error) {
        console.error("Transfer request error:", error);
        
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create transfer request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inventory/transfers
 * Get transfers for the current user's branch
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
        const role = searchParams.get("role") as 'from' | 'to' | 'both' || 'both';
        const status = searchParams.get("status");

        // Get transfers
        const transfers = await InventoryService.getTransfersByBranch(
            session.user.branchId,
            role
        );

        // Filter by status if provided
        let filteredTransfers = transfers;
        if (status) {
            filteredTransfers = transfers.filter(t => t.transfer.status === status);
        }

        return NextResponse.json({
            success: true,
            transfers: filteredTransfers,
        });

    } catch (error) {
        console.error("Get transfers error:", error);
        return NextResponse.json(
            { error: "Failed to fetch transfers" },
            { status: 500 }
        );
    }
}
