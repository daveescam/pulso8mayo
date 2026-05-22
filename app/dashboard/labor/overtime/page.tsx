"use client";

import { OvertimeDashboard } from "@/components/labor/overtime-dashboard"
import { useRequireRole } from "@/hooks/use-session"

export default function OvertimeReportsPage() {
    const { loading } = useRequireRole(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR']);

    if (loading) {
        return null;
    }

    return (
        <div className="space-y-6">
            <OvertimeDashboard initialData={{ data: [], summary: null }} />
        </div>
    )
}
