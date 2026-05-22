"use client";

import { AttendanceDashboard } from "@/components/labor/attendance-dashboard"
import { useRequireRole } from "@/hooks/use-session";

export default function AttendanceReportsPage() {
    const { loading } = useRequireRole(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR']);

    if (loading) {
        return null;
    }

    // Server-side data fetching is removed - component will fetch on client side
    // This maintains backward compatibility via the component's internal state
    return (
        <div className="space-y-6">
            <AttendanceDashboard initialData={{ data: [], summary: {
                totalRecords: 0,
                totalWorkMinutes: 0,
                totalBreakMinutes: 0,
                totalOvertimeMinutes: 0,
                completedShifts: 0,
                activeShifts: 0,
                uniqueEmployees: 0
            } }} />
        </div>
    )
}
