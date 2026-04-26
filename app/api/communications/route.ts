import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employeeCommunications, communicationReadReceipts, messageTemplates, users } from '@/lib/db/schema';
import { eq, and, desc, or, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Validation schemas
const createCommunicationSchema = z.object({
  companyId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  communicationType: z.enum(['MESSAGE', 'ANNOUNCEMENT', 'NOTIFICATION']),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  targetType: z.enum(['INDIVIDUAL', 'DEPARTMENT', 'BRANCH', 'COMPANY']),
  targetIds: z.array(z.string()).optional(),
  isPinned: z.boolean().default(false),
  deliveredVia: z.array(z.enum(['EMAIL', 'WHATSAPP', 'IN_APP'])).default(['IN_APP']),
});

const sendCommunicationSchema = z.object({
  communicationId: z.string().uuid(),
  sentBy: z.string(),
});

const markAsReadSchema = z.object({
  communicationId: z.string().uuid(),
  userId: z.string(),
});

// GET - List communications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const communicationType = searchParams.get('communicationType');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const conditions = [eq(employeeCommunications.companyId, companyId)];

    if (communicationType) {
      conditions.push(eq(employeeCommunications.communicationType, communicationType as any));
    }
    if (status) {
      conditions.push(eq(employeeCommunications.status, status));
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employeeCommunications)
      .where(and(...conditions));

    const communications = await db
      .select({
        id: employeeCommunications.id,
        companyId: employeeCommunications.companyId,
        branchId: employeeCommunications.branchId,
        communicationType: employeeCommunications.communicationType,
        title: employeeCommunications.title,
        content: employeeCommunications.content,
        targetType: employeeCommunications.targetType,
        targetIds: employeeCommunications.targetIds,
        status: employeeCommunications.status,
        isPinned: employeeCommunications.isPinned,
        sentAt: employeeCommunications.sentAt,
        deliveredVia: employeeCommunications.deliveredVia,
        readCount: employeeCommunications.readCount,
        totalRecipients: employeeCommunications.totalRecipients,
        createdAt: employeeCommunications.createdAt,
        createdBy: employeeCommunications.createdBy,
        creatorName: users.name,
      })
      .from(employeeCommunications)
      .leftJoin(users, eq(employeeCommunications.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(employeeCommunications.isPinned), desc(employeeCommunications.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      communications,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}

// POST - Create a new communication
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createCommunicationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.issues },
        { status: 400 }
      );
    }

    const data = validated.data;

    const [newCommunication] = await db
      .insert(employeeCommunications)
      .values({
        ...data,
        status: 'DRAFT',
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(
      { communication: newCommunication, message: 'Communication created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating communication:', error);
    return NextResponse.json(
      { error: 'Failed to create communication' },
      { status: 500 }
    );
  }
}

// PATCH - Send communication or mark as read
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'send' or 'mark-read'

    const body = await request.json();

    if (action === 'send') {
      const validated = sendCommunicationSchema.safeParse(body);

      if (!validated.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validated.error.issues },
          { status: 400 }
        );
      }

      const [updatedCommunication] = await db
        .update(employeeCommunications)
        .set({
          status: 'SENT',
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(employeeCommunications.id, validated.data.communicationId))
        .returning();

      if (!updatedCommunication) {
        return NextResponse.json(
          { error: 'Communication not found' },
          { status: 404 }
        );
      }

      // TODO: Send notifications via email, WhatsApp, etc.

      return NextResponse.json({
        communication: updatedCommunication,
        message: 'Communication sent successfully',
      });
    } else if (action === 'mark-read') {
      const validated = markAsReadSchema.safeParse(body);

      if (!validated.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validated.error.issues },
          { status: 400 }
        );
      }

      // Check if already marked as read
      const [existingReceipt] = await db
        .select()
        .from(communicationReadReceipts)
        .where(
          and(
            eq(communicationReadReceipts.communicationId, validated.data.communicationId),
            eq(communicationReadReceipts.userId, validated.data.userId)
          )
        );

      if (!existingReceipt) {
        // Create read receipt
        await db
          .insert(communicationReadReceipts)
          .values({
            communicationId: validated.data.communicationId,
            userId: validated.data.userId,
          });

        // Update read count
        await db
          .update(employeeCommunications)
          .set({
            readCount: sql`${employeeCommunications.readCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(employeeCommunications.id, validated.data.communicationId));
      }

      return NextResponse.json({
        message: 'Marked as read',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating communication:', error);
    return NextResponse.json(
      { error: 'Failed to update communication' },
      { status: 500 }
    );
  }
}
