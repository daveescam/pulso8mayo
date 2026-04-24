import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/lib/services/employee-service';
import { requireTenant } from '@/lib/tenant-context';
import { z } from 'zod';

// POST - Create new employee
const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional(),
  branchId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  employeeNumber: z.string().optional(),
  hireDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const tenant = await requireTenant();
    if (!tenant.id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createEmployeeSchema.parse(body);
    
    // Employee creation logic will be handled fully in later steps
    return NextResponse.json({ 
      error: 'Employee creation via this endpoint is coming soon. Use User management for now and then update profile.' 
    }, { status: 501 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}

// GET - List employees
export async function GET(request: NextRequest) {
  console.log('[API /employees] GET request received');
  try {
    const tenant = await requireTenant();
    console.log('[API /employees] Tenant:', tenant);
    
    if (!tenant.id) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      });
    }
    
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const search = searchParams.get('search') || undefined;
    const department = searchParams.get('department') || undefined;
    const status = searchParams.get('status') || undefined;
    const branchId = searchParams.get('branchId') || undefined;

    const result = await EmployeeService.listEmployees(tenant.id, { 
      page, 
      limit, 
      search, 
      department, 
      status, 
      branchId 
    });
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.meta,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

