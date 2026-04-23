import { AttendanceDashboard } from "@/components/labor/attendance-dashboard"
import { db } from "@/lib/db"
import { shiftSessions, users, branches } from "@/lib/db/schema"
import { and, gte, lte, eq, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function AttendanceReportsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    
    let attendanceRecords: any[] = [];
    let summaryData = {
        totalRecords: 0,
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        totalOvertimeMinutes: 0,
        completedShifts: 0,
        activeShifts: 0,
        uniqueEmployees: 0
    };

    if (session?.user) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const sessions = await db
            .select({
                id: shiftSessions.id,
                userId: shiftSessions.userId,
                userName: users.name,
                userEmail: users.email,
                userRole: users.role,
                branchId: shiftSessions.branchId,
                branchName: branches.name,
                startedAt: shiftSessions.startedAt,
                endedAt: shiftSessions.endedAt,
                status: shiftSessions.status,
                totalWorkMinutes: shiftSessions.totalWorkMinutes,
                totalBreakMinutes: shiftSessions.totalBreakMinutes,
                overtimeMinutes: shiftSessions.overtimeMinutes,
                checkInGeolocation: shiftSessions.checkInGeolocation,
                checkOutGeolocation: shiftSessions.checkOutGeolocation
            })
            .from(shiftSessions)
            .leftJoin(users, eq(shiftSessions.userId, users.id))
            .leftJoin(branches, eq(shiftSessions.branchId, branches.id))
            .where(
                and(
                    gte(shiftSessions.startedAt, startDate),
                    lte(shiftSessions.startedAt, endDate)
                )
            )
            .orderBy(sql`${shiftSessions.startedAt} DESC`);

        attendanceRecords = sessions.map(s => ({
            id: s.id,
            userId: s.userId,
            userName: s.userName || "Unknown",
            userEmail: s.userEmail || "",
            userRole: s.userRole || "EMPLEADO",
            branchId: s.branchId,
            branchName: s.branchName || "Unknown",
            date: new Date(s.startedAt).toISOString().split("T")[0],
            clockIn: s.startedAt ? new Date(s.startedAt).toISOString() : null,
            clockOut: s.endedAt ? new Date(s.endedAt).toISOString() : null,
            totalWorkMinutes: s.totalWorkMinutes || 0,
            breakMinutes: s.totalBreakMinutes || 0,
            overtimeMinutes: s.overtimeMinutes || 0,
            status: s.status as "COMPLETED" | "ACTIVE" | "MISSED",
            geolocation: s.checkInGeolocation || s.checkOutGeolocation || null
        }));

        summaryData = {
            totalRecords: attendanceRecords.length,
            totalWorkMinutes: attendanceRecords.reduce((sum, r) => sum + r.totalWorkMinutes, 0),
            totalBreakMinutes: attendanceRecords.reduce((sum, r) => sum + r.breakMinutes, 0),
            totalOvertimeMinutes: attendanceRecords.reduce((sum, r) => sum + r.overtimeMinutes, 0),
            completedShifts: attendanceRecords.filter(r => r.status === "COMPLETED").length,
            activeShifts: attendanceRecords.filter(r => r.status === "ACTIVE").length,
            uniqueEmployees: new Set(attendanceRecords.map(r => r.userId)).size
        };
    }

    return (
        <div className="space-y-6">
            <AttendanceDashboard initialData={{ data: attendanceRecords, summary: summaryData }} />
        </div>
    )
}
