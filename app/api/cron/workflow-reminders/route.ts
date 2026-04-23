/**
 * Workflow Reminders Cron Endpoint
 * 
 * GET /api/cron/workflow-reminders
 * Triggers workflow reminder notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendWorkflowReminders } from '@/lib/cron/workflow-reminders';

export async function GET(req: NextRequest) {
    try {
        // Verify cron secret (for security)
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Execute cron job
        const result = await sendWorkflowReminders();

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Cron API] Workflow reminders failed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
