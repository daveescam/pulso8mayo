import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  equipmentMaintenanceHistory,
  branchEquipments,
} from "@/lib/db/schema";
import { eq, and, gte, lte, or, asc } from "drizzle-orm";
import { addDays } from "date-fns";
import { requireTenant } from "@/lib/tenant-context";
import { ApiHandler } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenant();
    if (!tenant.id || !tenant.branchId) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam) : 60;

    const branchId = tenant.branchId;
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

    return ApiHandler.success(enriched);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
