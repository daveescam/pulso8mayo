import { ShiftChangeRequestList } from "@/components/labor/shift-change-request-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeftRight, Info } from "lucide-react"

export default function ShiftChangeRequestsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cambios de Turno</h1>
                <p className="text-muted-foreground mt-1">
                    Solicita y gestiona intercambios de turnos con otros empleados
                </p>
            </div>

            {/* Info Alert */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <strong>Cómo funciona:</strong> Solicita un intercambio de turno → El empleado acepta/rechaza → 
                    Un supervisor aprueba el cambio → Los turnos se intercambian automáticamente
                </AlertDescription>
            </Alert>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5" />
                            Para Empleados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            <strong className="text-foreground">1.</strong> Selecciona el turno que quieres intercambiar
                        </p>
                        <p>
                            <strong className="text-foreground">2.</strong> Elige un compañero y su turno (opcional)
                        </p>
                        <p>
                            <strong className="text-foreground">3.</strong> Explica la razón del cambio
                        </p>
                        <p>
                            <strong className="text-foreground">4.</strong> Espera la respuesta del compañero y aprobación del supervisor
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Para Supervisores
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            <strong className="text-foreground">1.</strong> Revisa las solicitudes pendientes de aprobación
                        </p>
                        <p>
                            <strong className="text-foreground">2.</strong> Verifica que ambos empleados estén de acuerdo
                        </p>
                        <p>
                            <strong className="text-foreground">3.</strong> Aprueba o rechaza según convenga
                        </p>
                        <p>
                            <strong className="text-foreground">4.</strong> El sistema actualiza los turnos automáticamente
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Shift Change Request List */}
            <ShiftChangeRequestList />
        </div>
    )
}
