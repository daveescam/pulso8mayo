"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

interface EmployeeScheduleViewProps {
    userId: string;
    companyId?: string | null;
}

interface Shift {
    id: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    role: string;
    notes?: string;
    status: string;
}

export function EmployeeScheduleView({ userId, companyId }: EmployeeScheduleViewProps) {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!userId) return;

            try {
                const startDate = startOfWeek(new Date());
                const endDate = addDays(startDate, 13); // Next 2 weeks

                // Need to get user's branch first
                const userResponse = await fetch(`/api/users/${userId}`);
                if (!userResponse.ok) return;

                const userData = await userResponse.json();
                const branchId = userData.branchId;

                if (!branchId) return;

                const response = await fetch(
                    `/api/shifts?userId=${userId}&branchId=${branchId}&start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setShifts(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching schedule:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [userId]);

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Mi Horario
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Group shifts by week
    const thisWeek = shifts.filter(shift => {
        const shiftDate = new Date(shift.shiftDate);
        const weekStart = startOfWeek(new Date());
        const weekEnd = addDays(weekStart, 6);
        return shiftDate >= weekStart && shiftDate <= weekEnd;
    });

    const nextWeek = shifts.filter(shift => {
        const shiftDate = new Date(shift.shiftDate);
        const weekStart = startOfWeek(addDays(new Date(), 7));
        const weekEnd = addDays(weekStart, 6);
        return shiftDate >= weekStart && shiftDate <= weekEnd;
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Mi Horario
                </CardTitle>
                <CardDescription>
                    Horarios de trabajo para las próximas semanas
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* This Week */}
                    <div>
                        <h4 className="font-medium mb-3">Esta semana</h4>
                        {thisWeek.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay turnos asignados esta semana</p>
                        ) : (
                            <div className="space-y-2">
                                {thisWeek.map((shift) => (
                                    <div key={shift.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">
                                                {format(new Date(shift.shiftDate), "EEEE, dd/MM", { locale: es })}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                            </p>
                                            {shift.notes && (
                                                <p className="text-sm text-muted-foreground">{shift.notes}</p>
                                            )}
                                        </div>
                                        <Badge variant="outline">
                                            {shift.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Next Week */}
                    <div>
                        <h4 className="font-medium mb-3">Próxima semana</h4>
                        {nextWeek.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay turnos asignados la próxima semana</p>
                        ) : (
                            <div className="space-y-2">
                                {nextWeek.map((shift) => (
                                    <div key={shift.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">
                                                {format(new Date(shift.shiftDate), "EEEE, dd/MM", { locale: es })}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                            </p>
                                            {shift.notes && (
                                                <p className="text-sm text-muted-foreground">{shift.notes}</p>
                                            )}
                                        </div>
                                        <Badge variant="outline">
                                            {shift.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {shifts.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                            No hay horarios disponibles en las próximas semanas
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}