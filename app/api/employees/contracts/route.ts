import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employeeContracts, salaryHistory, employeeAuditLogs, employeeDocuments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for contract
const contractSchema = z.object({
  contractNumber: z.string().min(1),
  contractType: z.enum(['DETERMINATE', 'INDETERMINATE', 'PROBATION', 'TRAINING', 'SEASONAL', 'PART_TIME']),
  workRegime: z.enum(['DAILY', 'MIXED', 'NIGHT', 'SPLIT_SHIFT', 'ON_CALL']),
  startDate: z.string(),
  endDate: z.string().optional(),
  probationPeriodDays: z.number().optional(),
  signatureDate: z.string().optional(),
  baseSalary: z.number().min(0),
  monthlySalary: z.number().optional(),
  weeklySalary: z.number().optional(),
  currency: z.string().default('MXN').optional(),
  hasHealthInsurance: z.boolean().optional(),
  hasLifeInsurance: z.boolean().optional(),
  hasSavingsFund: z.boolean().optional(),
  hasFoodVouchers: z.boolean().optional(),
  hasTransportationBonus: z.boolean().optional(),
  benefitsNotes: z.string().optional(),
  workStartTime: z.string().optional(),
  workEndTime: z.string().optional(),
  workDays: z.array(z.number()).optional(),
  breakDurationMinutes: z.number().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']).optional(),
  renewalDate: z.string().optional(),
  autoRenew: z.boolean().optional(),
  contractDocumentId: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

// GET - Get all contracts for an employee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');

    if (!userId && !companyId) {
      return NextResponse.json(
        { error: 'userId or companyId is required' },
        { status: 400 }
      );
    }

    let query = db
      .select()
      .from(employeeContracts)
      .orderBy(desc(employeeContracts.startDate));

    if (userId) {
      query = query.where(eq(employeeContracts.userId, userId));
    } else if (companyId) {
      query = query.where(eq(employeeContracts.companyId, companyId));
    }

    const contracts = await query;

    return NextResponse.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

// POST - Create new contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contractSchema.parse(body);

    const userId = body.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Calculate monthly and weekly salary if not provided
    const baseSalary = validatedData.baseSalary;
    const monthlySalary = validatedData.monthlySalary || baseSalary * 30;
    const weeklySalary = validatedData.weeklySalary || baseSalary * 7;

    // Create contract
    const [newContract] = await db
      .insert(employeeContracts)
      .values({
        userId,
        companyId: body.companyId,
        branchId: body.branchId,
        contractNumber: validatedData.contractNumber,
        contractType: validatedData.contractType,
        workRegime: validatedData.workRegime,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        probationPeriodDays: validatedData.probationPeriodDays,
        signatureDate: validatedData.signatureDate ? new Date(validatedData.signatureDate) : undefined,
        baseSalary,
        monthlySalary,
        weeklySalary,
        currency: validatedData.currency,
        hasHealthInsurance: validatedData.hasHealthInsurance,
        hasLifeInsurance: validatedData.hasLifeInsurance,
        hasSavingsFund: validatedData.hasSavingsFund,
        hasFoodVouchers: validatedData.hasFoodVouchers,
        hasTransportationBonus: validatedData.hasTransportationBonus,
        benefitsNotes: validatedData.benefitsNotes,
        workStartTime: validatedData.workStartTime,
        workEndTime: validatedData.workEndTime,
        workDays: validatedData.workDays,
        breakDurationMinutes: validatedData.breakDurationMinutes,
        status: validatedData.status || 'ACTIVE',
        renewalDate: validatedData.renewalDate ? new Date(validatedData.renewalDate) : undefined,
        autoRenew: validatedData.autoRenew,
        contractDocumentId: validatedData.contractDocumentId as any,
        terms: validatedData.terms,
        notes: validatedData.notes,
        createdBy: request.headers.get('x-user-id') || userId,
      })
      .returning();

    // Create salary history entry
    await db.insert(salaryHistory).values({
      userId,
      contractId: newContract.id,
      previousSalary: 0,
      newSalary: baseSalary,
      percentageChange: 100,
      changeType: 'INITIAL',
      reason: 'Initial contract salary',
      effectiveDate: new Date(validatedData.startDate),
      approvedBy: request.headers.get('x-user-id') || userId,
    });

    // Create audit log
    await db.insert(employeeAuditLogs).values({
      userId,
      action: 'CREATE',
      entityType: 'CONTRACT',
      entityId: newContract.id,
      performedBy: request.headers.get('x-user-id') || userId,
      isSensitive: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: newContract,
        message: 'Contract created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 422 }
      );
    }

    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}

// PATCH - Update contract
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('id');

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract id is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = contractSchema.partial().parse(body);

    // Get existing contract
    const existingContracts = await db
      .select()
      .from(employeeContracts)
      .where(eq(employeeContracts.id, contractId))
      .limit(1);

    if (!existingContracts || existingContracts.length === 0) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const existingContract = existingContracts[0];

    // Track changes
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const sensitiveFields = ['baseSalary', 'monthlySalary', 'weeklySalary', 'contractType', 'workRegime'];

    // Calculate salaries if provided
    const baseSalary = validatedData.baseSalary || existingContract.baseSalary;
    const monthlySalary = validatedData.monthlySalary || baseSalary * 30;
    const weeklySalary = validatedData.weeklySalary || baseSalary * 7;

    for (const [key, value] of Object.entries(validatedData)) {
      const oldValue = (existingContract as any)[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        changes.push({
          field: key,
          oldValue,
          newValue: value,
        });
      }
    }

    // Update contract
    const [updatedContract] = await db
      .update(employeeContracts)
      .set({
        ...validatedData,
        baseSalary,
        monthlySalary,
        weeklySalary,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        signatureDate: validatedData.signatureDate ? new Date(validatedData.signatureDate) : undefined,
        renewalDate: validatedData.renewalDate ? new Date(validatedData.renewalDate) : undefined,
        updatedBy: request.headers.get('x-user-id') || existingContract.userId,
        updatedAt: new Date(),
      })
      .where(eq(employeeContracts.id, contractId))
      .returning();

    // If salary changed, create salary history entry
    if (validatedData.baseSalary && validatedData.baseSalary !== existingContract.baseSalary) {
      const percentageChange = Math.round(
        ((validatedData.baseSalary - existingContract.baseSalary) / existingContract.baseSalary) * 100
      );

      await db.insert(salaryHistory).values({
        userId: existingContract.userId,
        contractId: existingContract.id,
        previousSalary: existingContract.baseSalary,
        newSalary: validatedData.baseSalary,
        percentageChange,
        changeType: 'ADJUSTMENT',
        reason: body.reason || 'Salary adjustment',
        effectiveDate: new Date(),
        approvedBy: request.headers.get('x-user-id') || existingContract.userId,
      });
    }

    // Create audit logs
    const performedBy = request.headers.get('x-user-id') || existingContract.userId;
    for (const change of changes) {
      await db.insert(employeeAuditLogs).values({
        userId: existingContract.userId,
        action: 'UPDATE',
        entityType: 'CONTRACT',
        entityId: existingContract.id,
        fieldName: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        performedBy,
        isSensitive: sensitiveFields.includes(change.field),
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedContract,
      message: 'Contract updated successfully',
      changesCount: changes.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 422 }
      );
    }

    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}
