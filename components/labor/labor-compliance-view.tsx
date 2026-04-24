"use client"

import * as React from "react"
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
    AlertTriangle, CheckCircle2, Clock, FileSpreadsheet, Download, 
    TrendingUp, TrendingDown, Minus, Calendar, Users, BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface LaborComplianceReport {
    summary: {
        generatedAt: string
        period: { start: string; end: string }
        totalEmployees: number
        totalHours: number
        totalOvertime: number
        compliantCount: number
        warningCount: number
        violationCount: number
        avgBreakCompliance: number
    }
    details: Array<{
        userId: string
        userName: string
        userRole: string
        weeklyHours: string
        scheduledHours: string
        overtime: {
            total: number
            rate1: number
            rate2: number
            rate3: number
        }
        breakMinutes: number
        breakCompliance: number
        sessionsCompleted: number
        sessionsNoShow: number
        status: "compliant" | "warning" | "violation"
        daily: Record<string, number>
    }>
}

interface LaborComplianceViewProps {
    branchId: string
    currentDate: Date
}

export function LaborComplianceView({ branchId, currentDate }: LaborComplianceViewProps) {
    const [loading, setLoading] = React.useState(true)
    const [report, setReport] = React.useState<LaborComplianceReport | null>(null)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        loadReport()
    }, [branchId, currentDate])

    const loadReport = async () => {
        setLoading(true)
        setError(null)
        
        try {
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
            const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
            
            const res = await fetch(
                `/api/analytics/labor-compliance?branchId=${branchId}&start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`
            )
            
            if (!res.ok) {
                throw new Error("Error cargando reporte")
            }
            
            const data = await res.json()
            setReport(data.data)
        } catch (e) {
            console.error("Error loading report:", e)
            setError(e instanceof Error ? e.message : "Error desconocido")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        if (!report) return
        
        try {
            const headers = [
                "Empleado",
                "Rol",
                "Horas Semanales",
                "Horas Programadas",
                "Horas Extra (1x)",
                "Horas Extra (2x)",
                "Horas Extra (3x)",
                "Minutos Descanso",
                "% Cumplimiento Descanso",
                "Sesiones Completadas",
                "Estado"
            ]
            
            const rows = report.details.map(d => [
                d.userName,
                d.userRole,
                d.weeklyHours,
                d.scheduledHours,
                Math.round(d.overtime.rate1 / 60 * 10) / 10,
                Math.round(d.overtime.rate2 / 60 * 10) / 10,
                Math.round(d.overtime.rate3 / 60 * 10) / 10,
                d.breakMinutes.toString(),
                d.breakCompliance.toString(),
                d.sessionsCompleted.toString(),
                d.status
            ])
            
            const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n")
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const link = document.createElement("a")
            link.href = URL.createObjectURL(blob)
            link.download = `reporte-laboral-${format(new Date(), "yyyy-MM-dd")}.csv`
            link.click()
            
            toast.success("Reporte exportado correctamente")
        } catch (e) {
            toast.error("Error exportando reporte")
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "compliant": return "text-green-600"
            case "warning": return "text-yellow-600"
            case "violation": return "text-red-600"
            default: return "text-gray-600"
        }
    }

    const getStatusBg = (status: string) => {
        switch (status) {
            case "compliant": return "bg-green-50 border-green-200"
            case "warning": return "bg-yellow-50 border-yellow-200"
            case "violation": return "bg-red-50 border-red-200"
            default: return "bg-gray-50 border-gray-200"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "compliant": return <CheckCircle2 className="h-4 w-4 text-green-600" />
            case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-600" />
            case "violation": return <AlertTriangle className="h-4 w-4 text-red-600" />
            default: return <Minus className="h-4 w-4 text-gray-600" />
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin text-primary">Cargando reporte...</div>
            </div>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                    <p className="text-destructive">{error}</p>
                    <Button variant="outline" className="mt-4" onClick={loadReport}>
                        Reintentar
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (!report) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Empleados</p>
                                <p className="text-2xl font-bold">{report.summary.totalEmployees}</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Horas Totales</p>
                                <p className="text-2xl font-bold">{report.summary.totalHours.toFixed(1)}</p>
                            </div>
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Horas Extra</p>
                                <p className={cn("text-2xl font-bold", report.summary.totalOvertime > 0 && "text-orange-600")}>
                                    {report.summary.totalOvertime > 0 
                                        ? `${Math.floor(report.summary.totalOvertime / 60)}h ${report.summary.totalOvertime % 60}m`
                                        : "0h"}
                                </p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Cumplimiento Descansos</p>
                                <p className="text-2xl font-bold">{report.summary.avgBreakCompliance}%</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <Progress value={report.summary.avgBreakCompliance} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Compliance Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={cn("border-2", getStatusBg("compliant"))}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                            <div>
                                <p className="text-sm text-muted-foreground">Cumplidos</p>
                                <p className="text-3xl font-bold text-green-600">{report.summary.compliantCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className={cn("border-2", getStatusBg("warning"))}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-10 w-10 text-yellow-600" />
                            <div>
                                <p className="text-sm text-muted-foreground">Advertencias</p>
                                <p className="text-3xl font-bold text-yellow-600">{report.summary.warningCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className={cn("border-2", getStatusBg("violation"))}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-10 w-10 text-red-600" />
                            <div>
                                <p className="text-sm text-muted-foreground">Violaciones</p>
                                <p className="text-3xl font-bold text-red-600">{report.summary.violationCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Details Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Detalle por Empleado</CardTitle>
                        <CardDescription>
                            Período: {format(parseISO(report.summary.period.start), "d 'de' MMMM")} - {format(parseISO(report.summary.period.end), "d 'de' MMMM, yyyy")}
                        </CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {report.details.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay datos de empleados en este período
                                </div>
                            ) : (
                                report.details.map((employee) => (
                                    <div
                                        key={employee.userId}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-lg border",
                                            getStatusBg(employee.status)
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            {getStatusIcon(employee.status)}
                                            <div>
                                                <p className="font-medium">{employee.userName}</p>
                                                <p className="text-sm text-muted-foreground">{employee.userRole}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-8 text-sm">
                                            <div className="text-center">
                                                <p className="text-muted-foreground">Horas</p>
                                                <p className="font-semibold">{employee.weeklyHours}h</p>
                                            </div>
                                            
                                            <div className="text-center">
                                                <p className="text-muted-foreground">Extra</p>
                                                <p className={cn("font-semibold", employee.overtime.total > 0 && "text-orange-600")}>
                                                    {employee.overtime.total > 0 
                                                        ? `${Math.floor(employee.overtime.total / 60)}h ${employee.overtime.total % 60}m`
                                                        : "-"}
                                                </p>
                                            </div>
                                            
                                            <div className="text-center">
                                                <p className="text-muted-foreground">Descanso</p>
                                                <p className="font-semibold">{employee.breakCompliance}%</p>
                                            </div>
                                            
                                            <div className="text-center">
                                                <p className="text-muted-foreground">Sesiones</p>
                                                <p className="font-semibold">{employee.sessionsCompleted}</p>
                                            </div>
                                            
                                            <Badge variant={
                                                employee.status === "compliant" ? "default" :
                                                employee.status === "warning" ? "secondary" : "destructive"
                                            }>
                                                {employee.status === "compliant" ? "Cumplido" :
                                                 employee.status === "warning" ? "Advertencia" : "Violación"}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}