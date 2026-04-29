"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calendar, Download, Users, Copy, FileSpreadsheet } from "lucide-react";
import { WeeklyMatrixView } from "./WeeklyMatrixView";
import { useShiftValidation, useShiftExport } from "@/hooks";

// Mock data - replace with actual data fetching
const MOCK_BRANCHES = [
  { id: "1", name: "Sucursal Centro" },
  { id: "2", name: "Sucursal Norte" },
  { id: "3", name: "Sucursal Sur" },
];

const MOCK_ROLES = ["COCINERO", "MESERO", "CAJERO", "LIMPIEZA", "GERENTE"];

const MOCK_EMPLOYEES = [
  { id: "1", name: "Juan Pérez" },
  { id: "2", name: "María García" },
  { id: "3", name: "Carlos López" },
  { id: "4", name: "Ana Martínez" },
];

export function ShiftSchedulerContainer() {
  const [activeTab, setActiveTab] = useState("weekly");
  const { validationState, conflictSummary } = useShiftValidation();
  const { exportToCSV, exportToExcel, exportToPDF, isExporting } = useShiftExport();

  // Mock shift data for export
  const mockShifts: any[] = [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Turnos</h1>
          <p className="text-muted-foreground">
            Administra los horarios de tus empleados de manera eficiente
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conflictSummary.hasConflicts && (
            <Alert variant="destructive" className="py-2 px-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {conflictSummary.errorCount} conflicto(s) detectado(s)
              </AlertDescription>
            </Alert>
          )}
          <Button variant="outline" disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_EMPLOYEES.length}</div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sucursales</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_BRANCHES.length}</div>
            <p className="text-xs text-muted-foreground">Configuradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflictos</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${conflictSummary.errorCount > 0 ? "text-red-500" : ""}`}>
              {conflictSummary.errorCount}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weekly">Vista Semanal</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="bulk">Asignación Masiva</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-6">
          <WeeklyMatrixView
            branches={MOCK_BRANCHES}
            roles={MOCK_ROLES}
            employees={MOCK_EMPLOYEES}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Turnos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gestiona plantillas predefinidas para turnos recurrentes.
                Esta funcionalidad estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Asignación Masiva</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Crea múltiples turnos para varios empleados a la vez.
                Esta funcionalidad estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
