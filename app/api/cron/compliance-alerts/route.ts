import { NextRequest, NextResponse } from 'next/server';
import { complianceAlertService } from '@/lib/services/compliance-alert-service';

/**
 * POST /api/cron/compliance-alerts
 * 
 * Cron endpoint that evaluates compliance metrics and generates alerts.
 * Designed to run daily via Vercel Cron or external scheduler.
 * 
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/compliance-alerts",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */
export async function POST(req: NextRequest) {
    try {
        // Verify cron secret (for security)
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Compliance Alerts Cron] Starting evaluation...');

        // Evaluate and generate alerts
        const result = await complianceAlertService.evaluateAndGenerateAlerts();

        // Auto-resolve improved alerts
        const resolved = await complianceAlertService.autoResolveAlerts();

        console.log(`[Compliance Alerts Cron] Done. Created: ${result.alertsCreated}, Resolved: ${resolved}, Companies: ${result.companiesChecked}`);

        return NextResponse.json({
            success: true,
            alertsCreated: result.alertsCreated,
            alertsResolved: resolved,
            companiesChecked: result.companiesChecked,
            errors: result.errors,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Compliance Alerts Cron] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Also support GET for easy testing
export async function GET(req: NextRequest) {
    return POST(req);
}
