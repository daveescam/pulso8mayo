/**
 * Break Reminder Service
 * 
 * Automatically reminds employees to take breaks
 * when they've worked 4+ hours without a pause
 */

import { db } from '@/lib/db';
import { shiftSessions, breakLogs, breakReminderLogs, users, branches, breakComplianceRules } from '@/lib/db/schema';
import { eq, and, lte, gte, isNull, sql } from 'drizzle-orm';
import { NotificationDispatcher } from '@/lib/services/notification-dispatcher';

export interface BreakReminderResult {
    success: boolean;
    remindersSent: number;
    exceededBreaks: number;
    errors?: string[];
}

export class BreakReminderService {
    /**
     * Check and send break reminders for active sessions
     */
    static async checkAndSendReminders(): Promise<BreakReminderResult> {
        try {
            console.log('[Break Reminder] Checking for sessions needing break reminders...');

            const errors: string[] = [];
            let remindersSent = 0;

            // Get active sessions that started 4+ hours ago without recent breaks
            const sessionsNeedingReminders = await this.getSessionsNeedingReminders();

            console.log(`[Break Reminder] Found ${sessionsNeedingReminders.length} sessions needing reminders`);

            // Send reminders for each session
            for (const session of sessionsNeedingReminders) {
                try {
                    await this.sendBreakReminder(session);
                    remindersSent++;
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    errors.push(`Failed to send reminder for session ${session.id}: ${errorMsg}`);
                    console.error(`[Break Reminder] Error for session ${session.id}:`, error);
                }
            }

            // Check for exceeded breaks
            const exceededBreaks = await this.checkExceededBreaks();

            console.log(`[Break Reminder] Reminders sent: ${remindersSent}, Exceeded breaks: ${exceededBreaks}`);

            return {
                success: true,
                remindersSent,
                exceededBreaks,
                errors: errors.length > 0 ? errors : undefined,
            };
        } catch (error) {
            console.error('[Break Reminder] Error in checkAndSendReminders:', error);
            return {
                success: false,
                remindersSent: 0,
                exceededBreaks: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }

    /**
     * Get sessions that need break reminders
     */
    private static async getSessionsNeedingReminders() {
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago

        return db
            .select({
                id: shiftSessions.id,
                userId: shiftSessions.userId,
                userName: users.name,
                userEmail: users.email,
                userPhone: users.phone,
                branchId: shiftSessions.branchId,
                branchName: branches.name,
                startedAt: shiftSessions.startedAt,
                totalWorkMinutes: shiftSessions.totalWorkMinutes,
                totalBreakMinutes: shiftSessions.totalBreakMinutes,
                breakReminderSent: shiftSessions.breakReminderSent,
            })
            .from(shiftSessions)
            .leftJoin(users, eq(shiftSessions.userId, users.id))
            .leftJoin(branches, eq(shiftSessions.branchId, branches.id))
            .where(
                and(
                    eq(shiftSessions.status, 'ACTIVE'),
                    lte(shiftSessions.startedAt, fourHoursAgo),
                    eq(shiftSessions.breakReminderSent, false)
                )
            );
    }

    /**
     * Send break reminder to user
     */
    private static async sendBreakReminder(session: any) {
        console.log(`[Break Reminder] Sending reminder to ${session.userName} (${session.userId})`);

        // Send notification
        await NotificationDispatcher.sendNotification({
            userId: session.userId,
            title: '⏰ Recordatorio de Descanso',
            message: `Has trabajado 4 horas continuas. Es tiempo de tomar un descanso de al menos 30 minutos.`,
            type: 'warning',
            eventType: 'shift_reminder',
            actionUrl: `/dashboard/labor/breaks`,
            actionLabel: 'Registrar Pausa',
            metadata: {
                userName: session.userName,
                branchName: session.branchName,
                hoursWorked: 4,
            },
        });

        // Log the reminder
        await db
            .insert(breakReminderLogs)
            .values({
                sessionId: session.id,
                userId: session.userId,
                branchId: session.branchId,
                reminderType: 'BREAK_DUE',
                message: `Recordatorio: ${session.userName} ha trabajado 4 horas sin descanso`,
                channel: 'IN_APP',
                triggeredAt: new Date(),
                sentAt: new Date(),
            });

    // Mark reminder as sent in session
    await db
      .update(shiftSessions)
      .set({
        breakReminderSent: true,
      })
      .where(eq(shiftSessions.id, session.id));
    }

    /**
     * Check for breaks that exceeded allowed time
     */
    private static async checkExceededBreaks(): Promise<number> {
        try {
            // Get breaks that exceeded 30 minutes in the last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const exceededBreaks = await db
                .select({
                    id: breakLogs.id,
                    sessionId: breakLogs.sessionId,
                    userId: sql<string>`ss.user_id`,
                    branchId: sql<string>`ss.branch_id`,
                    startTime: breakLogs.startTime,
                    endTime: breakLogs.endTime,
                    durationMinutes: breakLogs.durationMinutes,
                    userName: users.name,
                    userEmail: users.email,
                })
                .from(breakLogs)
                .leftJoin(shiftSessions, eq(breakLogs.sessionId, shiftSessions.id))
                .leftJoin(users, eq(shiftSessions.userId, users.id))
                .where(
                    and(
                        gte(breakLogs.startTime, twentyFourHoursAgo),
                        sql`EXTRACT(EPOCH FROM (${breakLogs.endTime} - ${breakLogs.startTime})) > 1800`, // 30 minutes
                        eq(breakLogs.isCompliant, false)
                    )
                );

            console.log(`[Break Reminder] Found ${exceededBreaks.length} exceeded breaks`);

            // Send alerts for exceeded breaks
            for (const break_ of exceededBreaks) {
                try {
                    await NotificationDispatcher.sendNotification({
                        userId: break_.userId,
                        title: '⚠️ Pausa Excedida',
                        message: `Tu pausa duró ${break_.durationMinutes} minutos, excediendo el límite de 30 minutos.`,
                        type: 'warning',
                        eventType: 'incident',
                        actionUrl: `/dashboard/labor/breaks`,
                        actionLabel: 'Ver Detalles',
                        metadata: {
                            userName: break_.userName,
                            breakDuration: break_.durationMinutes,
                            maxDuration: 30,
                        },
                    });

                    // Update break log
                    await db
                        .update(breakLogs)
                        .set({
                            isCompliant: false,
                            complianceNotes: `Pausa excedida: ${break_.durationMinutes} minutos (máx 30)`,
                        })
                        .where(eq(breakLogs.id, break_.id));
                } catch (error) {
                    console.error(`[Break Reminder] Error processing exceeded break ${break_.id}:`, error);
                }
            }

            return exceededBreaks.length;
        } catch (error) {
            console.error('[Break Reminder] Error in checkExceededBreaks:', error);
            return 0;
        }
    }

    /**
     * Send WhatsApp break reminder
     */
    static async sendWhatsAppReminder(userId: string, phoneNumber: string, hoursWorked: number) {
        try {
            await NotificationDispatcher.sendNotification({
                userId,
                title: '⏰ Recordatorio de Descanso',
                message: `Has trabajado ${hoursWorked} horas continuas. Es tiempo de tomar un descanso.`,
                type: 'warning',
                eventType: 'shift_reminder',
                metadata: {
                    hoursWorked,
                },
            });

            console.log(`[Break Reminder] WhatsApp reminder sent to ${phoneNumber}`);
        } catch (error) {
            console.error('[Break Reminder] Error sending WhatsApp reminder:', error);
            throw error;
        }
    }
}
