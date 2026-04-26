"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, FileText, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ComplianceReportDialogProps {
    branchId: string;
    companyId?: string;
}

export function ComplianceReportDialog({ branchId, companyId }: ComplianceReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState<"NOM-251" | "NOM-035">("NOM-251");
    const [startDate, setStartDate] = useState<Date | undefined>(
        new Date(new Date().setMonth(new Date().getMonth() - 1))
    );
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());

    const handleGenerateReport = async (reportFormat: "pdf" | "json") => {
        if (!startDate || !endDate) {
            toast.error("Selecciona un rango de fechas válido");
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: reportType,
                branchId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
      format: reportFormat
    });

    const response = await fetch(`/api/reports/compliance?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al generar reporte");
    }

    if (reportFormat === "pdf") {
                // Download PDF
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${reportType}-report-${format(startDate, "yyyy-MM-dd", { locale: es })}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
                toast.success("Reporte PDF descargado exitosamente");
            } else {
                // Show JSON data
                const data = await response.json();
                console.log("Report data:", data);
                toast.success("Reporte generado exitosamente");
            }

            setOpen(false);
        } catch (error) {
            console.error("Error generating report:", error);
            toast.error(error instanceof Error ? error.message : "Error al generar reporte");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Reporte
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Generar Reporte de Compliance</DialogTitle>
                    <DialogDescription>
                        Selecciona el tipo de reporte y el período a reportar
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Report Type */}
                    <div className="grid gap-2">
                        <Label htmlFor="report-type">Tipo de Reporte</Label>
                        <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
                            <SelectTrigger id="report-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NOM-251">
                                    NOM-251 - Higiene en Alimentos
                                </SelectItem>
                                <SelectItem value="NOM-035">
                                    NOM-035 - Riesgos Psicosociales
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {reportType === "NOM-251"
                                ? "Reporte de inspecciones de higiene y manejo de alimentos"
                                : "Reporte de evaluación de riesgos psicosociales en el trabajo"}
                        </p>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Fecha de Inicio</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="h-4 w-4 mr-2" />
                                        {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid gap-2">
                            <Label>Fecha de Fin</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="h-4 w-4 mr-2" />
                                        {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Report Info */}
                    <div className="rounded-lg bg-muted p-4">
                        <h4 className="text-sm font-medium mb-2">El reporte incluirá:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            {reportType === "NOM-251" ? (
                                <>
                                    <li>• Total de inspecciones realizadas</li>
                                    <li>• Tasa de cumplimiento por categoría</li>
                                    <li>• Detalle de inspecciones con evidencias</li>
                                    <li>• Firmas digitales y huella del reporte</li>
                                </>
                            ) : (
                                <>
                                    <li>• Total de evaluaciones psicosociales</li>
                                    <li>• Distribución por nivel de riesgo</li>
                                    <li>• Análisis por factores de riesgo</li>
                                    <li>• Evaluaciones individuales por empleado</li>
                                    <li>• Recomendaciones y acciones prioritarias</li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleGenerateReport("json")}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                        Ver Datos
                    </Button>
                    <Button
                        onClick={() => handleGenerateReport("pdf")}
                        disabled={loading || !startDate || !endDate}
                    >
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Descargar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
