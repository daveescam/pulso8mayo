"use client"

import * as React from "react"
import { format, parseISO, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Clock, Users, TrendingUp, AlertCircle, CheckCircle, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceReport } from "./attendance-report"
import { AttendanceRecord } from "@/app/api/reports/attendance/route"

interface AttendanceDashboardProps {
    initialData?: {
        data: AttendanceRecord[]
        summary: any
    }
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function AttendanceDashboard({ initialData }: AttendanceDashboardProps) {
    const [records, setRecords] = React.useState<AttendanceRecord[]>(initialData?.data || [])
    const [summary, setSummary] = React.useState(initialData?.summary || {})
    const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "90d">("30d")

    React.useEffect(() => {
        if (initialData) {
            setRecords(initialData.data)
            setSummary(initialData.summary)
        }
    }, [initialData])

    // Calculate daily trends
    const dailyTrends = React.useMemo(() => {
        const grouped: Record<string, any> = {}

        records.forEach(record => {
            const date = record.date
            if (!grouped[date]) {
                grouped[date] = {
                    date,
                    workMinutes: 0,
                    breakMinutes: 0,
                    overtimeMinutes: 0,
                    shifts: 0,
                    employees: new Set<string>()
                }
            }
            grouped[date].workMinutes += record.totalWorkMinutes
            grouped[date].breakMinutes += record.breakMinutes
            grouped[date].overtimeMinutes += record.overtimeMinutes
            grouped[date].shifts += 1
            grouped[date].employees.add(record.userId)
        })

        return Object.values(grouped)
            .map(d => ({
                ...d,
                workHours: (d.workMinutes / 60).toFixed(1),
                avgHours: (d.workMinutes / d.employees.size / 60).toFixed(1),
                employeeCount: d.employees.size
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30)
    }, [records])

    // Calculate employee summary
    const employeeSummary = React.useMemo(() => {
        const grouped: Record<string, any> = {}

        records.forEach(record => {
            if (!grouped[record.userId]) {
                grouped[record.userId] = {
                    userId: record.userId,
                    name: record.userName,
                    role: record.userRole,
                    branch: record.branchName,
                    totalWorkMinutes: 0,
                    totalBreakMinutes: 0,
                    totalOvertimeMinutes: 0,
                    shifts: 0,
                    lateArrivals: 0 // Could be calculated if we have scheduled times
                }
            }
            grouped[record.userId].totalWorkMinutes += record.totalWorkMinutes
            grouped[record.userId].totalBreakMinutes += record.breakMinutes
            grouped[record.userId].totalOvertimeMinutes += record.overtimeMinutes
            grouped[record.userId].shifts += 1
        })

        return Object.values(grouped)
            .map(e => ({
                ...e,
                totalHours: (e.totalWorkMinutes / 60).toFixed(1),
                avgHoursPerShift: (e.totalWorkMinutes / e.shifts / 60).toFixed(1),
                overtimeHours: (e.totalOvertimeMinutes / 60).toFixed(1)
            }))
            .sort((a, b) => b.totalWorkMinutes - a.totalWorkMinutes)
            .slice(0, 10)
    }, [records])

    // Calculate status distribution
    const statusDistribution = React.useMemo(() => {
        const statusCounts: Record<string, number> = {
            COMPLETED: 0,
            ACTIVE: 0,
            MISSED: 0
        }

        records.forEach(record => {
            statusCounts[record.status] = (statusCounts[record.status] || 0) + 1
        })

        return Object.entries(statusCounts).map(([name, value]) => ({
            name: name === "COMPLETED" ? "Completado" : name === "ACTIVE" ? "Activo" : "No presentado",
            value
        }))
    }, [records])

    // Calculate branch summary
    const branchSummary = React.useMemo(() => {
        const grouped: Record<string, any> = {}

        records.forEach(record => {
            if (!grouped[record.branchId]) {
                grouped[record.branchId] = {
                    branchId: record.branchId,
                    branchName: record.branchName,
                    totalWorkMinutes: 0,
                    totalOvertimeMinutes: 0,
                    shifts: 0,
                    employees: new Set<string>()
                }
            }
            grouped[record.branchId].totalWorkMinutes += record.totalWorkMinutes
            grouped[record.branchId].totalOvertimeMinutes += record.overtimeMinutes
            grouped[record.branchId].shifts += 1
            grouped[record.branchId].employees.add(record.userId)
        })

        return Object.values(grouped).map(b => ({
            ...b,
            totalHours: (b.totalWorkMinutes / 60).toFixed(1),
            overtimeHours: (b.totalOvertimeMinutes / 60).toFixed(1),
            employeeCount: b.employees.size,
            avgHoursPerEmployee: (b.totalWorkMinutes / b.employees.size / 60).toFixed(1)
        }))
    }, [records])

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        return `${hours}h ${mins}m`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard de Asistencia</h1>
                    <p className="text-muted-foreground">
                        Análisis y métricas de asistencia de empleados
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-[400px]">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="7d">7 días</TabsTrigger>
                            <TabsTrigger value="30d">30 días</TabsTrigger>
                            <TabsTrigger value="90d">90 días</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalRecords || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            en el período seleccionado
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Horas Totales</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatMinutes(summary.totalWorkMinutes || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatMinutes((summary.totalWorkMinutes || 0) / (summary.totalRecords || 1))} promedio/turno
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overtime Total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatMinutes(summary.totalOvertimeMinutes || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.totalOvertimeMinutes > 0 ? "⚠️ Revisar" : "✓ Sin overtime"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.totalRecords > 0
                                ? Math.round(((summary.completedShifts || 0) / summary.totalRecords) * 100)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.completedShifts || 0} de {summary.totalRecords || 0} turnos completados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Daily Trend */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Tendencia Diaria de Horas Trabajadas</CardTitle>
                        <CardDescription>
                            Horas trabajadas promedio por día
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={dailyTrends}>
                                <defs>
                                    <linearGradient id="colorWorkHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => format(parseISO(value), "dd/MM")}
                                />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: any) => [`${value}h`, "Horas Trabajadas"]}
                                    labelFormatter={(label) => format(parseISO(label), "dd/MMM", { locale: es })}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="workHours"
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill="url(#colorWorkHours)"
                                    name="Horas Totales"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avgHours"
                                    stroke="#82ca9d"
                                    name="Promedio por Empleado"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución de Estados</CardTitle>
                        <CardDescription>
                            Turnos por estado
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Employees */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 10 Empleados</CardTitle>
                        <CardDescription>
                            Por horas trabajadas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={employeeSummary}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="totalHours" fill="#8884d8" name="Horas Trabajadas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Branch Summary */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Resumen por Sucursal</CardTitle>
                        <CardDescription>
                            Métricas de asistencia por sucursal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={branchSummary}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="branchName" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="totalHours" fill="#8884d8" name="Horas Totales" />
                                <Bar dataKey="overtimeHours" fill="#ff8042" name="Horas Extra" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Report */}
            <AttendanceReport initialData={initialData} />
        </div>
    )
}
