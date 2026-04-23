import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employeeAuditLogs, users } from '@/lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

// GET - Get audit logs for an employee or company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const isSensitive = searchParams.get('isSensitive');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId && !companyId) {
      return NextResponse.json(
        { error: 'userId or companyId is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = db
      .select({
        id: employeeAuditLogs.id,
        userId: employeeAuditLogs.userId,
        action: employeeAuditLogs.action,
        entityType: employeeAuditLogs.entityType,
        entityId: employeeAuditLogs.entityId,
        fieldName: employeeAuditLogs.fieldName,
        oldValue: employeeAuditLogs.oldValue,
        newValue: employeeAuditLogs.newValue,
        performedBy: employeeAuditLogs.performedBy,
        performedAt: employeeAuditLogs.performedAt,
        ipAddress: employeeAuditLogs.ipAddress,
        userAgent: employeeAuditLogs.userAgent,
        reason: employeeAuditLogs.reason,
        isSensitive: employeeAuditLogs.isSensitive,
        requiresApproval: employeeAuditLogs.requiresApproval,
        approvedBy: employeeAuditLogs.approvedBy,
        approvedAt: employeeAuditLogs.approvedAt,
        createdAt: employeeAuditLogs.createdAt,
        performedByName: users.name,
        performedByEmail: users.email,
      })
      .from(employeeAuditLogs)
      .leftJoin(users, eq(employeeAuditLogs.performedBy, users.id))
      .orderBy(desc(employeeAuditLogs.performedAt));

    // Apply filters
    if (userId) {
      query = query.where(eq(employeeAuditLogs.userId, userId));
    } else if (companyId) {
      // Get all users in company and filter by their audit logs
      query = query.where(eq(employeeAuditLogs.userId, userId || ''));
    }

    if (entityType) {
      query = query.where(eq(employeeAuditLogs.entityType, entityType));
    }

    if (action) {
      query = query.where(eq(employeeAuditLogs.action, action as any));
    }

    if (isSensitive !== null && isSensitive !== undefined) {
      query = query.where(eq(employeeAuditLogs.isSensitive, isSensitive === 'true'));
    }

    if (startDate) {
      query = query.where(gte(employeeAuditLogs.performedAt, new Date(startDate)));
    }

    if (endDate) {
      query = query.where(lte(employeeAuditLogs.performedAt, new Date(endDate)));
    }

    const logs = await query;

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedLogs = logs.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        page,
        limit,
        total: logs.length,
        totalPages: Math.ceil(logs.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// POST - Create audit log (usually called automatically by other endpoints)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationSchema = z.object({
      userId: z.string(),
      action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT']),
      entityType: z.string(),
      entityId: z.string().optional(),
      fieldName: z.string().optional(),
      oldValue: z.any().optional(),
      newValue: z.any().optional(),
      performedBy: z.string(),
      reason: z.string().optional(),
      isSensitive: z.boolean().optional(),
      requiresApproval: z.boolean().optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    });

    const validatedData = validationSchema.parse(body);

    const [newLog] = await db
      .insert(employeeAuditLogs)
      .values({
        userId: validatedData.userId,
        action: validatedData.action,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        fieldName: validatedData.fieldName,
        oldValue: validatedData.oldValue,
        newValue: validatedData.newValue,
        performedBy: validatedData.performedBy,
        reason: validatedData.reason,
        isSensitive: validatedData.isSensitive || false,
        requiresApproval: validatedData.requiresApproval || false,
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newLog,
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

    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}
