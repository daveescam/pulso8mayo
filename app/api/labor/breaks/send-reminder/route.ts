import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { breakReminderLogs, shiftSessions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NotificationDispatcher } from '@/lib/services/notification-dispatcher';
import { headers } from 'next/headers';

/**
 * POST /api/labor/breaks/send-reminder
 * Send WhatsApp break reminder to employee
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { userId, phone } = body;

        if (!userId || !phone) {
            return NextResponse.json(
                { error: 'userId y phone son requeridos' },
                { status: 400 }
            );
        }

        // Get user's active session
        const activeSession = await db.query.shiftSessions.findFirst({
            where: and(
                eq(shiftSessions.userId, userId),
                eq(shiftSessions.status, 'ACTIVE')
            ),
        });

        if (!activeSession) {
            return NextResponse.json(
                { error: 'El empleado no tiene un turno activo' },
                { status: 400 }
            );
        }

        // Send WhatsApp reminder
        await NotificationDispatcher.sendNotification({
            userId,
            title: '⏰ Recordatorio de Descanso',
            message: `Has trabajado varias horas continuas. Es tiempo de tomar un descanso de al menos 30 minutos.\n\nEnvía "pausa" por WhatsApp para registrar tu break.`,
            type: 'warning',
            eventType: 'shift_reminder',
            actionUrl: `/dashboard/labor/breaks`,
            actionLabel: 'Ver Detalles',
            metadata: {
                hoursWorked: Math.round((activeSession.totalWorkMinutes || 0) / 60),
                branchName: activeSession.branchId,
            },
        });

        // Log the reminder
        await db.insert(breakReminderLogs).values({
            sessionId: activeSession.id,
            userId,
            branchId: activeSession.branchId,
            reminderType: 'BREAK_DUE',
            message: `Recordatorio manual enviado a ${userId}`,
            channel: 'WHATSAPP',
            triggeredAt: new Date(),
            sentAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: 'Recordatorio enviado exitosamente',
        });
    } catch (error) {
        console.error('Error sending break reminder:', error);
        return NextResponse.json(
            { error: 'Error al enviar recordatorio' },
            { status: 500 }
        );
    }
}
