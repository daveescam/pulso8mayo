import { NextRequest } from "next/server";
import { ApiHandler } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { requireTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { shiftSessions, plannedShifts, users, branches, breakLogs } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc, inArray } from "drizzle-orm";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns";
import { 
    calculateOvertime, 
    validateBreakCompliance, 
    DEFAULT_COMPLIANCE_RULES,
    aggregateWeeklyHours,
    getComplianceStatus
} from "@/lib/labor-validation";

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        
        if (!tenant.id) {
            return ApiHandler.success({
                summary: { totalEmployees: 0, compliantCount: 0 },
                details: []
            });
        }
        
        const searchParams = req.nextUrl.searchParams;
        const branchId = searchParams.get("branchId");
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        const type = searchParams.get("type") || "weekly";

        const conditions = [];
        
        if (branchId) {
            conditions.push(eq(shiftSessions.branchId, branchId));
        }
        
        const startDate = start ? new Date(start) : startOfWeek(new Date(), { weekStartsOn: 1 });
        const endDate = end ? new Date(end) : endOfWeek(new Date(), { weekStartsOn: 1 });
        
        conditions.push(gte(shiftSessions.startedAt, startDate));
        conditions.push(lte(shiftSessions.startedAt, endDate));

        const sessions = await db.query.shiftSessions.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(shiftSessions.startedAt)],
        });

        const shifts = await db.query.plannedShifts.findMany({
            where: and(
                branchId ? eq(plannedShifts.branchId, branchId) : undefined,
                gte(plannedShifts.shiftDate, format(startDate, "yyyy-MM-dd")),
                lte(plannedShifts.shiftDate, format(endDate, "yyyy-MM-dd"))
            ),
        });

        const userIds = [...new Set([...sessions.map(s => s.userId), ...shifts.map(s => s.userId)])];
        const userMap: Record<string, any> = {};
        
        for (const uid of userIds) {
            const user = await db.query.users.findFirst({
                where: eq(users.id, uid),
                columns: { name: true, image: true, role: true }
            });
            if (user) {
                userMap[uid] = user;
            }
        }

        const byUser: Record<string, any> = {};
        
        sessions.forEach(session => {
            if (!byUser[session.userId]) {
                byUser[session.userId] = {
                    userId: session.userId,
                    userName: userMap[session.userId]?.name || 'Unknown',
                    userRole: userMap[session.userId]?.role || 'EMPLEADO',
                    totalWorkMinutes: 0,
                    totalBreakMinutes: 0,
                    overtimeMinutes: 0,
                    sessionsCompleted: 0,
                    sessionsNoShow: 0,
                    breaksTaken: 0,
                    compliantBreaks: 0,
                    daily: {},
                };
            }
            
            const dayKey = format(session.startedAt, "yyyy-MM-dd");
            
            if (session.status === "COMPLETED") {
                byUser[session.userId].totalWorkMinutes += session.totalWorkMinutes || 0;
                byUser[session.userId].totalBreakMinutes += session.totalBreakMinutes || 0;
                byUser[session.userId].overtimeMinutes += session.overtimeMinutes || 0;
                byUser[session.userId].sessionsCompleted++;
                byUser[session.userId].daily[dayKey] = (byUser[session.userId].daily[dayKey] || 0) + (session.totalWorkMinutes || 0);
            } else if (session.status === "NO_SHOW") {
                byUser[session.userId].sessionsNoShow++;
            }
        });

        const breakMap: Record<string, any> = {};
        const allBreaks = sessions.length > 0 
            ? await db.query.breakLogs.findMany({
                where: inArray(breakLogs.sessionId, sessions.map(s => s.id)),
            })
            : [];
        
        allBreaks.forEach(brk => {
            const session = sessions.find(s => s.id === brk.sessionId);
            if (!session) return;
            if (!breakMap[session.userId]) breakMap[session.userId] = { total: 0, compliant: 0 };
            breakMap[session.userId].total++;
            if (brk.isCompliant) breakMap[session.userId].compliant++;
        });

        const details = Object.values(byUser).map((user: any) => {
            const weeklyHours = user.totalWorkMinutes / 60;
            const scheduledMinutes = user.sessionsCompleted * 480;
            const overtime = calculateOvertime(user.totalWorkMinutes);
            const status = getComplianceStatus(user.totalWorkMinutes);
            const breakCompliance = user.totalBreakMinutes > 0 
                ? breakMap[user.userId]?.compliant / breakMap[user.userId]?.total * 100 || 0
                : 100;

            return {
                userId: user.userId,
                userName: user.userName,
                userRole: user.userRole,
                weeklyHours: weeklyHours.toFixed(1),
                scheduledHours: (scheduledMinutes / 60).toFixed(1),
                overtime: {
                    total: overtime.totalMinutes,
                    rate1: overtime.rate1Minutes,
                    rate2: overtime.rate2Minutes,
                    rate3: overtime.rate3Minutes,
                },
                breakMinutes: user.totalBreakMinutes,
                breakCompliance: Math.round(breakCompliance),
                sessionsCompleted: user.sessionsCompleted,
                sessionsNoShow: user.sessionsNoShow,
                status,
                daily: user.daily,
            };
        });

        const summary = {
            generatedAt: new Date().toISOString(),
            period: { start: format(startDate, "yyyy-MM-dd"), end: format(endDate, "yyyy-MM-dd") },
            totalEmployees: details.length,
            totalHours: details.reduce((sum, d) => sum + parseFloat(d.weeklyHours), 0),
            totalOvertime: details.reduce((sum, d) => sum + d.overtime.total, 0),
            compliantCount: details.filter(d => d.status === "compliant").length,
            warningCount: details.filter(d => d.status === "warning").length,
            violationCount: details.filter(d => d.status === "violation").length,
            avgBreakCompliance: details.length > 0 
                ? Math.round(details.reduce((sum, d) => sum + d.breakCompliance, 0) / details.length)
                : 100,
        };

        return ApiHandler.success({ summary, details });
    } catch (error) {
        console.error("Error generating labor compliance report:", error);
        return ApiHandler.error(error);
    }
}