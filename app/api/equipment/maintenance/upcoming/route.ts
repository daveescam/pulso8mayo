import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
  equipmentMaintenanceHistory, 
  branchEquipments,
  equipmentMaintenanceSchedules 
} from "@/lib/db/schema";
import { eq, and, gte, lte, or, isNull, asc } from "drizzle-orm";
import { addDays } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam) : 60;

    if (!branchId) {
      return NextResponse.json(
        { error: "Branch ID is required" },
        { status: 400 }
      );
    }

    const today = new Date();
    const endDate = addDays(today, days);

    const maintenanceRecords = await db.query.equipmentMaintenanceHistory.findMany({
      where: and(
        eq(equipmentMaintenanceHistory.branchId, branchId),
        or(
          and(
            gte(equipmentMaintenanceHistory.scheduledDate, today),
            lte(equipmentMaintenanceHistory.scheduledDate, endDate)
          ),
          and(
            eq(equipmentMaintenanceHistory.status, "SCHEDULED"),
            gte(equipmentMaintenanceHistory.scheduledDate, new Date("1970-01-01")),
            lte(equipmentMaintenanceHistory.scheduledDate, today)
          )
        )
      ),
      orderBy: (history, { asc }) => [asc(history.scheduledDate)],
    });

    const overdueRecords = maintenanceRecords.filter(
      r => r.status === "SCHEDULED" && new Date(r.scheduledDate!) < today
    );

    const scheduledRecords = maintenanceRecords.filter(
      r => r.status === "SCHEDULED" && new Date(r.scheduledDate!) >= today
    );

    const allRecords = [...overdueRecords, ...scheduledRecords];

    const enriched = await Promise.all(
      allRecords.map(async (record) => {
        const equipment = await db.query.branchEquipments.findFirst({
          where: (equip, { eq }) => eq(equip.id, record.equipmentId),
        });
        return {
          maintenance: record,
          equipment: equipment || null,
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error("Error fetching upcoming maintenance:", error);
    return NextResponse.json(
      { error: "Error fetching upcoming maintenance" },
      { status: 500 }
    );
  }
}