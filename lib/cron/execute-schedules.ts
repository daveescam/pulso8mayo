import { WorkflowScheduleService } from '@/lib/services/workflow-schedule-service';
import { WorkflowAssignmentService } from '@/lib/services/workflow-assignment-service';
import { NotificationService } from '@/lib/services/notification-service';
import { db } from '@/lib/db';
import { workflowSchedules } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Execute scheduled workflows
 * Runs every 5 minutes
 * 
 * This job:
 * 1. Finds schedules due for execution
 * 2. Creates workflow instances
 * 3. Creates assignments
 * 4. Sends notifications
 * 5. Updates schedule next execution time
 */
export async function executeScheduledWorkflows() {
    console.log('[Cron] Starting scheduled workflow execution...');

    try {
        // Get schedules due for execution
        const dueSchedules = await WorkflowScheduleService.getSchedulesDueForExecution();

        console.log(`[Cron] Found ${dueSchedules.length} schedules due for execution`);

        if (dueSchedules.length === 0) {
            return { success: true, executed: 0 };
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: any[] = [];

        // Process each schedule
        for (const schedule of dueSchedules) {
            try {
                console.log(`[Cron] Executing schedule: ${schedule.id} - ${schedule.title}`);

                // Create workflow instance
                const instance = await WorkflowScheduleService.executeSchedule(schedule.id);
                console.log(`[Cron] Created workflow instance: ${instance.id}`);

                // Create assignment
                const assignment = await WorkflowAssignmentService.autoAssignWorkflow(
                    instance.id,
                    schedule
                );
                console.log(`[Cron] Created assignment: ${assignment.id} for user: ${assignment.assignedTo}`);

                // Send notification
                await NotificationService.notifyWorkflowAssignment(assignment);
                console.log(`[Cron] Notification sent to user: ${assignment.assignedTo}`);

                // Calculate next execution time
                const nextExecution = WorkflowScheduleService.calculateNextExecution({
                    frequency: schedule.frequency,
                    dayOfWeek: schedule.dayOfWeek,
                    dayOfMonth: schedule.dayOfMonth,
                    timeOfDay: schedule.timeOfDay,
                    startDate: schedule.startDate,
                });

                // Update schedule
                await db
                    .update(workflowSchedules)
                    .set({
                        lastExecutedAt: new Date(),
                        nextExecutionAt: nextExecution,
                        executionCount: sql`${workflowSchedules.executionCount} + 1`,
                        updatedAt: new Date(),
                    })
                    .where(eq(workflowSchedules.id, schedule.id));

                console.log(`[Cron] Updated schedule, next execution: ${nextExecution}`);
                successCount++;

            } catch (error) {
                console.error(`[Cron] Failed to execute schedule ${schedule.id}:`, error);
                errorCount++;
                errors.push({
                    scheduleId: schedule.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        console.log(`[Cron] Execution complete. Success: ${successCount}, Errors: ${errorCount}`);

        return {
            success: true,
            executed: successCount,
            errors: errorCount,
            details: errors,
        };

    } catch (error) {
        console.error('[Cron] Fatal error in executeScheduledWorkflows:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
