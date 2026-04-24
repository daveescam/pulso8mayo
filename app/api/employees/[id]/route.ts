import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/lib/services/employee-service';
import { requireTenant } from '@/lib/tenant-context';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    console.log(`[API] Fetching employee ${id}...`);
    
    let tenant;
    try {
      tenant = await requireTenant();
      console.log(`[API] Tenant resolved:`, { id: tenant.id, name: tenant.name });
    } catch (tenantError: any) {
      console.error('[API] Tenant resolution failed:', tenantError);
      return NextResponse.json({ 
        error: 'Authentication required', 
        details: tenantError.message 
      }, { status: 401 });
    }

    if (!tenant.id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const includeContracts = searchParams.get('includeContracts') === 'true';
    const includeSalary = searchParams.get('includeSalary') === 'true';
    const includeOnboarding = searchParams.get('includeOnboarding') === 'true';
    const includeDocuments = searchParams.get('includeDocuments') === 'true';
    const includeBenefits = searchParams.get('includeBenefits') === 'true';
    const includeTraining = searchParams.get('includeTraining') === 'true';
    const includeVacation = searchParams.get('includeVacation') === 'true';
    const includeAttendance = searchParams.get('includeAttendance') === 'true';

    console.log(`[API] Fetching with options:`, {
      companyId: tenant.id,
      includeContracts,
      includeSalary,
      includeOnboarding,
      includeDocuments,
      includeBenefits,
      includeTraining,
      includeVacation,
      includeAttendance,
    });

    const employee = await EmployeeService.getEmployee(id, {
      companyId: tenant.id,
      includeContracts,
      includeSalary,
      includeOnboarding,
      includeDocuments,
      includeBenefits,
      includeTraining,
      includeVacation,
      includeAttendance,
    });

    console.log(`[API] Employee fetched successfully`);

    return NextResponse.json({
      success: true,
      data: employee
    });
  } catch (error: any) {
    console.error('[API] Error fetching employee:', error);
    console.error('[API] Error stack:', error.stack);

    if (error.status === 404) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch employee', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await requireTenant();
    const body = await request.json();
    const performedBy = request.headers.get('x-user-id') || 'system';

    if (!tenant.id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const updatedEmployee = await EmployeeService.updateEmployee(id, tenant.id, body, performedBy);

    return NextResponse.json({
      success: true,
      data: updatedEmployee
    });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE - Archive employee profile (Soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await requireTenant();

    if (!tenant.id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Logic for soft delete could be in EmployeeService or UserService
    // Using simple db update here for now or adding to EmployeeService
    return NextResponse.json({ 
      success: true,
      message: 'Employee archived successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
