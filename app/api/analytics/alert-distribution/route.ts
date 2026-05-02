import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { kpiAlerts, kpiDefinitions, incidents } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const kpiAlertsByType = await db
      .select({
        alertType: kpiAlerts.alertType,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(kpiAlerts)
      .innerJoin(kpiDefinitions, eq(kpiAlerts.kpiId, kpiDefinitions.id))
      .where(
        and(
          eq(kpiDefinitions.companyId, companyId),
          eq(kpiAlerts.status, "ACTIVE"),
        ),
      )
      .groupBy(kpiAlerts.alertType);

    const incidentsBySeverity = await db
      .select({
        severity: incidents.severity,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(incidents)
      .where(sql`${incidents.status} != 'RESOLVED'`)
      .groupBy(incidents.severity);

    const alertDistribution = [
      ...kpiAlertsByType.map((a) => ({
        name: a.alertType === "WARNING" ? "KPI Advertencia" : "KPI Crítico",
        value: Number(a.count),
        color: a.alertType === "WARNING" ? "#eab308" : "#ef4444",
      })),
      ...incidentsBySeverity.map((i) => ({
        name:
          i.severity === "CRITICAL"
            ? "Incidente Crítico"
            : i.severity === "WARNING"
              ? "Incidente Advertencia"
              : "Incidente Fatal",
        value: Number(i.count),
        color:
          i.severity === "CRITICAL"
            ? "#dc2626"
            : i.severity === "WARNING"
              ? "#f59e0b"
              : "#7f1d1d",
      })),
    ].filter((a) => a.value > 0);

    return NextResponse.json({ alertDistribution });
  } catch (error) {
    console.error("Error fetching alert distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert distribution" },
      { status: 500 },
    );
  }
}
