import { db } from '@/lib/db';
import { plannedShifts, users, branches } from '@/lib/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { NotificationDispatcher } from '@/lib/services/notification-dispatcher';
import { format, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Send shift reminders to employees with shifts in the next 24 hours.
 * Runs daily (recommended: 18:00 for next-day reminders).
 *
 * This job:
 * 1. Finds planned shifts for the next calendar day
 * 2. Sends WhatsApp + in-app reminders to each employee
 */
export async function sendShiftReminders() {
    console.log('[Cron] Starting shift reminders...');

    try {
        const today = new Date();
        const tomorrow = addDays(today, 1);
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
        const dayAfterStr = format(addDays(today, 2), 'yyyy-MM-dd');

        const upcomingShifts = await db.query.plannedShifts.findMany({
            where: and(
                eq(plannedShifts.status, 'PUBLISHED'),
                gte(plannedShifts.shiftDate, tomorrowStr),
                lte(plannedShifts.shiftDate, dayAfterStr),
            ),
            orderBy: (shifts, { asc }) => [asc(shifts.shiftDate), asc(shifts.startTime)],
        });

        console.log(`[Cron] Found ${upcomingShifts.length} upcoming shifts for tomorrow`);

        if (upcomingShifts.length === 0) {
            return { success: true, sent: 0 };
        }

        let successCount = 0;

        for (const shift of upcomingShifts) {
            try {
                const [shiftUser, shiftBranch] = await Promise.all([
                    db.query.users.findFirst({ where: eq(users.id, shift.userId) }),
                    db.query.branches.findFirst({ where: eq(branches.id, shift.branchId) }),
                ]);

                if (!shiftUser) continue;

                const shiftDate = parseISO(shift.shiftDate);
                const shiftDateStr = format(shiftDate, "EEEE d 'de' MMMM", { locale: es });

                await NotificationDispatcher.sendNotification({
                    userId: shift.userId,
                    title: 'Recordatorio de Turno',
                    message: `Tienes turno mañana: ${shift.role} de ${shift.startTime} a ${shift.endTime}`,
                    type: 'info',
                    eventType: 'shift_reminder',
                    actionUrl: `/dashboard/labor/shifts`,
                    actionLabel: 'Ver turnos',
                    metadata: {
                        shiftDate: shiftDateStr,
                        shiftTime: `${shift.startTime} - ${shift.endTime}`,
                        branchName: shiftBranch?.name || 'Sucursal',
                    },
                });

                successCount++;
            } catch (error) {
                console.error(`[Cron] Failed to send shift reminder for shift ${shift.id}:`, error);
            }
        }

        console.log(`[Cron] Shift reminders complete. Sent: ${successCount}`);
        return { success: true, sent: successCount };

    } catch (error) {
        console.error('[Cron] Fatal error in sendShiftReminders:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
