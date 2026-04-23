/**
 * Inventory Checks Cron Endpoint
 * 
 * GET /api/cron/inventory-checks
 * Checks for low stock and expiring products, sends WhatsApp notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkInventoryAlerts } from '@/lib/cron/inventory-checks';

export async function GET(req: NextRequest) {
    try {
        // Verify cron secret (for security)
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Execute cron job
        const result = await checkInventoryAlerts();

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Cron API] Inventory checks failed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
