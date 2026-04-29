import { Metadata } from "next";
import { KpiBuilderClient } from "@/components/analytics/kpi-builder-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KPI Builder | Pulso",
  description: "Create custom Key Performance Indicators for your business",
};

export default function KpiBuilderPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/analytics">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">KPI Builder</h1>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
              Restaurant Edition
            </span>
          </div>
          <p className="text-muted-foreground">
            Crea indicadores clave de desempeño personalizados para tu grupo de restaurantes
          </p>
        </div>
      </div>

      {/* Main Content */}
      <KpiBuilderClient />

      {/* Help Section */}
      <div className="max-w-6xl space-y-4">
        <h2 className="text-xl font-semibold">Sobre los KPIs para Restaurantes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Operaciones</h3>
            <p className="text-sm text-muted-foreground">
              Métricas de flujos de trabajo, apertura/cierre, control de calidad, 
              temperaturas y eficiencia operativa por sucursal.
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Cumplimiento</h3>
            <p className="text-sm text-muted-foreground">
              NOM-251 (COFEPRIS), NOM-035 (STPS), documentación laboral y verificación 
              con IA para auditorías.
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Personal e Inventario</h3>
            <p className="text-sm text-muted-foreground">
              Asistencia, horas extra, pausas activas, rotación de inventario, 
              desabastos y control de mermas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
