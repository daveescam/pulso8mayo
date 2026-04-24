import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { equipmentMaintenanceHistory, branchEquipments } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const branchId = searchParams.get("branchId");
    const equipmentId = searchParams.get("equipmentId");
    const status = searchParams.get("status");

    const history = await db.query.equipmentMaintenanceHistory.findMany({
      orderBy: (history, { desc }) => [desc(history.scheduledDate)],
    });

    const filtered = history.filter((record) => {
      if (companyId && record.companyId !== companyId) return false;
      if (branchId && record.branchId !== branchId) return false;
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
    const body = await request.json();
    const { equipmentId, companyId, branchId, maintenanceType, scheduledDate, description, workPerformed, tasksCompleted, partsUsed, partsCost, laborCost, totalCost, providerType, providerName, providerContact, technicianName, technicianLicense, findings, recommendations, nextMaintenanceDate, beforePhotos, afterPhotos, documents, signatureUrl, workflowInstanceId, createdBy } = body;

    if (!equipmentId || !companyId || !branchId || !maintenanceType || !scheduledDate || !description || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newMaintenance = await db.insert(equipmentMaintenanceHistory).values({
      equipmentId,
      companyId,
      branchId,
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
      createdBy,
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