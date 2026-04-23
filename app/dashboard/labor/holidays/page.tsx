import { HolidayCalendar } from "@/components/labor/holiday-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flag, Calendar, Info } from "lucide-react"

export default function HolidaysPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Calendario de Días Festivos</h1>
                <p className="text-muted-foreground mt-1">
                    Gestiona los días festivos de tu empresa. Estos días se tendrán en cuenta en la planificación de turnos.
                </p>
            </div>

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Información Importante
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        <strong className="text-foreground">✓</strong> Los días festivos aparecen marcados en el calendario semanal de turnos
                    </p>
                    <p>
                        <strong className="text-foreground">✓</strong> Puedes configurar días festivos específicos para tu empresa
                    </p>
                    <p>
                        <strong className="text-foreground">✓</strong> Los festivos se consideran al calcular días laborables y turnos
                    </p>
                </CardContent>
            </Card>

            {/* Holiday Calendar Component */}
            <HolidayCalendar />
        </div>
    )
}
