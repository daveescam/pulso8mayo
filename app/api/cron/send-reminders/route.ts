import { NextRequest, NextResponse } from 'next/server';
import { sendDueSoonReminders } from '@/lib/cron/send-reminders';

/**
 * Cron endpoint to send due soon reminders
 * Vercel Cron: 0 8 * * * (daily at 8:00 AM)
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

        console.log('[API] Sending due soon reminders cron job');
        const result = await sendDueSoonReminders();

        return NextResponse.json(result);

    } catch (error) {
        console.error('[API] Error in send-reminders cron:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
