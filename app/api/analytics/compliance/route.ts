
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { incidents, workflowInstances, workflowTemplates } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get params for date range (optional)
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build conditions
        const conditions = [];

        // Filter by company? Ideally yes, but schema might not link instances directly to company, 
        // usually via Branch.
        // For MVP, we assume user can see all or we filter by their managed branches.
        // Let's just fetch all for now and aggregate.

        // 1. Average Score (Compliance Rate)
        // 2. Total Inspections (Completed Instances)
        // 3. Open Incidents

        const scoreResult = await db
            .select({
                avgScore: sql<number>`avg(${workflowInstances.score})`,
                count: sql<number>`count(*)`
            })
            .from(workflowInstances)
            .where(
                and(
                    eq(workflowInstances.status, 'COMPLETED'),
                )
            );

        const openIncidentsResult = await db
            .select({
                count: sql<number>`count(*)`
            })
            .from(incidents)
            .where(
                and(
                    eq(incidents.status, 'DETECTED')
                )
            );

        // EXTRA: Workflows by Status
        // @ts-ignore - status exists but TS might be picky
        const statusResult = await db
            .select({
                status: workflowInstances.status,
                count: sql<number>`count(*)`
            })
            .from(workflowInstances)
            .groupBy(workflowInstances.status);

        // EXTRA: Compliance by Category (Radial Chart)
        const categoriesResult = await db
            .select({
                category: workflowTemplates.complianceType,
                avgScore: sql<number>`avg(${workflowInstances.score})`,
            })
            .from(workflowInstances)
            .innerJoin(workflowTemplates, eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`))
            .where(eq(workflowInstances.status, 'COMPLETED'))
            .groupBy(workflowTemplates.complianceType);

        // EXTRA: Labor Stats (Shifts)
        const activeShiftsResult = await db
            .select({
                count: sql<number>`count(*)`
            })
            .from(workflowInstances)
            .where(eq(workflowInstances.status, 'IN_PROGRESS'));

        // EXTRA: 7-Day Trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const trendResult = await db
            .select({
                date: sql<string>`DATE(${workflowInstances.completedAt})`,
                count: sql<number>`count(*)`
            })
            .from(workflowInstances)
            .where(
                and(
                    eq(workflowInstances.status, 'COMPLETED'),
                    gte(workflowInstances.completedAt, sevenDaysAgo)
                )
            )
            .groupBy(sql`DATE(${workflowInstances.completedAt})`)
            .orderBy(sql`DATE(${workflowInstances.completedAt})`);

        // EXTRA: Critical Incidents
        const criticalIncidentsResult = await db
            .select({
                id: incidents.id,
                title: incidents.title,
                severity: incidents.severity,
                detectedAt: incidents.createdAt,
                status: incidents.status
            })
            .from(incidents)
            .where(
                and(
                    sql`${incidents.severity} IN ('CRITICAL', 'WARNING')`,
                    sql`${incidents.status} != 'RESOLVED'`
                )
            )
            .orderBy(desc(incidents.createdAt))
            .limit(3);

        const complianceRate = Math.round(Number(scoreResult[0]?.avgScore || 0));
        const activeStaff = Number(activeShiftsResult[0]?.count || 0);
        const openIncidents = Number(openIncidentsResult[0]?.count || 0);

        return NextResponse.json({
            complianceRate,
            complianceSentiment: complianceRate > 90 ? "Bueno" : complianceRate > 75 ? "Regular" : "Atención",
            totalInspections: Number(scoreResult[0]?.count || 0),
            openIncidents,
            openIncidentsSentiment: openIncidents === 0 ? "Bajo" : openIncidents < 3 ? "Atención" : "Crítico",
            activeStaff,
            activeStaffSentiment: activeStaff > 0 ? "Normal" : "Bajo",
            workflowsByStatus: statusResult.map(s => ({
                status: s.status,
                count: Number(s.count)
            })),
            complianceByCategory: categoriesResult.map(c => ({
                category: c.category || "General",
                score: Math.round(Number(c.avgScore || 0))
            })),
            dailyTrend: trendResult.map(t => ({
                date: t.date,
                count: Number(t.count)
            })),
            criticalIncidents: criticalIncidentsResult,
            period: "All Time"
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
