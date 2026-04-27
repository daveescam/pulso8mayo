/**
 * LFT Violation Reporter
 * 
 * Detects and reports Mexican Labor Law (LFT) violations
 * from shift sessions and work records
 */

import { db } from '@/lib/db';
import { shiftSessions, breakLogs, users, branches } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { format, differenceInMinutes, differenceInDays } from 'date-fns';

export type LFTViolationType =
    | 'EXCESSIVE_OVERTIME'
    | 'MISSED_BREAK'
    | 'LATE_ARRIVAL'
    | 'EARLY_DEPARTURE'
    | 'SIXTH_DAY_VIOLATION'
    | 'MINIMUM_WAGE'
    | 'WEEKLY_LIMIT'
    | 'DAILY_LIMIT';

export type ViolationSeverity = 'LEVE' | 'GRAVE' | 'MUY_GRAVE';

export interface LFTViolation {
    id: string;
    userId: string;
    userName: string;
    branchId: string;
    branchName: string;
    type: LFTViolationType;
    date: Date;
    description: string;
    severity: ViolationSeverity;
    article: string;
    fineRange?: string;
    details: Record<string, any>;
}

export class LFTViolationDetector {
    /**
     * Detect all LFT violations for a given period
     */
    async detectViolations(
        startDate: Date,
        endDate: Date,
        branchId?: string
    ): Promise<LFTViolation[]> {
        const violations: LFTViolation[] = [];

        // Get all shift sessions in period
        const sessions = await this.getShiftSessions(startDate, endDate, branchId);

        // Group sessions by user
        const sessionsByUser = this.groupSessionsByUser(sessions);

        // Check violations for each user
        for (const [userId, userSessions] of Object.entries(sessionsByUser)) {
            const user = userSessions[0];
            
            // Check daily violations
            for (const session of userSessions) {
                violations.push(...this.checkDailyViolations(session));
            }

            // Check weekly violations
            violations.push(...this.checkWeeklyViolations(userId, user.userName, userSessions));

            // Check consecutive days violations
            violations.push(...this.checkConsecutiveDaysViolations(userId, user.userName, userSessions));
        }

        return violations;
    }

