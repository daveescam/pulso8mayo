import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employeeOnboarding, onboardingSteps, employeeOffboarding, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// Onboarding validation schema
const onboardingSchema = z.object({
  userId: z.string(),
  companyId: z.string(),
  branchId: z.string().optional(),
  startDate: z.string(),
  targetEndDate: z.string().optional(),
  assignedBuddyId: z.string().optional(),
  assignedMentorId: z.string().optional(),
  notes: z.string().optional(),
  hrNotes: z.string().optional(),
});

// Offboarding validation schema
const offboardingSchema = z.object({
  userId: z.string(),
  companyId: z.string(),
  branchId: z.string().optional(),
  reason: z.enum([
    'VOLUNTARY_RESIGNATION',
    'TERMINATION_WITH_CAUSE',
    'TERMINATION_WITHOUT_CAUSE',
    'CONTRACT_EXPIRED',
    'RETIREMENT',
    'DEATH',
    'MUTUAL_AGREEMENT',
    'OTHER'
  ]),
  reasonDetails: z.string().optional(),
  resignationDate: z.string().optional(),
  lastWorkingDay: z.string(),
  finalPayDate: z.string().optional(),
  accruedVacationDays: z.number().optional(),
  vacationPay: z.number().optional(),
  seniorityBonus: z.number().optional(),
  severancePay: z.number().optional(),
  finalPayAmount: z.number().optional(),
  deductions: z.number().optional(),
  assetsToReturn: z.array(z.string()).optional(),
  exitInterviewNotes: z.string().optional(),
  hrNotes: z.string().optional(),
  notes: z.string().optional(),
});

// GET - Get onboarding/offboarding records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type'); // 'onboarding' or 'offboarding'

    if (!companyId && !userId) {
      return NextResponse.json(
        { error: 'companyId or userId is required' },
        { status: 400 }
      );
    }

    const result: any = {};

    // Get onboarding records
    if (!type || type === 'onboarding') {
      let onboardingQuery = db
        .select()
        .from(employeeOnboarding)
        .orderBy(desc(employeeOnboarding.startDate));

      if (userId) {
        onboardingQuery = onboardingQuery.where(eq(employeeOnboarding.userId, userId));
      } else if (companyId) {
        onboardingQuery = onboardingQuery.where(eq(employeeOnboarding.companyId, companyId));
      }

      const onboardings = await onboardingQuery;

      // Get steps for each onboarding
      for (const onboarding of onboardings) {
        const steps = await db
          .select()
          .from(onboardingSteps)
          .where(eq(onboardingSteps.onboardingId, onboarding.id))
          .orderBy(onboardingSteps.dueDate);

        (onboarding as any).steps = steps;
      }

      result.onboardings = onboardings;
    }

    // Get offboarding records
    if (!type || type === 'offboarding') {
      let offboardingQuery = db
        .select()
        .from(employeeOffboarding)
        .orderBy(desc(employeeOffboarding.createdAt));

      if (userId) {
        offboardingQuery = offboardingQuery.where(eq(employeeOffboarding.userId, userId));
      } else if (companyId) {
        offboardingQuery = offboardingQuery.where(eq(employeeOffboarding.companyId, companyId));
      }

      result.offboardings = await offboardingQuery;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching onboarding/offboarding records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

// POST - Create onboarding
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = onboardingSchema.parse(body);

    // Check if onboarding already exists
    const existingOnboarding = await db
      .select()
      .from(employeeOnboarding)
      .where(eq(employeeOnboarding.userId, validatedData.userId))
      .limit(1);

    if (existingOnboarding && existingOnboarding.length > 0) {
      return NextResponse.json(
        { error: 'Onboarding already exists for this user' },
        { status: 409 }
      );
    }

    // Create onboarding
    const [newOnboarding] = await db
      .insert(employeeOnboarding)
      .values({
        userId: validatedData.userId,
        companyId: validatedData.companyId,
        branchId: validatedData.branchId,
        startDate: new Date(validatedData.startDate),
        targetEndDate: validatedData.targetEndDate ? new Date(validatedData.targetEndDate) : undefined,
        assignedBuddyId: validatedData.assignedBuddyId,
        assignedMentorId: validatedData.assignedMentorId,
        notes: validatedData.notes,
        hrNotes: validatedData.hrNotes,
        status: 'IN_PROGRESS',
        createdBy: request.headers.get('x-user-id') || validatedData.userId,
        updatedBy: request.headers.get('x-user-id') || validatedData.userId,
      })
      .returning();

    // Create default onboarding steps
    const defaultSteps = [
      { name: 'Complete personal information', category: 'DOCUMENTS' },
      { name: 'Upload identification documents', category: 'DOCUMENTS' },
      { name: 'Sign employment contract', category: 'COMPLIANCE' },
      { name: 'Complete tax forms', category: 'COMPLIANCE' },
      { name: 'Provide bank information', category: 'SETUP' },
      { name: 'Attend orientation session', category: 'ORIENTATION' },
      { name: 'Complete safety training', category: 'TRAINING' },
      { name: 'Receive uniform and equipment', category: 'SETUP' },
      { name: 'Meet team members', category: 'ORIENTATION' },
      { name: 'Review employee handbook', category: 'ORIENTATION' },
    ];

    const stepsToCreate = defaultSteps.map((step, index) => ({
      onboardingId: newOnboarding.id,
      stepName: step.name,
      stepCategory: step.category,
      status: 'PENDING' as const,
      dueDate: new Date(new Date(validatedData.startDate).getTime() + (index + 1) * 24 * 60 * 60 * 1000),
    }));

    if (stepsToCreate.length > 0) {
      await db.insert(onboardingSteps).values(stepsToCreate);

      // Update totals
      await db
        .update(employeeOnboarding)
        .set({
          totalSteps: stepsToCreate.length,
          completedSteps: 0,
          progressPercentage: 0,
        })
        .where(eq(employeeOnboarding.id, newOnboarding.id));
    }

    return NextResponse.json(
      {
        success: true,
        data: newOnboarding,
        message: 'Onboarding created successfully',
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

    console.error('Error creating onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding' },
      { status: 500 }
    );
  }
}

