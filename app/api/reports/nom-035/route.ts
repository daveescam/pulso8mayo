import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { complianceReportService, ReportFilters } from '@/lib/services/ComplianceReportService';

/**
 * POST /api/reports/nom-035
 * Generate NOM-035 psychosocial risk report
 *
 * Request body:
 * - startDate: string (ISO date)
 * - endDate: string (ISO date)
 * - branchId: string (UUID)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { startDate, endDate, branchId } = body;

        // Validate required fields
        if (!startDate || !endDate || !branchId) {
            return NextResponse.json(
                { error: 'Missing required fields: startDate, endDate, branchId' },
                { status: 400 }
            );
        }

        // Parse dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' },
                { status: 400 }
            );
        }

        if (start > end) {
            return NextResponse.json(
                { error: 'startDate must be before endDate' },
                { status: 400 }
            );
        }

        // Validate branchId is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(branchId)) {
            return NextResponse.json(
                { error: 'Invalid branchId format. Must be a valid UUID' },
                { status: 400 }
            );
        }

        // Generate report data
        const filters: ReportFilters = {
            startDate: start,
            endDate: end,
            branchId,
            companyId: session.user.companyId
        };

        const reportData = await complianceReportService.generateNOM035Report(filters);

        // Generate PDF
        const pdfBuffer = await complianceReportService.generateNOM035PDF(reportData);

        // Convert ArrayBuffer to Buffer for NextResponse
        const buffer = Buffer.from(pdfBuffer);

        // Return PDF as downloadable file
        const fileName = `NOM-035-${branchId}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.pdf`;

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': buffer.length.toString()
            },
            status: 200
        });

    } catch (error) {
        console.error('Error generating NOM-035 report:', error);

        if (error instanceof Error) {
            if (error.message === 'Branch not found') {
                return NextResponse.json(
                    { error: 'Branch not found' },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/reports/nom-035
 * Get NOM-035 report data (JSON format, without PDF generation)
 *
 * Query params:
 * - startDate: string (ISO date)
 * - endDate: string (ISO date)
 * - branchId: string (UUID)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const branchId = searchParams.get('branchId');

        if (!startDate || !endDate || !branchId) {
            return NextResponse.json(
                { error: 'Missing required parameters: startDate, endDate, branchId' },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            );
        }

        if (start > end) {
            return NextResponse.json(
                { error: 'startDate must be before endDate' },
                { status: 400 }
            );
        }

        const filters: ReportFilters = {
            startDate: start,
            endDate: end,
            branchId,
            companyId: session.user.companyId
        };

        const reportData = await complianceReportService.generateNOM035Report(filters);

        return NextResponse.json(reportData);

    } catch (error) {
        console.error('Error fetching NOM-035 report data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch report data' },
            { status: 500 }
        );
    }
}