    /**
     * Get shift sessions for the period
     */
    private async getShiftSessions(startDate: Date, endDate: Date, branchId?: string) {
        const conditions = [
            gte(shiftSessions.startedAt, startDate),
            lte(shiftSessions.startedAt, endDate),
            eq(shiftSessions.status, 'COMPLETED')
        ];

        if (branchId) {
            conditions.push(eq(shiftSessions.branchId, branchId));
        }

        return db
            .select({
                id: shiftSessions.id,
                userId: shiftSessions.userId,
                userName: users.name,
                branchId: shiftSessions.branchId,
                branchName: branches.name,
                startedAt: shiftSessions.startedAt,
                endedAt: shiftSessions.endedAt,
                scheduledStartTime: shiftSessions.scheduledStartTime,
                scheduledEndTime: shiftSessions.scheduledEndTime,
                totalWorkMinutes: shiftSessions.totalWorkMinutes,
                totalBreakMinutes: shiftSessions.totalBreakMinutes,
                overtimeMinutes: shiftSessions.overtimeMinutes,
                lateMinutes: shiftSessions.lateMinutes,
                earlyDepartureMinutes: shiftSessions.earlyDepartureMinutes,
                complianceFlags: shiftSessions.complianceFlags,
            })
            .from(shiftSessions)
            .leftJoin(users, eq(shiftSessions.userId, users.id))
            .leftJoin(branches, eq(shiftSessions.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(shiftSessions.startedAt);
    }

    /**
     * Group sessions by user
     */
    private groupSessionsByUser(sessions: any[]) {
        const grouped: Record<string, any[]> = {};
        
        sessions.forEach(session => {
            if (!grouped[session.userId]) {
                grouped[session.userId] = [];
            }
            grouped[session.userId].push(session);
        });

        return grouped;
    }

    /**
     * Check daily violations for a single session
     */
    private checkDailyViolations(session: any): LFTViolation[] {
        const violations: LFTViolation[] = [];
        const flags = session.complianceFlags as any || {};

        // Late arrival (> 15 minutes)
        if (session.lateMinutes > 15) {
            violations.push({
                id: `late-${session.id}`,
                userId: session.userId,
                userName: session.userName || 'Unknown',
                branchId: session.branchId,
                branchName: session.branchName || 'Unknown',
                type: 'LATE_ARRIVAL',
                date: session.startedAt,
                description: `Llegada tarde de ${session.lateMinutes} minutos`,
                severity: session.lateMinutes > 60 ? 'GRAVE' : 'LEVE',
                article: 'Artículo 134, Fracción I LFT',
                fineRange: '$1,594 - $15,944 MXN',
                details: {
                    lateMinutes: session.lateMinutes,
                    scheduledStart: session.scheduledStart,
                    actualStart: session.startedAt
                }
            });
        }

        // Early departure (> 15 minutes)
        if (session.earlyDepartureMinutes > 15) {
            violations.push({
                id: `early-${session.id}`,
                userId: session.userId,
                userName: session.userName || 'Unknown',
                branchId: session.branchId,
                branchName: session.branchName || 'Unknown',
                type: 'EARLY_DEPARTURE',
                date: session.startedAt,
                description: `Salida temprana de ${session.earlyDepartureMinutes} minutos`,
                severity: session.earlyDepartureMinutes > 60 ? 'GRAVE' : 'LEVE',
                article: 'Artículo 134, Fracción I LFT',
                fineRange: '$1,594 - $15,944 MXN',
                details: {
                    earlyMinutes: session.earlyDepartureMinutes,
                    scheduledEnd: session.scheduledEnd,
                    actualEnd: session.endedAt
                }
            });
        }

        // Missed break (> 5 hours without break)
        if (session.totalWorkMinutes > 300 && session.totalBreakMinutes < 30) {
            violations.push({
                id: `break-${session.id}`,
                userId: session.userId,
                userName: session.userName || 'Unknown',
                branchId: session.branchId,
                branchName: session.branchName || 'Unknown',
                type: 'MISSED_BREAK',
                date: session.startedAt,
                description: `No tomó descanso después de ${Math.round(session.totalWorkMinutes / 60)} horas trabajadas`,
                severity: 'GRAVE',
                article: 'Artículo 63 LFT',
                fineRange: '$3,189 - $31,890 MXN',
                details: {
                    workMinutes: session.totalWorkMinutes,
                    breakMinutes: session.totalBreakMinutes,
                    requiredBreak: 30
                }
            });
        }

        // Daily limit exceeded (> 8 hours day shift, 7 hours night shift)
        if (session.totalWorkMinutes > 480) { // 8 hours
            violations.push({
                id: `daily-${session.id}`,
                userId: session.userId,
                userName: session.userName || 'Unknown',
                branchId: session.branchId,
                branchName: session.branchName || 'Unknown',
                type: 'DAILY_LIMIT',
                date: session.startedAt,
                description: `Jornada excedida: ${Math.round(session.totalWorkMinutes / 60)} horas (máx 8 horas)`,
                severity: session.totalWorkMinutes > 540 ? 'MUY_GRAVE' : 'GRAVE',
                article: 'Artículo 61 LFT',
                fineRange: '$3,189 - $31,890 MXN',
                details: {
                    workMinutes: session.totalWorkMinutes,
                    maxDailyMinutes: 480,
                    excessMinutes: session.totalWorkMinutes - 480
                }
            });
        }

        return violations;
    }

    /**
     * Check weekly violations for a user
     */
    private checkWeeklyViolations(
        userId: string,
        userName: string,
        sessions: any[]
    ): LFTViolation[] {
        const violations: LFTViolation[] = [];

        // Calculate total weekly minutes
        const totalWeeklyMinutes = sessions.reduce((sum, s) => sum + (s.totalWorkMinutes || 0), 0);
        const totalOvertimeMinutes = sessions.reduce((sum, s) => sum + (s.overtimeMinutes || 0), 0);

        // Weekly limit (48 hours = 2880 minutes)
        if (totalWeeklyMinutes > 2880) {
            violations.push({
                id: `weekly-${userId}-${sessions[0].startedAt}`,
                userId,
                userName: userName || 'Unknown',
                branchId: sessions[0].branchId,
                branchName: sessions[0].branchName || 'Unknown',
                type: 'WEEKLY_LIMIT',
                date: sessions[0].startedAt,
                description: `Jornada semanal excedida: ${Math.round(totalWeeklyMinutes / 60)} horas (máx 48 horas)`,
                severity: totalWeeklyMinutes > 3240 ? 'MUY_GRAVE' : 'GRAVE', // 54 hours
                article: 'Artículo 61 LFT',
                fineRange: '$3,189 - $31,890 MXN',
                details: {
                    weeklyMinutes: totalWeeklyMinutes,
                    maxWeeklyMinutes: 2880,
                    excessMinutes: totalWeeklyMinutes - 2880
                }
            });
        }

        // Excessive overtime (> 3 hours/day or 9 hours/week)
        if (totalOvertimeMinutes > 540) { // 9 hours
            violations.push({
                id: `overtime-${userId}-${sessions[0].startedAt}`,
                userId,
                userName: userName || 'Unknown',
                branchId: sessions[0].branchId,
                branchName: sessions[0].branchName || 'Unknown',
                type: 'EXCESSIVE_OVERTIME',
                date: sessions[0].startedAt,
                description: `Horas extras excesivas: ${Math.round(totalOvertimeMinutes / 60)} horas en la semana`,
                severity: totalOvertimeMinutes > 720 ? 'MUY_GRAVE' : 'GRAVE',
                article: 'Artículo 66, 67 LFT',
                fineRange: '$3,189 - $31,890 MXN',
                details: {
                    overtimeMinutes: totalOvertimeMinutes,
                    maxWeeklyOvertime: 540,
                    excessOvertime: totalOvertimeMinutes - 540
                }
            });
        }

        return violations;
    }

    /**
     * Check consecutive days violations (6+ days without rest)
     */
    private checkConsecutiveDaysViolations(
        userId: string,
        userName: string,
        sessions: any[]
    ): LFTViolation[] {
        const violations: LFTViolation[] = [];

        // Sort sessions by date
        const sortedSessions = [...sessions].sort((a, b) => 
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        );

        // Count consecutive days
        let consecutiveDays = 1;
        let maxConsecutiveDays = 1;

        for (let i = 1; i < sortedSessions.length; i++) {
            const currentDate = new Date(sortedSessions[i].startedAt);
            const previousDate = new Date(sortedSessions[i - 1].startedAt);
            const daysDiff = differenceInDays(currentDate, previousDate);

            if (daysDiff === 1) {
                consecutiveDays++;
                maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
            } else if (daysDiff > 1) {
                consecutiveDays = 1;
            }
        }

        // 6th day violation
        if (maxConsecutiveDays >= 6) {
            violations.push({
                id: `sixth-day-${userId}-${sortedSessions[0].startedAt}`,
                userId,
                userName: userName || 'Unknown',
                branchId: sortedSessions[0].branchId,
                branchName: sortedSessions[0].branchName || 'Unknown',
                type: 'SIXTH_DAY_VIOLATION',
                date: sortedSessions[0].startedAt,
                description: `${maxConsecutiveDays} días consecutivos sin descanso (máx 5 días)`,
                severity: maxConsecutiveDays >= 7 ? 'MUY_GRAVE' : 'GRAVE',
                article: 'Artículo 69, 70 LFT',
                fineRange: '$3,189 - $31,890 MXN',
                details: {
                    consecutiveDays: maxConsecutiveDays,
                    maxConsecutiveDays: 5,
                    restDayRequired: true
                }
            });
        }

        return violations;
    }

    /**
     * Export violations to CSV format
     */
    static exportToCSV(violations: LFTViolation[]): string {
        const headers = [
            'Empleado',
            'Sucursal',
            'Tipo Violación',
            'Fecha',
            'Descripción',
            'Severidad',
            'Artículo LFT',
            'Rango Multa',
            'Detalles'
        ];

        const rows = violations.map(v => [
            v.userName,
            v.branchName,
            v.type,
            format(v.date, 'yyyy-MM-dd'),
            v.description,
            v.severity,
            v.article,
            v.fineRange || 'N/A',
            JSON.stringify(v.details).replace(/"/g, '""')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }
}

// Singleton instance
export const lftViolationDetector = new LFTViolationDetector();
