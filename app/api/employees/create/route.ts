import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/lib/services/employee-service';
import { requireTenant } from '@/lib/tenant-context';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  userName: z.string().min(1),
  userEmail: z.string().email(),
  employeeNumber: z.string(),
  position: z.string(),
  department: z.string(),
  hireDate: z.string(),
  companyId: z.string(),
  curp: z.string().optional(),
  rfc: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const tenant = await requireTenant();
    if (!tenant.id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createEmployeeSchema.parse(body);
    const performedBy = request.headers.get('x-user-id') || 'system';

    // In a real app, we'd also trigger an invitation email here
    const newEmployee = await EmployeeService.createEmployee(validatedData, performedBy);

    return NextResponse.json({
      success: true,
      data: newEmployee,
      message: 'Employee created successfully'
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 422 });
    }
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message || 'Failed to create employee' }, { status: 500 });
  }
}
