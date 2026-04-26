import { NextRequest, NextResponse } from 'next/server';
import { calculatePayrollData, payrollToCSV } from '@/lib/services/compliance/payroll-calculator';
import { z } from 'zod';

const exportSchema = z.object({
  companyId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(),   // YYYY-MM-DD
  format: z.enum(['generic', 'contpaqi', 'noi']).default('generic'),
});

// POST - Generate payroll export
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = exportSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validated.error.issues },
      { status: 400 }
    );
  }

  const { companyId, branchId, startDate, endDate, format } = validated.data;

    // Calculate payroll data
    const records = await calculatePayrollData({
      companyId,
      branchId,
      startDate,
      endDate,
    });

    // Return as JSON for preview, or as CSV for download
    const { searchParams } = new URL(request.url);
    const output = searchParams.get('output') || 'json';

    if (output === 'csv') {
      const csv = payrollToCSV(records, format);
      const formatLabel = format === 'contpaqi' ? 'CONTPAQi' : format === 'noi' ? 'NOI' : 'General';
      const filename = `nomina_${formatLabel}_${startDate}_${endDate}.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      records,
      summary: {
        totalEmployees: records.length,
        totalDaysWorked: records.reduce((s, r) => s + r.daysWorked, 0),
        totalOvertimeHours: records.reduce((s, r) => s + r.overtimeHours, 0),
        totalVacationDays: records.reduce((s, r) => s + r.vacationDays, 0),
        totalLeaveDays: records.reduce((s, r) => s + r.sickDays + r.otherLeaveDays, 0),
        period: { startDate, endDate },
        format,
      },
    });
  } catch (error) {
    console.error('Error generating payroll export:', error);
    return NextResponse.json(
      { error: 'Failed to generate payroll export' },
      { status: 500 }
    );
  }
}
