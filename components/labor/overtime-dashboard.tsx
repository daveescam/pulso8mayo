"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Clock, TrendingUp, DollarSign, AlertCircle, Calendar, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

interface OvertimeDashboardProps {
    initialData?: {
        data: any[]
        summary: any
    }
}

export function OvertimeDashboard({ initialData }: OvertimeDashboardProps) {
    const [reports, setReports] = React.useState<any[]>(initialData?.data || [])
    const [summary, setSummary] = React.useState(initialData?.summary || null)
    const [loading, setLoading] = React.useState(false)
    const [startDate, setStartDate] = React.useState(() => {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        return format(date, "yyyy-MM-dd")
    })
    const [endDate, setEndDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"))

    const fetchReport = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ startDate, endDate })
            const response = await fetch(`/api/reports/overtime?${params.toString()}`)
            if (!response.ok) throw new Error("Error al cargar reporte")
            const result = await response.json()
            setReports(result.data)
            setSummary(result.summary)
            toast.success("Reporte de overtime actualizado")
        } catch (error) {
            console.error("Error fetching overtime report:", error)
            toast.error("Error al cargar el reporte de overtime")
        } finally {
            setLoading(false)
        }
    }

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        return `${hours}h ${mins}m`
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN"
        }).format(amount)
    }

    // Prepare data for charts
    const overtimeByTypeData = summary ? [
        { name: "Diurnas (2x)", value: summary.overtimeByType.diurnal, color: COLORS[0] },
        { name: "Nocturnas (3x)", value: summary.overtimeByType.nocturnal, color: COLORS[1] },
        { name: "Festivo (3x)", value: summary.overtimeByType.holiday, color: COLORS[2] },
        { name: "Semanales (2x)", value: summary.overtimeByType.weekly, color: COLORS[3] }
    ].filter(d => d.value > 0) : []

    const topOvertimeEmployees = reports
        .filter(r => r.totalOvertimeMinutes > 0)
        .sort((a, b) => b.totalOvertimeMinutes - a.totalOvertimeMinutes)
        .slice(0, 10)
        .map(r => ({
            name: r.userName.split(" ")[0],
            hours: Math.round(r.totalOvertimeMinutes / 60 * 10) / 10,
            diurnal: Math.round(r.overtimeMinutes.diurnal / 60 * 10) / 10,
            nocturnal: Math.round(r.overtimeMinutes.nocturnal / 60 * 10) / 10
        }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard de Horas Extras</h1>
                    <p className="text-muted-foreground">
                        Análisis y cálculo de horas extras según ley federal
                    </p>
                </div>
                <Button onClick={fetchReport} disabled={loading}>
                    {loading ? "Actualizando..." : "Actualizar"}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Fecha Inicio</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Fecha Fin</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchReport} className="w-full" disabled={loading}>
                                Aplicar Filtros
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Overtime</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatMinutes(summary.totalOvertimeMinutes)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {summary.employeesWithOvertime} empleados con overtime
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Horas Regulares</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatMinutes(summary.totalRegularMinutes)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatMinutes(summary.totalRegularMinutes / (summary.totalEmployees || 1))} promedio/empleado
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Promedio Overtime</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatMinutes(summary.averageOvertimePerEmployee || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Por empleado en el período
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalEmployees}</div>
                            <p className="text-xs text-muted-foreground">
                                {Math.round((summary.employeesWithOvertime / summary.totalEmployees) * 100) || 0}% con overtime
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Overtime by Type */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución por Tipo</CardTitle>
                        <CardDescription>
                            Horas extras por tipo de overtime
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={overtimeByTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {overtimeByTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                        <CardTitle>Top 10 con Más Overtime</CardTitle>
                        <CardDescription>
                            Empleados con más horas extras
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topOvertimeEmployees}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="diurnal" fill="#8884d8" name="Diurnas" />
                                <Bar dataKey="nocturnal" fill="#82ca9d" name="Nocturnas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Horas Extras por Empleado</CardTitle>
                    <CardDescription>
                        Desglose individual de horas extras
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Sucursal</TableHead>
                                <TableHead className="text-right">Horas Regulares</TableHead>
                                <TableHead className="text-right">Diurnas (2x)</TableHead>
                                <TableHead className="text-right">Nocturnas (3x)</TableHead>
                                <TableHead className="text-right">Festivo (3x)</TableHead>
                                <TableHead className="text-right">Semanales (2x)</TableHead>
                                <TableHead className="text-right">Total Overtime</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No hay datos de overtime en el período seleccionado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report) => (
                                    <TableRow key={report.userId}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div>{report.userName}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{report.branchName}</TableCell>
                                        <TableCell className="text-right">
                                            {formatMinutes(report.regularMinutes)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="text-xs">
                                                {formatMinutes(report.overtimeMinutes.diurnal)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="text-xs">
                                                {formatMinutes(report.overtimeMinutes.nocturnal)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="text-xs">
                                                {formatMinutes(report.overtimeMinutes.holiday)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="text-xs">
                                                {formatMinutes(report.overtimeMinutes.weekly)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={report.totalOvertimeMinutes > 0 ? "destructive" : "default"}
                                                className="text-xs"
                                            >
                                                {formatMinutes(report.totalOvertimeMinutes)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Información sobre Horas Extras
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        <strong>Horas Extras Diurnas (2x):</strong> Horas trabajadas después de la jornada normal durante el día (6:00 - 22:00).
                        Según el Artículo 68 de la LFT, se pagan con un 100% de recargo.
                    </p>
                    <p>
                        <strong>Horas Extras Nocturnas (3x):</strong> Horas trabajadas después de la jornada normal durante la noche (22:00 - 06:00).
                        Según el Artículo 69 de la LFT, se pagan con un 150% de recargo.
                    </p>
                    <p>
                        <strong>Día Festivo (3x):</strong> Todas las horas trabajadas en día festivo se pagan triple, según la LFT.
                    </p>
                    <p>
                        <strong>Horas Extras Semanales (2x):</strong> Horas que exceden las 48 horas semanales establecidas por la LFT.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
