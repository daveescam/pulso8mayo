import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { requireTenant } from '@/lib/tenant-context';

// GET - Get employee profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tenant = await requireTenant();

    if (!tenant.id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get user data (since we don't have employeeProfiles table)
    const user = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, id),
        isNull(users.deletedAt),
        eq(users.companyId, tenant.id)
      ))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Transform user data to match expected employee profile format
    const employee = {
      id: user[0].id,
      userId: user[0].id,
      employeeNumber: null, // Not available in users table
      position: null, // Not available in users table
      department: null, // Not available in users table
      employeeStatus: 'ACTIVE', // Default status
      isActive: true, // Default active status
      hireDate: null, // Not available in users table
      dateOfBirth: null, // Not available in users table
      curp: null, // Not available in users table
      rfc: null, // Not available in users table
      nss: null, // Not available in users table
      gender: null, // Not available in users table
      maritalStatus: null, // Not available in users table
      bloodType: null, // Not available in users table
      nationality: 'MEXICANA', // Default
      personalEmail: null, // Not available in users table
      personalPhone: user[0].phone || null, // Use phone field
      address: null, // Not available in users table
      city: null, // Not available in users table
      state: null, // Not available in users table
      zipCode: null, // Not available in users table
      emergencyContactName: null, // Not available in users table
      emergencyContactPhone: null, // Not available in users table
      emergencyContactEmail: null, // Not available in users table
      emergencyContactRelationship: null, // Not available in users table
      bankName: null, // Not available in users table
      clabe: null, // Not available in users table
      cardNumber: null, // Not available in users table
      paymentMethod: null, // Not available in users table
      name: user[0].name,
      email: user[0].email,
      role: user[0].role,
      branchId: user[0].branchId,
      image: user[0].image,
      createdAt: user[0].createdAt,
      updatedAt: user[0].updatedAt,
      // Empty arrays for related data that doesn't exist yet
      contracts: [],
      salaryHistory: [],
      onboarding: null,
      onboardingSteps: [],
      documents: [],
      benefits: [],
      training: [],
      vacationAccruals: []
    };

    return NextResponse.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT - Update employee profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tenant = await requireTenant();
    const body = await request.json();

    if (!tenant.id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if employee exists
    const existingUser = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, id),
        isNull(users.deletedAt),
        eq(users.companyId, tenant.id)
      ))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Update only allowed fields
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.branchId !== undefined) updateData.branchId = body.branchId;
    if (body.image !== undefined) updateData.image = body.image;

    // Update user
    const updatedUser = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}
