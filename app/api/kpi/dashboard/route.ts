import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { kpiDefinitions, kpiHistory } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { subDays, startOfDay, format } from "date-fns";
import { kpiService } from "@/lib/services/kpi-service";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");
        const periodParam = searchParams.get("period") || "7d"; // 24h, 7d, 30d, 90d

        let daysToSubtract = 7;
        if (periodParam === "24h") daysToSubtract = 1;
        if (periodParam === "30d") daysToSubtract = 30;
        if (periodParam === "90d") daysToSubtract = 90;

        const startDate = startOfDay(subDays(new Date(), daysToSubtract));

        // 1. Get KPIs definitions for the company
        const kpis = await kpiService.getKpis(session.user.companyId, branchId === "all" ? undefined : branchId || undefined);

        // 2. Fetch history for each KPI within the period
        const dashboardStats = await Promise.all(kpis.map(async (kpi) => {
            // Get history records
            const historyRecords = await db.query.kpiHistory.findMany({
                where: and(
                    eq(kpiHistory.kpiId, kpi.id),
                    gte(kpiHistory.periodStart, startDate)
                ),
                orderBy: desc(kpiHistory.periodStart)
            });

            // If we have history, format it. Otherwise, return synthetic fallback or empty
            const history = historyRecords.map(h => ({
                date: format(h.periodStart, "yyyy-MM-dd"),
                value: Number(h.value) / 100, // db stores it * 100 for decimals
            })).reverse(); // Oldest to newest for chart

            // Fallback for current value
            let currentValue = 0;
            let status = "NORMAL";
            let previousValue = 0;

            if (historyRecords.length > 0) {
                currentValue = Number(historyRecords[0].value) / 100;
                status = historyRecords[0].status;
                if (historyRecords.length > 1) {
                    previousValue = Number(historyRecords[1].value) / 100;
                }
            } else {
                // If no history exists yet, we could potentially call calculateKpiValue
                const calculated = await kpiService.calculateKpiValue(kpi, branchId || undefined);
                currentValue = calculated.value;
                status = calculated.status;

                // Provide a basic mock history for today so charts don't crash
                history.push({
                    date: format(new Date(), "yyyy-MM-dd"),
                    value: currentValue
                });
            }

            return {
                id: kpi.id,
                name: kpi.name,
                description: kpi.description,
                metricType: kpi.metricType,
                category: kpi.category,
                unit: kpi.unit,
                decimalPlaces: kpi.decimalPlaces,
                target: kpi.target,
                warningThreshold: kpi.warningThreshold,
                criticalThreshold: kpi.criticalThreshold,
                thresholdType: kpi.thresholdType,
                currentValue,
                previousValue,
                status,
                history,
            };
        }));

        return NextResponse.json({ kpis: dashboardStats });
    } catch (error) {
        console.error("[KPI Dashboard API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
