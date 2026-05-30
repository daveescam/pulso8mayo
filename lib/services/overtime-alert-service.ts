import { db } from "@/lib/db";
import { shiftSessions, users, branches, shiftApprovals, notifications } from "@/lib/db/schema";
import { eq, and, gte, lte, gt, inArray } from "drizzle-orm";
import { whatsappClient } from "@/lib/whatsapp/client-factory";
import { NotificationDispatcher } from "./notification-dispatcher";

export interface OvertimeAlert {
    userId: string;
    userName: string;
    branchId: string;
    branchName: string;
    overtimeMinutes: number;
    shiftDate: Date;
    alertType: 'THRESHOLD' | 'EXCESSIVE' | 'DAILY_LIMIT';
    message: string;
}

export interface OvertimeThreshold {
    dailyMinutes: number;
    weeklyMinutes: number;
    alertThresholdMinutes: number;
}

const DEFAULT_THRESHOLDS: OvertimeThreshold = {
    dailyMinutes: 120, // 2 hours daily max
    weeklyMinutes: 360, // 6 hours weekly max
    alertThresholdMinutes: 30 // Alert after 30 min overtime
};

export class OvertimeAlertService {
    /**
     * Check for overtime and send alerts to managers
     */
    static async checkAndAlertOvertime(sessionId: string): Promise<void> {
        const session = await db.query.shiftSessions.findFirst({
            where: eq(shiftSessions.id, sessionId)
        });

        if (!session || !session.overtimeMinutes || session.overtimeMinutes === 0) {
            return;
        }

        // Get user and branch info
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.userId)
        });

        if (!user) return;

        const branch = user.branchId
            ? await db.query.branches.findFirst({ where: eq(branches.id, user.branchId) })
            : null;

        // Get thresholds (could be customized per company/branch)
        const thresholds = DEFAULT_THRESHOLDS;

        // Determine alert type
        let alertType: OvertimeAlert['alertType'] = 'THRESHOLD';
        if (session.overtimeMinutes > thresholds.dailyMinutes) {
            alertType = 'DAILY_LIMIT';
        } else if (session.overtimeMinutes > thresholds.alertThresholdMinutes) {
            alertType = 'THRESHOLD';
        }

        // Check weekly overtime
        const weeklyOvertime = await this.calculateWeeklyOvertime(session.userId, session.startedAt);
        if (weeklyOvertime > thresholds.weeklyMinutes) {
            alertType = 'EXCESSIVE';
        }

        // Create alert message
        const alert: OvertimeAlert = {
            userId: session.userId,
            userName: user.name || user.email,
            branchId: session.branchId,
            branchName: branch?.name || 'Unknown',
            overtimeMinutes: session.overtimeMinutes,
            shiftDate: session.startedAt,
            alertType,
            message: this.buildAlertMessage(user.name || user.email, session.overtimeMinutes, alertType, weeklyOvertime)
        };

        // Send alert to managers
        await this.notifyManagers(alert, branch?.id);

        // Create approval request if needed
        if (session.overtimeMinutes > thresholds.alertThresholdMinutes) {
            await this.createOvertimeApproval(session, alert);
        }
    }

    /**
     * Calculate weekly overtime for a user
     */
    static async calculateWeeklyOvertime(userId: string, referenceDate: Date): Promise<number> {
        const startOfWeek = new Date(referenceDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const sessions = await db.query.shiftSessions.findMany({
            where: and(
                eq(shiftSessions.userId, userId),
                gte(shiftSessions.startedAt, startOfWeek),
                lte(shiftSessions.startedAt, endOfWeek),
                eq(shiftSessions.status, 'COMPLETED')
            )
        });

        const totalWorkMinutes = sessions.reduce((sum, s) => sum + (s.totalWorkMinutes || 0), 0);
        const weeklyLimit = 48 * 60; // 48 hours

        return Math.max(0, totalWorkMinutes - weeklyLimit);
    }

    /**
     * Build alert message based on type
     */
    private static buildAlertMessage(
        employeeName: string,
        overtimeMinutes: number,
        alertType: OvertimeAlert['alertType'],
        weeklyOvertime: number
    ): string {
        const hours = Math.floor(overtimeMinutes / 60);
        const mins = overtimeMinutes % 60;

        switch (alertType) {
            case 'DAILY_LIMIT':
                return `⚠️ *Límite Diario Excedido*\n\n${employeeName} ha excedido el límite diario de horas extras.\n\n📊 Overtime hoy: ${hours}h ${mins}m\n📊 Overtime semanal: ${Math.floor(weeklyOvertime / 60)}h ${weeklyOvertime % 60}m\n\n⚠️ Requiere aprobación inmediata.`;

            case 'EXCESSIVE':
                return `🚨 *Overtime Excesivo*\n\n${employeeName} ha acumulado overtime excesivo en la semana.\n\n📊 Overtime hoy: ${hours}h ${mins}m\n📊 Overtime semanal: ${Math.floor(weeklyOvertime / 60)}h ${weeklyOvertime % 60}m\n\n⚠️ Revisar asignación de turnos.`;

            default:
                return `⏰ *Overtime Detectado*\n\n${employeeName} registró ${hours}h ${mins}m de tiempo extra.\n\n📊 Requiere aprobación del manager.`;
        }
    }

    /**
     * Notify managers about overtime alert
     */
    private static async notifyManagers(alert: OvertimeAlert, branchId?: string): Promise<void> {
        const managers = await db.query.users.findMany({
            where: and(
                eq(users.branchId, branchId || ''),
                inArray(users.role, ['ADMIN', 'GERENTE', 'SUPERVISOR'])
            )
        });

        const payloads = managers.map((manager) => ({
            userId: manager.id,
            title: `Alerta de Horas Extra: ${alert.userName}`,
            message: alert.message,
            type: 'warning' as const,
            eventType: 'incident' as const,
            actionUrl: `/dashboard/labor/overtime`,
            actionLabel: 'Ver horas extra',
            metadata: {
                incidentTitle: `Horas extra de ${alert.userName}`,
                severity: alert.alertType === 'EXCESSIVE' ? 'CRITICA' : alert.alertType === 'DAILY_LIMIT' ? 'ALTA' : 'MEDIA',
                description: alert.message,
            },
        }));

        if (payloads.length > 0) {
            await NotificationDispatcher.sendBatchNotifications(payloads);
        }

        for (const manager of managers) {
            if (manager.whatsappPhone) {
                try {
                    await whatsappClient.sendMessage({
                        sessionId: 'default',
                        to: manager.whatsappPhone,
                        message: alert.message
                    });
                } catch (error) {
                    console.error(`Error sending overtime alert to manager ${manager.id}:`, error);
                }
            }
        }
    }

    /**
     * Create overtime approval request
     */
    private static async createOvertimeApproval(session: any, alert: OvertimeAlert): Promise<void> {
        // Check if approval already exists
        const existing = await db.query.shiftApprovals.findFirst({
            where: and(
                eq(shiftApprovals.shiftSessionId, session.id),
                eq(shiftApprovals.approvalType, 'OVERTIME')
            )
        });

        if (existing) return;

        const branch = await db.query.branches.findFirst({
            where: eq(branches.id, session.branchId),
            columns: { companyId: true }
        });
        const companyId = branch?.companyId || session.branchId;

        await db.insert(shiftApprovals).values({
            companyId,
            branchId: session.branchId,
            approvalType: 'OVERTIME',
            requestedBy: session.userId,
            requestedFor: session.userId,
            title: `Overtime - ${alert.overtimeMinutes} minutos`,
            description: alert.message,
            shiftSessionId: session.id,
            overtimeMinutes: alert.overtimeMinutes,
            durationMinutes: session.totalWorkMinutes,
            status: 'PENDING'
        });

        // Mark session as requiring approval
        await db.update(shiftSessions).set({
            requiresApproval: true
        }).where(eq(shiftSessions.id, session.id));
    }

    /**
     * Get overtime alerts for a date range
     */
    static async getOvertimeAlerts(
        branchId: string,
        startDate: Date,
        endDate: Date
    ): Promise<OvertimeAlert[]> {
        const sessions = await db.query.shiftSessions.findMany({
            where: and(
                eq(shiftSessions.branchId, branchId),
                gte(shiftSessions.startedAt, startDate),
                lte(shiftSessions.startedAt, endDate),
                eq(shiftSessions.status, 'COMPLETED'),
                gt(shiftSessions.overtimeMinutes, 0)
            ),
            with: {
                // Include user data
            }
        });

        const alerts: OvertimeAlert[] = [];

        for (const session of sessions) {
            const user = await db.query.users.findFirst({
                where: eq(users.id, session.userId)
            });

            if (!user) continue;

            alerts.push({
                userId: session.userId,
                userName: user.name || user.email,
                branchId: session.branchId,
                branchName: branchId,
                overtimeMinutes: session.overtimeMinutes,
                shiftDate: session.startedAt,
                alertType: session.overtimeMinutes > DEFAULT_THRESHOLDS.dailyMinutes
                    ? 'DAILY_LIMIT'
                    : 'THRESHOLD',
                message: ''
            });
        }

        return alerts;
    }

    /**
     * Get employees with excessive weekly overtime
     */
    static async getEmployeesWithExcessiveOvertime(branchId?: string): Promise<Array<{
        userId: string;
        userName: string;
        weeklyOvertimeMinutes: number;
        dailyOvertimeMinutes: number;
    }>> {
        const conditions = [
            eq(shiftSessions.status, 'COMPLETED'),
            gte(shiftSessions.startedAt, new Date(new Date().setDate(new Date().getDate() - 7)))
        ];

        if (branchId) {
            conditions.push(eq(shiftSessions.branchId, branchId));
        }

        const sessions = await db.query.shiftSessions.findMany({
            where: and(...conditions)
        });

        // Group by user
        const userOvertime: Record<string, number> = {};
        sessions.forEach(session => {
            if (!userOvertime[session.userId]) {
                userOvertime[session.userId] = 0;
            }
            userOvertime[session.userId] += session.overtimeMinutes || 0;
        });

        // Filter users with excessive overtime
        const excessiveUsers = Object.entries(userOvertime)
            .filter(([_, minutes]) => minutes > DEFAULT_THRESHOLDS.weeklyMinutes);

        const results = [];
        for (const [userId, weeklyOvertime] of excessiveUsers) {
            const user = await db.query.users.findFirst({
                where: eq(users.id, userId)
            });

            if (user) {
                results.push({
                    userId,
                    userName: user.name || user.email,
                    weeklyOvertimeMinutes: weeklyOvertime,
                    dailyOvertimeMinutes: 0 // Would need to calculate separately
                });
            }
        }

        return results;
    }
}
