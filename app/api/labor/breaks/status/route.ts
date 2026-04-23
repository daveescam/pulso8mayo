import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shiftSessions, breakLogs, users, branches } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, desc } from 'drizzle-orm';
import { startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import { headers } from 'next/headers';

/**
 * GET /api/labor/breaks/status
 * Get break status for all active employees
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');

        const today = new Date();
        const dayStart = startOfDay(today);
        const dayEnd = endOfDay(today);

        // Get all active shift sessions for today
        const sessionConditions = [
            eq(shiftSessions.status, 'ACTIVE'),
            gte(shiftSessions.startedAt, dayStart),
            lte(shiftSessions.startedAt, dayEnd),
        ];

        if (branchId) {
            sessionConditions.push(eq(shiftSessions.branchId, branchId));
        }

        const activeSessions = await db
            .select({
                id: shiftSessions.id,
                userId: shiftSessions.userId,
                userName: users.name,
                userPhone: users.phone,
                branchId: shiftSessions.branchId,
                branchName: branches.name,
                startedAt: shiftSessions.startedAt,
                totalWorkMinutes: shiftSessions.totalWorkMinutes,
                totalBreakMinutes: shiftSessions.totalBreakMinutes,
            })
            .from(shiftSessions)
            .leftJoin(users, eq(shiftSessions.userId, users.id))
            .leftJoin(branches, eq(shiftSessions.branchId, branches.id))
            .where(and(...sessionConditions));

        // Get today's breaks for all active sessions
        const sessionIds = activeSessions.map(s => s.id);
        
        let breaks = [];
        if (sessionIds.length > 0) {
            breaks = await db
                .select({
                    id: breakLogs.id,
                    sessionId: breakLogs.sessionId,
                    startTime: breakLogs.startTime,
                    endTime: breakLogs.endTime,
                    durationMinutes: breakLogs.durationMinutes,
                    type: breakLogs.type,
                    isCompliant: breakLogs.isCompliant,
                    complianceNotes: breakLogs.complianceNotes,
                })
                .from(breakLogs)
                .where(
                    and(
                        gte(breakLogs.startTime, dayStart),
                        lte(breakLogs.startTime, dayEnd)
                    )
                );
        }

        // Build employee break status
        const employees = activeSessions.map(session => {
            const sessionBreaks = breaks.filter(b => b.sessionId === session.id);
            const activeBreak = sessionBreaks.find(b => !b.endTime);
            const completedBreaks = sessionBreaks.filter(b => b.endTime);

            const totalBreakMinutes = completedBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
            const minutesWorked = session.totalWorkMinutes || 
                differenceInMinutes(new Date(), session.startedAt);

            // Check compliance issues
            const complianceIssues: string[] = [];
            let complianceStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' = 'COMPLIANT';

            // Check if worked > 5 hours without break
            if (minutesWorked > 300 && totalBreakMinutes === 0) {
                complianceIssues.push('>5 horas sin break');
                complianceStatus = 'NON_COMPLIANT';
            } else if (minutesWorked > 240 && totalBreakMinutes === 0) {
                complianceIssues.push('4+ horas sin break');
                complianceStatus = 'WARNING';
            }

            // Check if any break was too short (< 30 min)
            const shortBreaks = completedBreaks.filter(b => (b.durationMinutes || 0) < 30);
            if (shortBreaks.length > 0) {
                complianceIssues.push(`${shortBreaks.length} break(s) < 30 min`);
                if (complianceStatus === 'COMPLIANT') {
                    complianceStatus = 'WARNING';
                }
            }

            // Check if break was missed during long shift
            if (minutesWorked > 480 && completedBreaks.length < 2) {
                complianceIssues.push('Break insuficiente para jornada > 8h');
                complianceStatus = 'NON_COMPLIANT';
            }

            return {
                userId: session.userId,
                userName: session.userName || 'Desconocido',
                userPhone: session.userPhone || '',
                branchId: session.branchId,
                branchName: session.branchName || 'Desconocida',
                shiftStarted: session.startedAt,
                minutesWorked,
                lastBreakStart: activeBreak?.startTime || completedBreaks[completedBreaks.length - 1]?.startTime || null,
                lastBreakEnd: activeBreak?.endTime || completedBreaks[completedBreaks.length - 1]?.endTime || null,
                lastBreakDuration: activeBreak?.durationMinutes || completedBreaks[completedBreaks.length - 1]?.durationMinutes || null,
                totalBreakMinutes,
                breakCount: completedBreaks.length,
                hasActiveBreak: !!activeBreak,
                complianceStatus,
                complianceIssues,
                lastWhatsAppNotification: null, // TODO: Fetch from breakReminderLogs
            };
        });

        return NextResponse.json({
            employees,
            summary: {
                total: employees.length,
                onBreak: employees.filter(e => e.hasActiveBreak).length,
                compliant: employees.filter(e => e.complianceStatus === 'COMPLIANT').length,
                warning: employees.filter(e => e.complianceStatus === 'WARNING').length,
                nonCompliant: employees.filter(e => e.complianceStatus === 'NON_COMPLIANT').length,
                missedBreaks: employees.filter(e => 
                    e.minutesWorked > 300 && e.totalBreakMinutes === 0
                ).length,
            },
        });
    } catch (error) {
        console.error('Error fetching break status:', error);
        return NextResponse.json(
            { error: 'Error interno' },
            { status: 500 }
        );
    }
}
