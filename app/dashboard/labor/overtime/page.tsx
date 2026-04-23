import { OvertimeDashboard } from "@/components/labor/overtime-dashboard"
import { LaborCalculator } from "@/lib/services/labor-calculator"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export default async function OvertimeReportsPage() {
    const session = await auth.api.getSession({ headers: await headers() });

    let reports: any[] = [];
    let summary: any = null;

    if (session?.user) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        try {
            // Get the user's company ID from session
            const companyId = session.user.companyId;
            
            if (!companyId) {
                console.error("User does not have a company assigned");
            } else {
                // Only fetch users belonging to the current user's company
                const allUsers = await db.query.users.findMany({
                    where: (users, { eq, and, isNull }) => and(
                        eq(users.companyId, companyId),
                        isNull(users.deletedAt)
                    ),
                });

                reports = await Promise.all(
                    allUsers.map(user =>
                        LaborCalculator.calculateOvertime(
                            user.id,
                            startDate,
                            endDate
                        )
                    )
                );
            }

            summary = {
                totalEmployees: reports.length,
                totalRegularMinutes: reports.reduce((sum, r) => sum + r.regularMinutes, 0),
                totalOvertimeMinutes: reports.reduce((sum, r) => sum + r.totalOvertimeMinutes, 0),
                overtimeByType: {
                    diurnal: reports.reduce((sum, r) => sum + r.overtimeMinutes.diurnal, 0),
                    nocturnal: reports.reduce((sum, r) => sum + r.overtimeMinutes.nocturnal, 0),
                    holiday: reports.reduce((sum, r) => sum + r.overtimeMinutes.holiday, 0),
                    weekly: reports.reduce((sum, r) => sum + r.overtimeMinutes.weekly, 0)
                },
                employeesWithOvertime: reports.filter(r => r.totalOvertimeMinutes > 0).length,
                averageOvertimePerEmployee: reports.length > 0 ? reports.reduce((sum, r) => sum + r.totalOvertimeMinutes, 0) / reports.length : 0
            };
        } catch (error) {
            console.error("Error calculating initial overtime", error);
        }
    }

    return (
        <div className="space-y-6">
            <OvertimeDashboard initialData={{ data: reports, summary }} />
        </div>
    )
}
