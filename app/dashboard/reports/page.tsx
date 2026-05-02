"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    FileText, 
    Download, 
    Calendar, 
    TrendingUp, 
    CheckCircle2, 
    AlertTriangle,
    Users,
    Package,
    ClipboardList,
    Shield,
    Mail,
    Phone
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({
        from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        to: format(new Date(), "yyyy-MM-dd"),
    });
    const [reportType, setReportType] = useState<"summary" | "detailed" | "compliance">("summary");
    const [branchId, setBranchId] = useState<string>("all");
    const [generating, setGenerating] = useState<string | null>(null);
  const [availableBranches, setAvailableBranches] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        const branches = Array.isArray(data) ? data : data.branches || [];
        setAvailableBranches(branches.map((b: any) => ({ id: b.id, name: b.name })));
      })
      .catch(() => {});
  }, []);

    const reports = [
        {
            id: "workflow-summary",
            name: "Resumen de Workflows",
            description: "Resumen ejecutivo de todos los workflows ejecutados en el período seleccionado",
            icon: ClipboardList,
            category: "WORKFLOWS",
            formats: ["PDF", "Excel"],
        },
        {
            id: "workflow-detailed",
            name: "Reporte Detallado de Workflows",
            description: "Listado completo de workflows con estado, tiempos, asignados y resultados",
            icon: FileText,
            category: "WORKFLOWS",
            formats: ["PDF", "Excel", "CSV"],
        },
        {
            id: "evidence-report",
            name: "Reporte de Evidencias",
            description: "Catálogo de todas las evidencias subidas con verificación AI incluida",
            icon: CheckCircle2,
            category: "EVIDENCE",
            formats: ["PDF"],
        },
        {
            id: "compliance-nom251",
            name: "Cumplimiento NOM-251",
            description: "Reporte oficial de cumplimiento de higiene y salud (COFEPRIS)",
            icon: Shield,
            category: "COMPLIANCE",
            formats: ["PDF"],
            official: true,
        },
        {
            id: "compliance-nom035",
            name: "Cumplimiento NOM-035",
            description: "Reporte de factores de riesgo psicosocial (STPS)",
            icon: Users,
            category: "COMPLIANCE",
            formats: ["PDF"],
            official: true,
            comingSoon: true,
        },
        {
            id: "inventory-status",
            name: "Estado de Inventario",
            description: "Reporte de stock, mermas, caducidades y movimientos de inventario",
            icon: Package,
            category: "INVENTORY",
            formats: ["PDF", "Excel"],
        },
        {
            id: "labor-attendance",
            name: "Asistencia y Horas",
            description: "Reporte de asistencia, horas trabajadas, horas extras y retardos",
            icon: Calendar,
            category: "LABOR",
            formats: ["PDF", "Excel"],
        },
        {
            id: "performance-kpis",
            name: "KPIs de Rendimiento",
            description: "Indicadores clave de rendimiento con tendencias y comparativas",
            icon: TrendingUp,
            category: "ANALYTICS",
            formats: ["PDF", "Excel"],
        },
        {
            id: "incidents-report",
            name: "Reporte de Incidentes",
            description: "Listado de incidentes registrados con estado de resolución",
            icon: AlertTriangle,
            category: "INCIDENTS",
            formats: ["PDF"],
        },
    ];

    const handleGenerateReport = async (reportId: string, format: string) => {
        setGenerating(reportId);
        try {
            const response = await fetch("/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportId,
                    format,
                    dateFrom: dateRange.from,
                    dateTo: dateRange.to,
                    branchId: branchId === "all" ? null : branchId,
                    reportType,
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const ext = format.toLowerCase() === "excel" ? "xlsx" : "pdf";
                a.download = `${reportId}-${Date.now()}.${ext}`;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success(`Reporte generado: ${reportId}.${format.toLowerCase()}`);
            } else {
                throw new Error("Failed to generate report");
            }
        } catch (error) {
            console.error("Failed to generate report:", error);
            toast.error("Error al generar el reporte");
        } finally {
            setGenerating(null);
        }
    };

    const handleSendReport = async (reportId: string, method: "email" | "whatsapp") => {
        toast.info(`Enviando reporte por ${method === "email" ? "correo" : "WhatsApp"}...`);
        // TODO: Implement send functionality
    };

    const categories = ["ALL", "WORKFLOWS", "EVIDENCE", "COMPLIANCE", "INVENTORY", "LABOR", "ANALYTICS", "INCIDENTS"];
    const [selectedCategory, setSelectedCategory] = useState("ALL");

    const filteredReports = reports.filter(r => 
        selectedCategory === "ALL" || r.category === selectedCategory
    );

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Reportes</h1>
                    <p className="text-muted-foreground mt-1">
                        Genera y descarga reportes de todas las áreas del sistema
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Workflows en Período
                        </CardDescription>
                        <CardTitle className="text-3xl">156</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Tasa de Completación
                        </CardDescription>
                        <CardTitle className="text-3xl text-green-600">94%</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Cumplimiento NOM
                        </CardDescription>
                        <CardTitle className="text-3xl text-blue-600">98%</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Incidentes
                        </CardDescription>
                        <CardTitle className="text-3xl text-orange-600">3</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Configuración de Reportes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha desde</Label>
                            <Input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha hasta</Label>
                            <Input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sucursal</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las sucursales" />
                                </SelectTrigger>
                                <SelectContent>
