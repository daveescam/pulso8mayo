"use client"

import { WeeklyShiftPlanner } from "@/components/labor/weekly-shift-planner"
import { RecurringShiftBuilder } from "@/components/labor/recurring-shift-builder"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Repeat } from "lucide-react"

export default function ShiftsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Turnos</h1>
                <p className="text-muted-foreground mt-1">
                    Planifica y asigna turnos para tu personal de forma semanal o recurrente
                </p>
            </div>

            <Tabs defaultValue="weekly" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="weekly" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Planificación Semanal
                    </TabsTrigger>
                    <TabsTrigger value="recurring" className="gap-2">
                        <Repeat className="h-4 w-4" />
                        Turnos Recurrentes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="weekly" className="space-y-4">
                    <div className="rounded-lg border bg-card p-4">
                        <h2 className="text-lg font-semibold mb-2">📅 Planificación Semanal</h2>
                        <p className="text-sm text-muted-foreground">
                            Visualiza y edita los turnos de tu personal en una vista de matriz semanal. 
                            Haz clic en cualquier celda para añadir un turno o modifica los existentes.
                        </p>
                    </div>
                    <WeeklyShiftPlanner />
                </TabsContent>

                <TabsContent value="recurring" className="space-y-4">
                    <div className="rounded-lg border bg-card p-4">
                        <h2 className="text-lg font-semibold mb-2">🔄 Turnos Recurrentes</h2>
                        <p className="text-sm text-muted-foreground">
                            Crea plantillas de turnos que se repiten automáticamente. 
                            Ideal para horarios fijos semanales o patrones que se mantienen en el tiempo.
                        </p>
                    </div>
                    <RecurringShiftBuilder />
                </TabsContent>
            </Tabs>
        </div>
    )
}
