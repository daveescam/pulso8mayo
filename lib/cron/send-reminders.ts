import { db } from '@/lib/db';
import { workflowAssignments } from '@/lib/db/schema';
import { and, gte, lte, or, eq } from 'drizzle-orm';
import { NotificationService } from '@/lib/services/notification-service';

/**
 * Send due soon reminders
 * Runs daily at 8:00 AM
 * 
 * This job:
 * 1. Finds assignments due in the next 24 hours
 * 2. Sends reminder notifications
 */
export async function sendDueSoonReminders() {
    console.log('[Cron] Starting due soon reminders...');

    try {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Get assignments due in next 24 hours
        const dueSoonAssignments = await db
            .select()
            .from(workflowAssignments)
            .where(
                and(
                    or(
                        eq(workflowAssignments.status, 'PENDING'),
                        eq(workflowAssignments.status, 'NOTIFIED'),
                        eq(workflowAssignments.status, 'STARTED')
                    ),
                    gte(workflowAssignments.dueDate, now),
                    lte(workflowAssignments.dueDate, in24Hours),
                    eq(workflowAssignments.isOverdue, false)
                )
            );

        console.log(`[Cron] Found ${dueSoonAssignments.length} assignments due soon`);

        if (dueSoonAssignments.length === 0) {
            return { success: true, sent: 0 };
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: any[] = [];

        // Send reminders
        for (const assignment of dueSoonAssignments) {
            try {
                console.log(`[Cron] Sending reminder for assignment: ${assignment.id}`);

                const assignmentData = {
                    ...assignment,
                    dueDate: assignment.dueDate?.toISOString(),
                };
                await NotificationService.notifyWorkflowDueSoon(assignmentData);
                console.log(`[Cron] Reminder sent for assignment ${assignment.id}`);

                successCount++;

            } catch (error) {
                console.error(`[Cron] Failed to send reminder for assignment ${assignment.id}:`, error);
                errorCount++;
                errors.push({
                    assignmentId: assignment.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        console.log(`[Cron] Reminders complete. Success: ${successCount}, Errors: ${errorCount}`);

        return {
            success: true,
            sent: successCount,
            errors: errorCount,
            details: errors,
        };

    } catch (error) {
        console.error('[Cron] Fatal error in sendDueSoonReminders:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
