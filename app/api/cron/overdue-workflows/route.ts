/**
 * Overdue Workflows Cron Endpoint
 * 
 * GET /api/cron/overdue-workflows
 * Marks overdue workflows and sends alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { processOverdueWorkflows } from '@/lib/cron/overdue-workflows';

export async function GET(req: NextRequest) {
    try {
        // Verify cron secret (for security)
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Execute cron job
        const result = await processOverdueWorkflows();

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Cron API] Overdue workflows failed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
