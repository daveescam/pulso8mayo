import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workflowInstances, workflowTemplates, branches, incidents } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * API Endpoint for Compliance Analytics
 * Returns compliance trends, scorecards by category, deadlines, and alerts
 */
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id || !session?.user?.companyId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');
        const days = parseInt(searchParams.get('days') || '30');

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get user's accessible branches
        const userBranches = await db.query.branches.findMany({
            where: eq(branches.companyId, session.user.companyId),
            columns: { id: true, name: true }
        });

        const branchIds = userBranches.map(b => b.id);
        const filterBranchIds = branchId ? [branchId] : branchIds;

        // 1. Historical Trends (daily compliance rate)
        const trendsQuery = await db
            .select({
                date: sql<string>`DATE(${workflowInstances.completedAt})`,
                avgScore: sql<number>`AVG(${workflowInstances.score})`,
                completedCount: sql<number>`COUNT(*)`
            })
            .from(workflowInstances)
            .innerJoin(
                workflowTemplates,
                eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`)
            )
            .where(
                and(
                    eq(workflowTemplates.companyId, session.user.companyId),
                    eq(workflowInstances.status, 'COMPLETED'),
                    gte(workflowInstances.completedAt, startDate),
                    lte(workflowInstances.completedAt, endDate),
                    filterBranchIds.length > 0 ? 
                        sql`${workflowInstances.branchId} = ANY(${sql.array(filterBranchIds, 'uuid')})` : 
                        undefined
                )
            )
            .groupBy(sql`DATE(${workflowInstances.completedAt})`)
            .orderBy(sql`DATE(${workflowInstances.completedAt})`);

        // 2. Compliance Scorecards by Category
        const categoryQuery = await db
            .select({
                category: workflowTemplates.category,
                complianceType: workflowTemplates.complianceType,
                avgScore: sql<number>`AVG(${workflowInstances.score})`,
                totalCount: sql<number>`COUNT(*)`,
                criticalCount: sql<number>`COUNT(*) FILTER (WHERE ${workflowTemplates.isCritical} = true)`
            })
            .from(workflowInstances)
            .innerJoin(
                workflowTemplates,
                eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`)
            )
            .where(
                and(
                    eq(workflowTemplates.companyId, session.user.companyId),
                    eq(workflowInstances.status, 'COMPLETED'),
                    gte(workflowInstances.completedAt, startDate),
                    lte(workflowInstances.completedAt, endDate),
                    filterBranchIds.length > 0 ? 
                        sql`${workflowInstances.branchId} = ANY(${sql.array(filterBranchIds, 'uuid')})` : 
                        undefined
                )
            )
            .groupBy(workflowTemplates.category, workflowTemplates.complianceType);

        // 3. Upcoming Deadlines (scheduled workflows in next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const deadlinesQuery = await db
            .select({
                id: workflowTemplates.id,
                name: workflowTemplates.name,
                branchName: branches.name,
                branchId: branches.id,
                nextExecutionAt: workflowTemplates.updatedAt, // Placeholder - would need workflow_schedules table
                complianceType: workflowTemplates.complianceType,
                isCritical: workflowTemplates.isCritical
            })
            .from(workflowTemplates)
            .leftJoin(branches, eq(workflowTemplates.branchId, branches.id))
            .where(
                and(
                    eq(workflowTemplates.companyId, session.user.companyId),
                    eq(workflowTemplates.active, true)
                )
            )
            .orderBy(desc(workflowTemplates.isCritical))
            .limit(10);

        // 4. Compliance Alerts (low scores, critical items)
        const alertsQuery = await db
            .select({
                id: incidents.id,
                title: incidents.title,
                severity: incidents.severity,
                status: incidents.status,
                branchId: incidents.branchId,
                createdAt: incidents.createdAt,
                workflowName: workflowTemplates.name
            })
            .from(incidents)
            .leftJoin(
                workflowTemplates,
                eq(incidents.instanceId, sql`cast(${workflowTemplates.id} as uuid)`)
            )
            .where(
                and(
                    eq(incidents.status, 'DETECTED'),
                    sql`${incidents.branchId} = ANY(${sql.array(branchIds, 'uuid')})`
                )
            )
            .orderBy(desc(incidents.severity))
            .limit(10);

        // 5. Branch-level breakdown
        const branchBreakdownQuery = await db
            .select({
                branchId: workflowInstances.branchId,
                branchName: branches.name,
                avgScore: sql<number>`AVG(${workflowInstances.score})`,
                totalCount: sql<number>`COUNT(*)`,
                criticalIssues: sql<number>`COUNT(*) FILTER (WHERE ${workflowInstances.score} < 70)`
            })
            .from(workflowInstances)
            .innerJoin(
                workflowTemplates,
                eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`)
            )
            .leftJoin(branches, eq(workflowInstances.branchId, branches.id))
            .where(
                and(
                    eq(workflowTemplates.companyId, session.user.companyId),
                    eq(workflowInstances.status, 'COMPLETED'),
                    gte(workflowInstances.completedAt, startDate),
                    lte(workflowInstances.completedAt, endDate)
                )
            )
            .groupBy(workflowInstances.branchId, branches.name);

        // Format response
        const trends = trendsQuery.map(row => ({
            date: row.date,
            complianceRate: Math.round(Number(row.avgScore) || 0),
            completedWorkflows: Number(row.completedCount)
        }));

        const scorecards = categoryQuery.map(row => ({
            category: row.category || 'GENERAL',
            complianceType: row.complianceType,
            complianceRate: Math.round(Number(row.avgScore) || 0),
            totalWorkflows: Number(row.totalCount),
            criticalWorkflows: Number(row.criticalCount)
        }));

        const deadlines = deadlinesQuery.map(row => ({
            id: row.id,
            name: row.name || 'Sin nombre',
            branchName: row.branchName || 'General',
            branchId: row.branchId,
            dueDate: row.nextExecutionAt,
            complianceType: row.complianceType,
            isCritical: row.isCritical || false
        }));

        const alerts = alertsQuery.map(row => ({
            id: row.id,
            title: row.title,
            severity: row.severity,
            status: row.status,
            branchId: row.branchId,
            createdAt: row.createdAt,
            workflowName: row.workflowName
        }));

        const branchBreakdown = branchBreakdownQuery.map(row => ({
            branchId: row.branchId,
            branchName: row.branchName || 'Sin sucursal',
            complianceRate: Math.round(Number(row.avgScore) || 0),
            totalWorkflows: Number(row.totalCount),
            criticalIssues: Number(row.criticalIssues)
        }));

        return NextResponse.json({
            trends,
            scorecards,
            deadlines,
            alerts,
            branchBreakdown,
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                days
            }
        });

    } catch (error) {
        console.error("Compliance Analytics Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
