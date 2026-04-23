import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employeeCommunications, communicationReadReceipts, users } from '@/lib/db/schema';
import { eq, and, desc, or, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { WhatsAppService } from '@/lib/services/whatsapp-service';

const createAnnouncementSchema = z.object({
  companyId: z.string().uuid(),
  branchId: z.string().uuid().optional().nullable(),
  communicationType: z.enum(['MESSAGE', 'ANNOUNCEMENT', 'NOTIFICATION']).default('ANNOUNCEMENT'),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  targetType: z.enum(['INDIVIDUAL', 'DEPARTMENT', 'BRANCH', 'COMPANY']).default('COMPANY'),
  targetIds: z.array(z.string()).optional(),
  isPinned: z.boolean().default(false),
  deliveredVia: z.array(z.string()).optional(),
  createdBy: z.string(),
});

// GET - List announcements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const branchId = searchParams.get('branchId');
    const type = searchParams.get('type');
    const pinnedOnly = searchParams.get('pinnedOnly');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const conditions = [eq(employeeCommunications.companyId, companyId)];

    if (branchId) conditions.push(eq(employeeCommunications.branchId, branchId));
    if (type) conditions.push(eq(employeeCommunications.communicationType, type));
    if (pinnedOnly === 'true') conditions.push(eq(employeeCommunications.isPinned, true));

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employeeCommunications)
      .where(and(...conditions));

    const announcements = await db
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
        createdBy: employeeCommunications.createdBy,
        createdAt: employeeCommunications.createdAt,
        authorName: users.name,
      })
      .from(employeeCommunications)
      .leftJoin(users, eq(employeeCommunications.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(employeeCommunications.isPinned), desc(employeeCommunications.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      announcements,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// POST - Create announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createAnnouncementSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      );
    }

    const data = validated.data;

    const [newAnnouncement] = await db
      .insert(employeeCommunications)
      .values({
        ...data,
        status: 'SENT',
        sentAt: new Date(),
      })
      .returning();

    // Trigger WhatsApp notification if requested
    if (data.deliveredVia?.includes('WHATSAPP')) {
      const conditionMatches = [];
      conditionMatches.push(eq(users.companyId, data.companyId));
      if (data.targetType === 'BRANCH' && data.targetIds && data.targetIds.length > 0) {
        conditionMatches.push(inArray(users.branchId, data.targetIds));
      }
      
      const targetUsers = await db
        .select({
          id: users.id,
          name: users.name,
          phone: users.phone,
          whatsappPhone: users.whatsappPhone,
        })
        .from(users)
        .where(and(...conditionMatches));

      const messageContent = `🔔 *Pulso - ${data.communicationType === 'MESSAGE' ? 'Nuevo Mensaje' : 'Nuevo Anuncio'}*
${data.title}

${data.content}

_No respondas a este mensaje. Es enviado automáticamente por tu empleador._`;

      // Dispatch without blocking
      Promise.all(
        targetUsers.map(async (u) => {
          const numberToUse = u.whatsappPhone || u.phone;
          if (numberToUse) {
            try {
              await WhatsAppService.sendMessage(numberToUse, messageContent);
            } catch (err) {
              console.error(`Failed sending WhatsApp to ${numberToUse}`, err);
            }
          }
        })
      ).catch((err) => console.error("Error in background WhatsApp dispatch:", err));
    }

    return NextResponse.json(
      { announcement: newAnnouncement, message: 'Announcement created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

// PATCH - Update announcement (pin/unpin, edit, archive)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const announcementId = searchParams.get('id');

    if (!announcementId) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(employeeCommunications)
      .set(updateData)
      .where(eq(employeeCommunications.id, announcementId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json({ announcement: updated, message: 'Updated successfully' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

// DELETE - Delete announcement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const announcementId = searchParams.get('id');

    if (!announcementId) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const deleted = await db
      .delete(employeeCommunications)
      .where(eq(employeeCommunications.id, announcementId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
