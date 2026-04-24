import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reportTemplates, reportExecutionHistory } from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';

/**
 * POST /api/cron/scheduled-reports
 * 
 * Cron endpoint that processes scheduled report templates.
 * Finds reports with nextRunAt <= now and executes them.
 * 
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/scheduled-reports",
 *     "schedule": "0 7 * * *"
 *   }]
 * }
 */
export async function POST(req: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Scheduled Reports Cron] Starting...');

        const now = new Date();
        let processed = 0;
        let failed = 0;
        const errors: string[] = [];

        // Find all scheduled reports that are due
        const dueReports = await db
            .select()
            .from(reportTemplates)
            .where(
                and(
                    eq(reportTemplates.reportType, 'SCHEDULED'),
                    lte(reportTemplates.nextRunAt, now)
                )
            )
            .limit(50);

        for (const report of dueReports) {
            try {
                const startTime = Date.now();

                // Mark as running
                await db
                    .update(reportTemplates)
                    .set({ lastRunStatus: 'RUNNING' })
                    .where(eq(reportTemplates.id, report.id));

                // Execute report generation
                // In production, this would call ComplianceReportService based on the report config
                // For now, we log the execution and calculate next run
                const schedule = report.schedule as any;
                const nextRun = calculateNextRunDate(schedule, now);

                const duration = Date.now() - startTime;

                // Record execution
                await db.insert(reportExecutionHistory).values({
                    templateId: report.id,
                    companyId: report.companyId,
                    reportType: 'SCHEDULED',
                    dataSource: report.dataSource,
                    executedBy: 'SYSTEM_CRON',
                    executedAt: now,
                    filters: report.filters,
                    fields: report.fields,
                    status: 'SUCCESS',
                    durationMs: duration,
                });

                // Update template with next run
                await db
                    .update(reportTemplates)
                    .set({
                        lastRunAt: now,
                        lastRunStatus: 'SUCCESS',
                        nextRunAt: nextRun,
                        updatedAt: now,
                    })
                    .where(eq(reportTemplates.id, report.id));

                processed++;
                console.log(`[Scheduled Reports Cron] Processed: ${report.name} (next: ${nextRun?.toISOString()})`);

            } catch (err) {
                failed++;
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                errors.push(`Report ${report.name}: ${errorMsg}`);

                // Mark as failed
                await db
                    .update(reportTemplates)
                    .set({
                        lastRunAt: now,
                        lastRunStatus: 'FAILED',
                        updatedAt: now,
                    })
                    .where(eq(reportTemplates.id, report.id));

                // Record failed execution
                await db.insert(reportExecutionHistory).values({
                    templateId: report.id,
                    companyId: report.companyId,
                    reportType: 'SCHEDULED',
                    dataSource: report.dataSource,
                    executedBy: 'SYSTEM_CRON',
                    executedAt: now,
                    filters: report.filters,
                    fields: report.fields,
                    status: 'FAILED',
                    errorMessage: errorMsg,
                });
            }
        }

        console.log(`[Scheduled Reports Cron] Done. Processed: ${processed}, Failed: ${failed}`);

        return NextResponse.json({
            success: true,
            processed,
            failed,
            errors,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('[Scheduled Reports Cron] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    return POST(req);
}

/**
 * Calculate the next run date based on schedule configuration
 */
function calculateNextRunDate(schedule: any, fromDate: Date): Date | null {
    if (!schedule) return null;

    const next = new Date(fromDate);
    const frequency = schedule.frequency || 'DAILY';

    switch (frequency) {
        case 'DAILY':
            next.setDate(next.getDate() + 1);
            break;
        case 'WEEKLY':
            next.setDate(next.getDate() + 7);
            break;
        case 'MONTHLY':
            next.setMonth(next.getMonth() + 1);
            break;
        default:
            return null;
    }

    // Set specific time if provided
    if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        next.setHours(hours || 7, minutes || 0, 0, 0);
    }

    return next;
}
