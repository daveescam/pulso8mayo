/**
 * Overdue Workflows Cron Job
 * 
 * Marks workflows as overdue and sends alerts
 * Run frequency: Every hour
 */

import { db } from '@/lib/db';
import { workflowAssignments, workflowInstances, workflowTemplates } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { whatsappNotificationDispatcher } from '@/lib/whatsapp/notification-dispatcher';

export async function processOverdueWorkflows() {
    try {
        console.log('[Cron] Starting overdue workflows job...');

        const now = new Date();

// Find assignments that are past due but still pending
        const overdueAssignments = await db
            .select({
                assignment: workflowAssignments,
                instance: workflowInstances,
                template: workflowTemplates,
            })
            .from(workflowAssignments)
            .leftJoin(
                workflowInstances,
                eq(workflowAssignments.instanceId, workflowInstances.id)
            )
            .leftJoin(
                workflowTemplates,
                eq(workflowInstances.workflowTemplateId, workflowTemplates.id)
            )
            .where(
                and(
                    eq(workflowAssignments.status, 'PENDING'),
                    sql`${workflowAssignments.dueDate} IS NOT NULL`,
                    sql`${workflowAssignments.dueDate} < ${now}`
                )
            );

        console.log(`[Cron] Found ${overdueAssignments.length} overdue assignments`);

        // Update status and send alerts
        for (const { assignment, instance, template } of overdueAssignments) {
            try {
                // Update status to OVERDUE
                await db
                    .update(workflowAssignments)
                    .set({
                        status: 'OVERDUE',
                        updatedAt: new Date(),
                    })
                    .where(eq(workflowAssignments.id, assignment.id));

                // Send overdue alert
                await whatsappNotificationDispatcher.sendWorkflowOverdue(
                    assignment.assignedTo,
                    {
                        id: assignment.id,
                        workflowName: template?.name || 'Workflow',
                        dueDate: assignment.dueDate?.toISOString(),
                        priority: assignment.priority,
                    }
                );

                console.log(`[Cron] Marked assignment ${assignment.id} as overdue`);
            } catch (error) {
                console.error(`[Cron] Failed to process overdue assignment ${assignment.id}:`, error);
            }
        }

        console.log('[Cron] Overdue workflows job completed');
        return { success: true, count: overdueAssignments.length };
    } catch (error) {
        console.error('[Cron] Overdue workflows job failed:', error);
        return { success: false, error: String(error) };
    }
}
