import { WorkflowAssignmentService } from '@/lib/services/workflow-assignment-service';
import { NotificationService } from '@/lib/services/notification-service';

/**
 * Check for overdue assignments
 * Runs every hour
 * 
 * This job:
 * 1. Finds assignments past their due date
 * 2. Marks them as overdue
 * 3. Sends overdue notifications
 */
export async function checkOverdueAssignments() {
    console.log('[Cron] Starting overdue assignments check...');

    try {
        // Get assignments past due date
        const overdueAssignments = await WorkflowAssignmentService.checkOverdueAssignments();

        console.log(`[Cron] Found ${overdueAssignments.length} overdue assignments`);

        if (overdueAssignments.length === 0) {
            return { success: true, processed: 0 };
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: any[] = [];

        // Process each overdue assignment
        for (const assignment of overdueAssignments) {
            try {
                console.log(`[Cron] Processing overdue assignment: ${assignment.id}`);

                // Mark as overdue
                await WorkflowAssignmentService.markOverdue(assignment.id);
                console.log(`[Cron] Marked assignment ${assignment.id} as overdue`);

                // Send overdue notification
                await NotificationService.notifyWorkflowOverdue(assignment);
                console.log(`[Cron] Sent overdue notification for assignment ${assignment.id}`);

                successCount++;

            } catch (error) {
                console.error(`[Cron] Failed to process overdue assignment ${assignment.id}:`, error);
                errorCount++;
                errors.push({
                    assignmentId: assignment.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        console.log(`[Cron] Overdue check complete. Success: ${successCount}, Errors: ${errorCount}`);

        return {
            success: true,
            processed: successCount,
            errors: errorCount,
            details: errors,
        };

    } catch (error) {
        console.error('[Cron] Fatal error in checkOverdueAssignments:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
