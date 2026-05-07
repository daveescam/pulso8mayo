import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { equipmentMaintenanceHistory, branchEquipments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireTenant, requireAuth } from "@/lib/tenant-context";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenant();
    if (!tenant.id || !tenant.branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get("equipmentId");
    const status = searchParams.get("status");

    // Filter by tenant's branch by default
    const history = await db.query.equipmentMaintenanceHistory.findMany({
      where: (history, { eq }) => eq(history.branchId, tenant.branchId!),
      orderBy: (history, { desc }) => [desc(history.scheduledDate)],
    });

    const filtered = history.filter((record) => {
      if (equipmentId && record.equipmentId !== equipmentId) return false;
      if (status && record.status !== status) return false;
      return true;
    });

    const enriched = await Promise.all(
      filtered.map(async (record) => {
        const equipment = await db.query.branchEquipments.findFirst({
          where: (equip, { eq }) => eq(equip.id, record.equipmentId),
        });
        return {
          ...record,
          equipmentName: equipment?.name || "Unknown",
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching maintenance history:", error);
    return NextResponse.json({ error: "Error fetching maintenance" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const tenant = await requireTenant();

    if (!tenant.id || !tenant.branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { equipmentId, maintenanceType, scheduledDate, description, workPerformed, tasksCompleted, partsUsed, partsCost, laborCost, totalCost, providerType, providerName, providerContact, technicianName, technicianLicense, findings, recommendations, nextMaintenanceDate, beforePhotos, afterPhotos, documents, signatureUrl, workflowInstanceId } = body;

    if (!equipmentId || !maintenanceType || !scheduledDate || !description) {
      return NextResponse.json(
        { error: "Missing required fields: equipmentId, maintenanceType, scheduledDate, description" },
        { status: 400 }
      );
    }

    const newMaintenance = await db.insert(equipmentMaintenanceHistory).values({
      equipmentId,
      companyId: tenant.id,
      branchId: tenant.branchId,
      maintenanceType,
      status: "SCHEDULED",
      scheduledDate: new Date(scheduledDate),
      description,
      workPerformed,
      tasksCompleted: tasksCompleted || [],
      partsUsed: partsUsed || [],
      partsCost,
      laborCost,
      totalCost,
      providerType: providerType || "INTERNAL",
      providerName,
      providerContact,
      technicianName,
      technicianLicense,
      findings,
      recommendations,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
      beforePhotos: beforePhotos || [],
      afterPhotos: afterPhotos || [],
      documents: documents || [],
      signatureUrl,
      workflowInstanceId,
      createdBy: user.id,
    }).returning();

    await db.update(branchEquipments)
      .set({ lastMaintenanceDate: new Date(), updatedAt: new Date() })
      .where(eq(branchEquipments.id, equipmentId));

    return NextResponse.json(newMaintenance[0], { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    return NextResponse.json({ error: "Error creating maintenance" }, { status: 500 });
  }
}