/**
 * Workflow Reminders Cron Job
 * 
 * Sends reminders for workflows that are due soon (within 24 hours)
 * Run frequency: Every hour
 */

import { db } from '@/lib/db';
import { workflowAssignments } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { whatsappNotificationDispatcher } from '@/lib/whatsapp/notification-dispatcher';

export async function sendWorkflowReminders() {
    try {
        console.log('[Cron] Starting workflow reminders job...');

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find assignments due within 24 hours
        const dueSoonAssignments = await db
            .select()
            .from(workflowAssignments)
            .where(
                and(
                    eq(workflowAssignments.status, 'PENDING'),
                    sql`${workflowAssignments.dueDate} IS NOT NULL`,
                    sql`${workflowAssignments.dueDate} > ${now}`,
                    sql`${workflowAssignments.dueDate} <= ${tomorrow}`
                )
            );

        console.log(`[Cron] Found ${dueSoonAssignments.length} assignments due soon`);

        // Send reminders
        for (const assignment of dueSoonAssignments) {
            try {
                await whatsappNotificationDispatcher.sendWorkflowDueSoon(
                    assignment.assignedTo,
                    {
                        id: assignment.id,
                        workflowName: 'Workflow',
                        dueDate: assignment.dueDate?.toISOString(),
                        priority: assignment.priority,
                    }
                );

                // Update notifiedAt to track that reminder was sent
                await db
                    .update(workflowAssignments)
                    .set({ notifiedAt: new Date() })
                    .where(eq(workflowAssignments.id, assignment.id));

                console.log(`[Cron] Reminder sent for assignment ${assignment.id}`);
            } catch (error) {
                console.error(`[Cron] Failed to send reminder for assignment ${assignment.id}:`, error);
            }
        }

        console.log('[Cron] Workflow reminders job completed');
        return { success: true, count: dueSoonAssignments.length };
    } catch (error) {
        console.error('[Cron] Workflow reminders job failed:', error);
        return { success: false, error: String(error) };
    }
}
