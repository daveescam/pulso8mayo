import { NextRequest, NextResponse } from 'next/server';
import { checkOverdueAssignments } from '@/lib/cron/check-overdue';

/**
 * Cron endpoint to check overdue assignments
 * Vercel Cron: 0 * * * * (every hour)
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

        console.log('[API] Checking overdue assignments cron job');
        const result = await checkOverdueAssignments();

        return NextResponse.json(result);

    } catch (error) {
        console.error('[API] Error in check-overdue cron:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
