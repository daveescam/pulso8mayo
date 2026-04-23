import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { requireTenant } from '@/lib/tenant-context';

// GET - List employees (same as users but with employee-specific format)
export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenant();
    
    // If user doesn't have a company assigned, return empty list
    if (!tenant.id) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        },
      });
    }
    
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;

    const result = await UserService.listUsers(tenant.id, { page, limit, search, role });
    
    // Transform the data to match the Employee interface expected by EmployeeDirectory
    // Since the users table doesn't have all employee-specific fields, we provide default values
    const employees = result.data.map(user => ({
      id: user.id,
      userId: user.id,
      employeeNumber: null, // This field doesn't exist in users table yet
      position: null, // This field doesn't exist in users table yet
      department: null, // This field doesn't exist in users table yet
      employeeStatus: 'ACTIVE', // Default status
      isActive: true, // Default active status
      hireDate: null, // This field doesn't exist in users table yet
      city: null, // This field doesn't exist in users table yet
      state: null, // This field doesn't exist in users table yet
      personalEmail: null, // This field doesn't exist in users table yet
      personalPhone: user.phone || null, // Use phone field from users table
      profilePhotoUrl: user.image || null, // Use image field from users table
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
    }));

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
