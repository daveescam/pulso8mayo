"use client"

import { AlertCircle, AlertTriangle, Info, ArrowRight } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Incident {
    id: string;
    title: string;
    severity: string;
    detectedAt: string;
    status: string;
}

interface CriticalIncidentsListProps {
    incidents: Incident[];
}

export function CriticalIncidentsList({ incidents }: CriticalIncidentsListProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  }

  const getSeverityBadge = (severity: string) => {
      switch (severity) {
          case 'CRITICAL': return <Badge variant="destructive">CRÍTICO</Badge>;
          case 'WARNING': return <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">ADVERTENCIA</Badge>;
          default: return <Badge variant="outline">INFO</Badge>;
      }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Incidentes Críticos
        </CardTitle>
        <CardDescription>
          Alertas que requieren atención inmediata
        </CardDescription>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg">
            <Info className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No hay incidentes críticos abiertos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-start justify-between p-3 rounded-lg border bg-background/50"
              >
                <div className="flex gap-3">
                  <div className="mt-1">
                    {getSeverityIcon(incident.severity)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{incident.title}</span>
                        {getSeverityBadge(incident.severity)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Detectado: {format(new Date(incident.detectedAt), "HH:mm 'hs'", { locale: es })}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
          <Button variant="link" size="sm" className="px-0 text-muted-foreground">
              Ver todos los incidentes
          </Button>
      </CardFooter>
    </Card>
  )
}
