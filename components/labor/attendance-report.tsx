"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Download, Filter, Clock, Calendar, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { AttendanceRecord } from "@/app/api/reports/attendance/route"

interface AttendanceReportProps {
    initialData?: {
        data: AttendanceRecord[]
        summary: any
    }
}

interface Summary {
    totalRecords: number
    totalWorkMinutes: number
    totalBreakMinutes: number
    totalOvertimeMinutes: number
    completedShifts: number
    activeShifts: number
    uniqueEmployees: number
}

export function AttendanceReport({ initialData }: AttendanceReportProps) {
    const [records, setRecords] = React.useState<AttendanceRecord[]>(initialData?.data || [])
    const [summary, setSummary] = React.useState<Summary>(initialData?.summary || {
        totalRecords: 0,
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        totalOvertimeMinutes: 0,
        completedShifts: 0,
        activeShifts: 0,
        uniqueEmployees: 0
    })
    const [loading, setLoading] = React.useState(false)

    // Filters
    const [startDate, setStartDate] = React.useState(() => {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        return format(date, "yyyy-MM-dd")
    })
    const [endDate, setEndDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"))
    const [branchId, setBranchId] = React.useState<string>("")
    const [userId, setUserId] = React.useState<string>("")

    const fetchReport = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                startDate,
                endDate
            })

            if (branchId) params.append("branchId", branchId)
            if (userId) params.append("userId", userId)

            const response = await fetch(`/api/reports/attendance?${params.toString()}`)
            if (!response.ok) throw new Error("Error al cargar reporte")

            const result = await response.json()
            setRecords(result.data)
            setSummary(result.summary)
            toast.success("Reporte actualizado")
        } catch (error) {
            console.error("Error fetching report:", error)
            toast.error("Error al cargar el reporte")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = (format: "csv" | "pdf") => {
        if (records.length === 0) {
            toast.error("No hay datos para exportar")
            return
        }

        if (format === "csv") {
            exportToCSV()
        } else {
            toast.info("Exportación a PDF próximamente")
            // TODO: Implement PDF export using jsPDF
        }
    }

    const exportToCSV = () => {
        const headers = [
            "Fecha",
            "Empleado",
            "Email",
            "Rol",
            "Sucursal",
            "Entrada",
            "Salida",
            "Horas Trabajadas",
            "Break (min)",
            "Overtime (min)",
            "Estado"
        ]

        const csvData = records.map(record => [
            record.date,
            record.userName,
            record.userEmail,
            record.userRole,
            record.branchName,
            record.clockIn ? format(parseISO(record.clockIn), "HH:mm") : "N/A",
            record.clockOut ? format(parseISO(record.clockOut), "HH:mm") : "N/A",
            (record.totalWorkMinutes / 60).toFixed(2),
            record.breakMinutes,
            record.overtimeMinutes,
            record.status
        ])

        const csv = [
            headers.join(","),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n")

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `asistencia_${startDate}_a_${endDate}.csv`
        link.click()

        toast.success("Reporte exportado a CSV")
    }

    const formatMinutesToHours = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        return `${hours}h ${mins}m`
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filtros
                            </CardTitle>
                            <CardDescription>
                                Personaliza el reporte de asistencia
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleExport("csv")}
                                disabled={records.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar CSV
                            </Button>
                            <Button
                                onClick={fetchReport}
                                disabled={loading}
                            >
                                {loading ? "Cargando..." : "Aplicar Filtros"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                        <div className="space-y-2">
                            <Label htmlFor="branch">Sucursal</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las sucursales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las sucursales</SelectItem>
                                    <SelectItem value="branch-1">Sucursal Centro</SelectItem>
                                    <SelectItem value="branch-2">Sucursal Norte</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="employee">Empleado</Label>
                            <Select value={userId} onValueChange={setUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los empleados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los empleados</SelectItem>
                                    <SelectItem value="user-1">Juan Pérez</SelectItem>
                                    <SelectItem value="user-2">María García</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalRecords}</div>
                        <p className="text-xs text-muted-foreground">
                            {summary.uniqueEmployees} empleados únicos
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Horas Trabajadas</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatMinutesToHours(summary.totalWorkMinutes)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatMinutesToHours(summary.totalWorkMinutes / (summary.totalRecords || 1))} promedio
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overtime</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatMinutesToHours(summary.totalOvertimeMinutes)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.totalOvertimeMinutes > 0 ? "⚠️ Revisar" : "✓ Sin overtime"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Turnos Completados</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.completedShifts}/{summary.totalRecords}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.activeShifts} activos actualmente
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Asistencia</CardTitle>
                    <CardDescription>
                        Registro individual de cada turno
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Sucursal</TableHead>
                                <TableHead>Entrada</TableHead>
                                <TableHead>Salida</TableHead>
                                <TableHead className="text-right">Horas Trabajadas</TableHead>
                                <TableHead className="text-right">Break</TableHead>
                                <TableHead className="text-right">Overtime</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        No hay registros de asistencia en el período seleccionado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                records.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">
                                            {format(parseISO(record.date), "dd/MMM", { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{record.userName}</div>
                                                <div className="text-xs text-muted-foreground">{record.userRole}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{record.branchName}</TableCell>
                                        <TableCell>
                                            {record.clockIn
                                                ? format(parseISO(record.clockIn), "HH:mm")
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {record.clockOut
                                                ? format(parseISO(record.clockOut), "HH:mm")
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatMinutesToHours(record.totalWorkMinutes)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {record.breakMinutes}m
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={record.overtimeMinutes > 0 ? "destructive" : "secondary"}
                                                className="text-xs"
                                            >
                                                {record.overtimeMinutes}m
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    record.status === "COMPLETED"
                                                        ? "default"
                                                        : record.status === "ACTIVE"
                                                        ? "secondary"
                                                        : "destructive"
                                                }
                                                className="text-xs"
                                            >
                                                {record.status === "COMPLETED"
                                                    ? "Completado"
                                                    : record.status === "ACTIVE"
                                                    ? "Activo"
                                                    : "No se presentó"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
