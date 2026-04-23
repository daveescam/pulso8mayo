import { NextRequest, NextResponse } from 'next/server';
import { runDocumentExpirationCheck } from '@/lib/cron/document-expiration-check';

/**
 * GET /api/cron/document-expiration-check
 * Cron job to check for expiring documents
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await runDocumentExpirationCheck();

        return NextResponse.json({
            success: result.success,
            expiringCount: result.expiringCount,
            expiredCount: result.expiredCount,
        });
    } catch (error) {
        console.error('Error in document expiration check:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
