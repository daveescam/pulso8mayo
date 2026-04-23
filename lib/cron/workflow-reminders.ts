/**
 * Workflow Reminders Cron Job
 * 
 * Sends reminders for workflows that are due soon (within 24 hours)
 * Run frequency: Every hour
 */

import { db } from '@/lib/db';
import { workflowAssignments, workflowInstances } from '@/lib/db/schema';
import { and, eq, between, sql } from 'drizzle-orm';
import { whatsappNotificationDispatcher } from '@/lib/whatsapp/notification-dispatcher';

export async function sendWorkflowReminders() {
    try {
        console.log('[Cron] Starting workflow reminders job...');

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find assignments due within 24 hours
        const dueSoonAssignments = await db
            .select({
                assignment: workflowAssignments,
                instance: workflowInstances,
            })
            .from(workflowAssignments)
            .leftJoin(
                workflowInstances,
                eq(workflowAssignments.instanceId, workflowInstances.id)
            )
            .where(
                and(
                    eq(workflowAssignments.status, 'PENDING'),
                    sql`${workflowAssignments.dueDate} IS NOT NULL`,
                    sql`${workflowAssignments.dueDate} > ${now}`,
                    sql`${workflowAssignments.dueDate} <= ${tomorrow}`,
                    // Only send reminder once (check if we haven't sent in last 23 hours)
                    sql`(${workflowAssignments.lastReminderSent} IS NULL OR ${workflowAssignments.lastReminderSent} < ${new Date(now.getTime() - 23 * 60 * 60 * 1000)})`
                )
            );

        console.log(`[Cron] Found ${dueSoonAssignments.length} assignments due soon`);

        // Send reminders
        for (const { assignment, instance } of dueSoonAssignments) {
            try {
                await whatsappNotificationDispatcher.sendWorkflowDueSoon(
                    assignment.assignedTo,
                    {
                        ...assignment,
                        instance,
                    }
                );

                // Update last reminder sent timestamp
                await db
                    .update(workflowAssignments)
                    .set({ lastReminderSent: new Date() })
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
