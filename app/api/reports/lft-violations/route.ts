import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { lftViolationDetector, LFTViolation } from '@/lib/reports/lft-violation-reporter';

/**
 * GET /api/reports/lft-violations
 * Get LFT violations report
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const branchId = searchParams.get('branchId');
        const format = searchParams.get('format'); // 'json' or 'csv'

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'startDate and endDate are required' },
                { status: 400 }
            );
        }

        // Detect violations
        const violations = await lftViolationDetector.detectViolations(
            new Date(startDate),
            new Date(endDate),
            branchId || undefined
        );

        // Return CSV if requested
        if (format === 'csv') {
            const csvContent = lftViolationDetector.exportToCSV(violations);
            
            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="lft-violations-${Date.now()}.csv"`,
                },
            });
        }

        // Return JSON
        return NextResponse.json({
            violations,
            summary: {
                total: violations.length,
                bySeverity: {
                    LEVE: violations.filter(v => v.severity === 'LEVE').length,
                    GRAVE: violations.filter(v => v.severity === 'GRAVE').length,
                    MUY_GRAVE: violations.filter(v => v.severity === 'MUY_GRAVE').length,
                },
                byType: violations.reduce((acc, v) => {
                    acc[v.type] = (acc[v.type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
            },
            filters: {
                startDate,
                endDate,
                branchId: branchId || undefined,
            },
        });
    } catch (error) {
        console.error('Error fetching LFT violations:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
