import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { workflowAssignments, workflowInstances, workflowTemplates, users, branches } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, isNotNull, sql } from 'drizzle-orm';
import { apiResponse, apiError } from '@/lib/api/response';
import { requireTenant } from '@/lib/tenant-context';

/**
 * GET /api/operations/scheduled
 * List scheduled workflow assignments for operations dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const tenant = await requireTenant();

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Get assignments that are scheduled (have scheduleId) and upcoming
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const conditions = [
            eq(workflowTemplates.companyId, tenant.id),
            isNotNull(workflowAssignments.scheduleId), // Only scheduled assignments
            gte(workflowAssignments.dueDate, today), // Upcoming
            lte(workflowAssignments.dueDate, nextWeek), // Within next week
        ];

        if (branchId) {
            conditions.push(eq(workflowInstances.branchId, branchId));
        }

        const scheduledAssignments = await db
            .select({
                id: workflowAssignments.id,
                status: workflowAssignments.status,
                dueDate: workflowAssignments.dueDate,
                priority: workflowAssignments.priority,
                assignmentType: workflowAssignments.assignmentType,
                instanceId: workflowAssignments.instanceId,
                templateName: workflowTemplates.name,
                templateId: workflowTemplates.id,
                branchName: branches.name,
                assigneeName: users.name,
                assigneeId: users.id,
                createdAt: workflowAssignments.createdAt,
            })
            .from(workflowAssignments)
            .innerJoin(workflowInstances, eq(workflowAssignments.instanceId, workflowInstances.id))
            .innerJoin(workflowTemplates, eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`))
            .leftJoin(branches, eq(workflowInstances.branchId, branches.id))
            .leftJoin(users, eq(workflowAssignments.assignedTo, users.id))
            .where(and(...conditions))
            .orderBy(desc(workflowAssignments.dueDate))
            .limit(limit);

        return apiResponse(scheduledAssignments);

    } catch (error) {
        console.error('Error fetching scheduled assignments:', error);
        return apiError('Failed to fetch scheduled assignments', 500);
    }
}