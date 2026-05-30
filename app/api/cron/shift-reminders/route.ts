import { NextRequest, NextResponse } from 'next/server';
import { sendShiftReminders } from '@/lib/cron/shift-reminders';

/**
 * Cron endpoint to send shift reminders to employees
 * Vercel Cron: 0 18 * * * (daily at 6:00 PM for next-day shifts)
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[API] Sending shift reminders cron job');
        const result = await sendShiftReminders();

        return NextResponse.json(result);

    } catch (error) {
        console.error('[API] Error in shift-reminders cron:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
