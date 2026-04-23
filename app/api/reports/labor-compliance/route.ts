import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shiftSessions, users, branches, breakLogs } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";

export interface LaborComplianceRecord {
    userId: string;
    userName: string;
    branchId: string;
    branchName: string;
    weekStart: string;
    weekEnd: string;
    totalWorkMinutes: number;
    totalBreakMinutes: number;
    totalOvertimeMinutes: number;
    regularMinutes: number;
    dailyRecords: Array<{
        date: string;
        workMinutes: number;
        breakMinutes: number;
        overtimeMinutes: number;
        hasComplianceIssues: boolean;
        complianceIssues: string[];
    }>;
    complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED';
    complianceIssues: string[];
}

export interface LaborComplianceSummary {
    totalEmployees: number;
    compliantEmployees: number;
    nonCompliantEmployees: number;
    totalWorkMinutes: number;
    totalOvertimeMinutes: number;
    averageWorkMinutes: number;
    employeesWithOvertime: number;
    employeesWithMissedBreaks: number;
    employeesWithLateArrivals: number;
}

/**
 * GET /api/reports/labor-compliance
 * Get labor compliance report for a given period
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const branchId = searchParams.get("branchId");
        const userId = searchParams.get("userId");

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "startDate y endDate son requeridos" },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Build query conditions
        const conditions = [
            gte(shiftSessions.startedAt, start),
            lte(shiftSessions.startedAt, end),
            eq(shiftSessions.status, 'COMPLETED')
        ];

        if (branchId) {
            conditions.push(eq(shiftSessions.branchId, branchId));
        }

        if (userId) {
            conditions.push(eq(shiftSessions.userId, userId));
        }

        // Get all completed shift sessions
        const sessions = await db
            .select({
                id: shiftSessions.id,
                userId: shiftSessions.userId,
                userName: users.name,
                branchId: shiftSessions.branchId,
                branchName: branches.name,
                startedAt: shiftSessions.startedAt,
                endedAt: shiftSessions.endedAt,
                totalWorkMinutes: shiftSessions.totalWorkMinutes,
                totalBreakMinutes: shiftSessions.totalBreakMinutes,
                overtimeMinutes: shiftSessions.overtimeMinutes,
                complianceFlags: shiftSessions.complianceFlags,
                lateMinutes: shiftSessions.lateMinutes,
                earlyDepartureMinutes: shiftSessions.earlyDepartureMinutes
            })
            .from(shiftSessions)
            .leftJoin(users, eq(shiftSessions.userId, users.id))
            .leftJoin(branches, eq(shiftSessions.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(desc(shiftSessions.startedAt));

        // Group by user and week
        const complianceRecords = processSessionsByUser(sessions);

        // Calculate summary
        const summary = calculateSummary(complianceRecords);

        return NextResponse.json({
            data: complianceRecords,
            summary,
            filters: {
                startDate,
                endDate,
                branchId: branchId || undefined,
                userId: userId || undefined
            }
        });
    } catch (error) {
        console.error("Error fetching labor compliance report:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

/**
 * Process sessions and group by user and week
 */
