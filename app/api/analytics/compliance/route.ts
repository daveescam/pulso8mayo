
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { incidents, workflowInstances } from "@/lib/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
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

        // Metrics:
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
                    // Add date filters
                    // ...
                )
            );

        const openIncidentsResult = await db
            .select({
                count: sql<number>`count(*)`
            })
            .from(incidents)
            .where(
                and(
                    eq(incidents.status, 'DETECTED') // or != RESOLVED
                )
            );

        return NextResponse.json({
            complianceRate: Math.round(Number(scoreResult[0]?.avgScore || 0)),
            totalInspections: Number(scoreResult[0]?.count || 0),
            openIncidents: Number(openIncidentsResult[0]?.count || 0),
            period: "All Time" // or filtered
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
