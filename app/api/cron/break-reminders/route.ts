import { NextRequest, NextResponse } from 'next/server';
import { BreakReminderService } from '@/lib/services/break-reminder-service';

/**
 * GET /api/cron/break-reminders
 * Cron job to check and send break reminders
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await BreakReminderService.checkAndSendReminders();

        return NextResponse.json({
            success: result.success,
            remindersSent: result.remindersSent,
            exceededBreaks: result.exceededBreaks,
            errors: result.errors,
        });
    } catch (error) {
        console.error('Error in break reminder cron job:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
