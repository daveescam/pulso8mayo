import { NextRequest, NextResponse } from 'next/server';
import { executeScheduledWorkflows } from '@/lib/cron/execute-schedules';

/**
 * Cron endpoint to execute scheduled workflows
 * Vercel Cron: every 5 minutes (schedule: "* /5 * * * *")
 */
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[API] Executing scheduled workflows cron job');
        const result = await executeScheduledWorkflows();

        return NextResponse.json(result);

    } catch (error) {
        console.error('[API] Error in execute-schedules cron:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
