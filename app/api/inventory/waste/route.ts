import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { inventoryWaste, inventoryBatches, inventoryItems, inventoryMovements } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      branchId,
      batchId,
      itemId,
      quantity,
      unit,
      reason,
      costPerUnit,
      totalLoss,
      notes,
    } = body;

    // Validate required fields
    if (!branchId || !itemId || !quantity || !unit || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if batch has enough stock
    let updatedStock = null;
    if (batchId) {
      const batch = await db.query.inventoryBatches.findFirst({
        where: eq(inventoryBatches.id, batchId),
      });

      if (!batch) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }

      if (batch.currentQuantity < quantity) {
        return NextResponse.json(
          { error: 'Insufficient batch stock' },
          { status: 400 }
        );
      }

      // Update batch quantity
      const newQuantity = batch.currentQuantity - quantity;
      await db
        .update(inventoryBatches)
        .set({
          currentQuantity: newQuantity,
          status: newQuantity === 0 ? 'DEPLETED' : batch.status,
          updatedAt: new Date(),
        })
        .where(eq(inventoryBatches.id, batchId));

      updatedStock = newQuantity;
    }

    // Create waste record
    const [waste] = await db
      .insert(inventoryWaste)
      .values({
        companyId: session.user.companyId,
        branchId,
        batchId: batchId || null,
        itemId,
        quantity,
        unit,
        reason,
        costPerUnit: costPerUnit ? Math.round(costPerUnit * 100) : null, // Convert to cents
        totalLoss: totalLoss ? Math.round(totalLoss * 100) : null, // Convert to cents
        recordedBy: session.user.id,
        recordedAt: new Date(),
        notes: notes || null,
      })
      .returning();

    // Create inventory movement
    await db
      .insert(inventoryMovements)
      .values({
        branchId,
        itemId,
        batchId: batchId || null,
        type: 'WASTE',
        quantityChange: -quantity, // Negative because we're removing stock
        reason: `WASTE: ${reason}`,
        performedBy: session.user.id,
        timestamp: new Date(),
      });

    return NextResponse.json({
      success: true,
      waste,
      updatedStock,
    });
  } catch (error) {
    console.error('Error creating waste record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