// PATCH - Update onboarding step status
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'onboarding-step') {
      const body = await request.json();
      const { stepId, status, completedBy } = body;

      if (!stepId || !status) {
        return NextResponse.json(
          { error: 'stepId and status are required' },
          { status: 400 }
        );
      }

      // Update step
      const [updatedStep] = await db
        .update(onboardingSteps)
        .set({
          status,
          completedDate: status === 'COMPLETED' ? new Date() : undefined,
          completedBy,
          updatedAt: new Date(),
        })
        .where(eq(onboardingSteps.id, stepId))
        .returning();

      if (!updatedStep) {
        return NextResponse.json(
          { error: 'Step not found' },
          { status: 404 }
        );
      }

      // Update onboarding progress
      const onboarding = await db
        .select()
        .from(employeeOnboarding)
        .where(eq(employeeOnboarding.id, updatedStep.onboardingId))
        .limit(1);

      if (onboarding && onboarding.length > 0) {
        const completedSteps = await db
          .select()
          .from(onboardingSteps)
          .where(
            and(
              eq(onboardingSteps.onboardingId, updatedStep.onboardingId),
              eq(onboardingSteps.status, 'COMPLETED')
            )
          );

        const progressPercentage = Math.round(
          (completedSteps.length / onboarding[0].totalSteps) * 100
        );

        await db
          .update(employeeOnboarding)
          .set({
            completedSteps: completedSteps.length,
            progressPercentage,
            status: progressPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
            completedDate: progressPercentage === 100 ? new Date() : undefined,
            updatedAt: new Date(),
          })
          .where(eq(employeeOnboarding.id, updatedStep.onboardingId));
      }

      return NextResponse.json({
        success: true,
        data: updatedStep,
        message: 'Step updated successfully',
      });
    }

    // Update offboarding
    if (type === 'offboarding') {
      const body = await request.json();
      const validatedData = offboardingSchema.partial().parse(body);
      const offboardingId = body.offboardingId;

      if (!offboardingId) {
        return NextResponse.json(
          { error: 'offboardingId is required' },
          { status: 400 }
        );
      }

      const [updatedOffboarding] = await db
        .update(employeeOffboarding)
        .set({
          ...validatedData,
          resignationDate: validatedData.resignationDate ? new Date(validatedData.resignationDate) : undefined,
          lastWorkingDay: validatedData.lastWorkingDay ? new Date(validatedData.lastWorkingDay) : undefined,
          finalPayDate: validatedData.finalPayDate ? new Date(validatedData.finalPayDate) : undefined,
          assetsReturnDate: validatedData.assetsReturnDate ? new Date(validatedData.assetsReturnDate as any) : undefined,
          exitInterviewDate: validatedData.exitInterviewDate ? new Date(validatedData.exitInterviewDate as any) : undefined,
          accessRevokedDate: validatedData.accessRevokedDate ? new Date(validatedData.accessRevokedDate as any) : undefined,
          completedDate: validatedData.status === 'COMPLETED' ? new Date() : undefined,
          updatedBy: request.headers.get('x-user-id'),
          updatedAt: new Date(),
        })
        .where(eq(employeeOffboarding.id, offboardingId))
        .returning();

      return NextResponse.json({
        success: true,
        data: updatedOffboarding,
        message: 'Offboarding updated successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 422 }
      );
    }

    console.error('Error updating record:', error);
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    );
  }
}

// POST - Create offboarding (separate endpoint)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = offboardingSchema.parse(body);

    // Check if offboarding already exists
    const existingOffboarding = await db
      .select()
      .from(employeeOffboarding)
      .where(eq(employeeOffboarding.userId, validatedData.userId))
      .limit(1);

    if (existingOffboarding && existingOffboarding.length > 0) {
      return NextResponse.json(
        { error: 'Offboarding already exists for this user' },
        { status: 409 }
      );
    }

    // Create offboarding
    const [newOffboarding] = await db
      .insert(employeeOffboarding)
      .values({
        userId: validatedData.userId,
        companyId: validatedData.companyId,
        branchId: validatedData.branchId,
        reason: validatedData.reason,
        reasonDetails: validatedData.reasonDetails,
        resignationDate: validatedData.resignationDate ? new Date(validatedData.resignationDate) : undefined,
        lastWorkingDay: new Date(validatedData.lastWorkingDay),
        finalPayDate: validatedData.finalPayDate ? new Date(validatedData.finalPayDate) : undefined,
        accruedVacationDays: validatedData.accruedVacationDays || 0,
        vacationPay: validatedData.vacationPay || 0,
        seniorityBonus: validatedData.seniorityBonus || 0,
        severancePay: validatedData.severancePay || 0,
        finalPayAmount: validatedData.finalPayAmount || 0,
        deductions: validatedData.deductions || 0,
        assetsToReturn: validatedData.assetsToReturn as any,
        exitInterviewNotes: validatedData.exitInterviewNotes,
        hrNotes: validatedData.hrNotes,
        notes: validatedData.notes,
        status: 'IN_PROGRESS',
        createdBy: request.headers.get('x-user-id') || validatedData.userId,
        updatedBy: request.headers.get('x-user-id') || validatedData.userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newOffboarding,
        message: 'Offboarding created successfully',
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

    console.error('Error creating offboarding:', error);
    return NextResponse.json(
      { error: 'Failed to create offboarding' },
      { status: 500 }
    );
  }
}