function processSessionsByUser(sessions: any[]): LaborComplianceRecord[] {
    const userSessions: Record<string, any[]> = {};

    // Group sessions by user
    sessions.forEach(session => {
        if (!userSessions[session.userId]) {
            userSessions[session.userId] = [];
        }
        userSessions[session.userId].push(session);
    });

    // Process each user's sessions
    return Object.entries(userSessions).map(([userId, sessions]) => {
        const firstSession = sessions[0];
        const totalWorkMinutes = sessions.reduce((sum, s) => sum + (s.totalWorkMinutes || 0), 0);
        const totalBreakMinutes = sessions.reduce((sum, s) => sum + (s.totalBreakMinutes || 0), 0);
        const totalOvertimeMinutes = sessions.reduce((sum, s) => sum + (s.overtimeMinutes || 0), 0);

        // Group by day
        const dailyRecords: LaborComplianceRecord['dailyRecords'] = [];
        const complianceIssues: string[] = [];

        // Group sessions by date
        const sessionsByDate: Record<string, any[]> = {};
        sessions.forEach(s => {
            const date = format(s.startedAt, 'yyyy-MM-dd');
            if (!sessionsByDate[date]) {
                sessionsByDate[date] = [];
            }
            sessionsByDate[date].push(s);
        });

        // Process each day
        Object.entries(sessionsByDate).forEach(([date, daySessions]) => {
            const workMinutes = daySessions.reduce((sum, s) => sum + (s.totalWorkMinutes || 0), 0);
            const breakMinutes = daySessions.reduce((sum, s) => sum + (s.totalBreakMinutes || 0), 0);
            const overtimeMinutes = daySessions.reduce((sum, s) => sum + (s.overtimeMinutes || 0), 0);

            const issues: string[] = [];

            // Check for compliance issues
            daySessions.forEach(s => {
                const flags = s.complianceFlags as any || {};
                
                if (flags.lateCheckIn && s.lateMinutes > 15) {
                    issues.push(`Llegada tarde (${s.lateMinutes} min)`);
                }
                
                if (flags.earlyCheckOut && s.earlyDepartureMinutes > 15) {
                    issues.push(`Salida temprana (${s.earlyDepartureMinutes} min)`);
                }
                
                if (flags.missedBreak && workMinutes > 300) {
                    issues.push('No tomó break en jornada > 5 horas');
                }
                
                if (overtimeMinutes > 0) {
                    issues.push(`${overtimeMinutes} min overtime`);
                }
            });

            dailyRecords.push({
                date,
                workMinutes,
                breakMinutes,
                overtimeMinutes,
                hasComplianceIssues: issues.length > 0,
                complianceIssues: issues
            });

            complianceIssues.push(...issues);
        });

        // Determine compliance status
        const weeklyLimit = 48 * 60; // 48 hours in minutes
        const dailyLimit = 8 * 60; // 8 hours in minutes
        const hasExcessiveOvertime = totalOvertimeMinutes > weeklyLimit * 0.25; // > 25% overtime
        const hasMissedBreaks = dailyRecords.some(d => d.complianceIssues.some(i => i.includes('break')));

        let complianceStatus: LaborComplianceRecord['complianceStatus'] = 'COMPLIANT';
        if (hasExcessiveOvertime || totalWorkMinutes > weeklyLimit) {
            complianceStatus = 'NON_COMPLIANT';
        } else if (complianceIssues.length > 0) {
            complianceStatus = 'REVIEW_REQUIRED';
        }

        const weekStart = format(startOfWeek(sessions[0].startedAt), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(sessions[0].startedAt), 'yyyy-MM-dd');

        return {
            userId,
            userName: firstSession.userName || 'Unknown',
            branchId: firstSession.branchId,
            branchName: firstSession.branchName || 'Unknown',
            weekStart,
            weekEnd,
            totalWorkMinutes,
            totalBreakMinutes,
            totalOvertimeMinutes,
            regularMinutes: totalWorkMinutes - totalOvertimeMinutes,
            dailyRecords,
            complianceStatus,
            complianceIssues: [...new Set(complianceIssues)] // Unique issues
        };
    });
}

/**
 * Calculate summary statistics
 */
function calculateSummary(records: LaborComplianceRecord[]): LaborComplianceSummary {
    const totalEmployees = records.length;
    const compliantEmployees = records.filter(r => r.complianceStatus === 'COMPLIANT').length;
    const nonCompliantEmployees = records.filter(r => r.complianceStatus === 'NON_COMPLIANT').length;
    const totalWorkMinutes = records.reduce((sum, r) => sum + r.totalWorkMinutes, 0);
    const totalOvertimeMinutes = records.reduce((sum, r) => sum + r.totalOvertimeMinutes, 0);

    return {
        totalEmployees,
        compliantEmployees,
        nonCompliantEmployees,
        totalWorkMinutes,
        totalOvertimeMinutes,
        averageWorkMinutes: totalEmployees > 0 ? Math.round(totalWorkMinutes / totalEmployees) : 0,
        employeesWithOvertime: records.filter(r => r.totalOvertimeMinutes > 0).length,
        employeesWithMissedBreaks: records.filter(r => 
            r.dailyRecords.some(d => d.complianceIssues.some(i => i.includes('break')))
        ).length,
        employeesWithLateArrivals: records.filter(r => 
            r.dailyRecords.some(d => d.complianceIssues.some(i => i.includes('Llegada')))
        ).length
    };
}