<SelectItem value="all">Todas las sucursales</SelectItem>
                {availableBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Reporte</Label>
                            <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="summary">Resumen</SelectItem>
                                    <SelectItem value="detailed">Detallado</SelectItem>
                                    <SelectItem value="compliance">Cumplimiento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reports by Category */}
            <Tabs defaultValue="ALL" value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-8">
                    <TabsTrigger value="ALL">Todos</TabsTrigger>
                    <TabsTrigger value="WORKFLOWS">Workflows</TabsTrigger>
                    <TabsTrigger value="EVIDENCE">Evidencias</TabsTrigger>
                    <TabsTrigger value="COMPLIANCE">Cumplimiento</TabsTrigger>
                    <TabsTrigger value="INVENTORY">Inventario</TabsTrigger>
                    <TabsTrigger value="LABOR">Personal</TabsTrigger>
                    <TabsTrigger value="ANALYTICS">KPIs</TabsTrigger>
                    <TabsTrigger value="INCIDENTS">Incidentes</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedCategory} className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredReports.map((report) => (
                            <Card key={report.id} className={report.comingSoon ? "opacity-60" : ""}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <report.icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{report.name}</CardTitle>
                                                {report.official && (
                                                    <Badge className="mt-1 bg-blue-500 text-xs">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Oficial
                                                    </Badge>
                                                )}
                                                {report.comingSoon && (
                                                    <Badge variant="secondary" className="mt-1 text-xs">
                                                        Próximamente
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <CardDescription className="text-sm mt-2">
                                        {report.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-1">
                                            {report.formats.map((fmt) => (
                                                <Badge key={fmt} variant="outline" className="text-xs">
                                                    {fmt}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            {!report.comingSoon && report.formats.map((fmt) => (
                                                <Button
                                                    key={fmt}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    disabled={generating === report.id}
                                                    onClick={() => handleGenerateReport(report.id, fmt)}
                                                >
                                                    {generating === report.id ? (
                                                        <Calendar className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Download className="h-4 w-4 mr-1" />
                                                            {fmt}
                                                        </>
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                        {!report.comingSoon && (
                                            <div className="flex gap-2 pt-2 border-t">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={() => handleSendReport(report.id, "email")}
                                                >
                                                    <Mail className="h-4 w-4 mr-1" />
                                                    Email
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={() => handleSendReport(report.id, "whatsapp")}
                                                >
                                                    <Phone className="h-4 w-4 mr-1" />
                                                    WhatsApp
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Scheduled Reports */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Reportes Programados
                    </CardTitle>
                    <CardDescription>
                        Configura reportes automáticos que se envían periódicamente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <ClipboardList className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Resumen Semanal de Workflows</p>
                                    <p className="text-sm text-muted-foreground">
                                        Se envía todos los lunes a las 8:00 AM
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Activo
                                </Badge>
                                <Button variant="ghost" size="sm">Editar</Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Reporte Mensual NOM-251</p>
                                    <p className="text-sm text-muted-foreground">
                                        Se envía el primer día de cada mes
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Activo
                                </Badge>
                                <Button variant="ghost" size="sm">Editar</Button>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Programar Nuevo Reporte
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
