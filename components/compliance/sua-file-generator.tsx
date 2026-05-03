"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileDown, Calculator, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SUAFileGeneratorProps {
  onGenerate?: (data: SUAData) => void;
  employeeIds?: string[];
  newSalaries?: Record<string, number>;
}

interface SUAData {
  period: string;
  companyId: string;
  employeeCount: number;
  totalSalary: number;
}

export function SUAFileGenerator({ onGenerate, employeeIds, newSalaries }: SUAFileGeneratorProps) {
  const [period, setPeriod] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("excel");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<SUAData | null>(null);

  const handleGenerate = async () => {
    if (!period) {
      toast.error("Selecciona un período");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/imss/sua-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds,
          newSalaries,
          fechaMovimiento: period,
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        let data: SUAData;

        if (contentType?.includes("application/json")) {
          const json = await response.json();
          data = {
            period,
            companyId: json.companyId || "",
            employeeCount: json.employeeCount || 0,
            totalSalary: json.totalSalary || 0,
          };
        } else {
          const blob = await response.blob();
          const text = await blob.text();
          const lineCount = text ? text.split("\r\n").filter(Boolean).length : 0;
          data = {
            period,
            companyId: "",
            employeeCount: lineCount,
            totalSalary: 0,
          };
        }

        setGeneratedData(data);

        if (onGenerate) {
          onGenerate(data);
        }

        toast.success("Archivo SUA generado exitosamente");
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || "Error al generar archivo SUA");
      }
    } catch (error) {
      toast.error("Error al generar archivo SUA");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedData) return;

    try {
      const response = await fetch("/api/imss/sua-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds,
          newSalaries,
          fechaMovimiento: generatedData.period,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SUA_${generatedData.period}.${selectedFormat === "excel" ? "xlsx" : selectedFormat}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Archivo SUA descargado");
      } else {
        toast.error("Error al descargar archivo");
      }
    } catch (error) {
      toast.error("Error al descargar archivo");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Generador de Archivo SUA
        </CardTitle>
        <CardDescription>
          Genera archivos de Actualización de Salarios para reporte mensual al IMSS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Los archivos SUA deben enviarse al IMSS antes del 17 de cada mes para los salarios del mes anterior.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="period">Período de Reporte</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-04">Abril 2026</SelectItem>
                <SelectItem value="2026-03">Marzo 2026</SelectItem>
                <SelectItem value="2026-02">Febrero 2026</SelectItem>
                <SelectItem value="2026-01">Enero 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Formato de Archivo</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="txt">Texto (.txt)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {generatedData && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Archivo Generado Exitosamente</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">Período</p>
                  <p className="text-sm text-muted-foreground">{generatedData.period}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Empleados</p>
                  <p className="text-sm text-muted-foreground">{generatedData.employeeCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Salario Total</p>
                  <p className="text-sm text-muted-foreground">
                    ${generatedData.totalSalary.toLocaleString()} MXN
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Estado</p>
                  <Badge variant="default">Listo</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownload} size="sm">
                  <FileDown className="h-4 w-4 mr-2" />
                  Descargar Archivo
                </Button>
                <Button variant="outline" size="sm">
                  Enviar al IMSS
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !period}
          >
            {isGenerating ? "Generando..." : "Generar Archivo SUA"}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Qué incluye:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Identificación del empleado (NSS, CURP, RFC)</li>
            <li>Información salarial (tasa diaria, semanal, mensual)</li>
            <li>Detalles de horario laboral (horas, días)</li>
            <li>Cálculos de contribución (porciones patrón/trabajador)</li>
            <li>Información de sucursal y empresa IMSS</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
