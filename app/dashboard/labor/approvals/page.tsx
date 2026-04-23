import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApprovalManager } from "@/components/labor/approval-manager"
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function LaborApprovalsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Aprobaciones de Turnos y Overtime</h1>
                <p className="text-muted-foreground">
                    Gestiona las solicitudes de aprobación de horas extras, cambios de turno y permisos
                </p>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">Revisión</div>
                        <p className="text-xs text-muted-foreground">
                            Requieren tu atención
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Autorizadas</div>
                        <p className="text-xs text-muted-foreground">
                            Turnos y overtime aprobado
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">Denegadas</div>
                        <p className="text-xs text-muted-foreground">
                            Con razón de rechazo
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tipos</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">5 Tipos</div>
                        <p className="text-xs text-muted-foreground">
                            Overtime, cambios, permisos
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Approval Manager Component */}
            <ApprovalManager />

            {/* Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Tipos de Aprobación</CardTitle>
                    <CardDescription>
                        Las solicitudes que puedes gestionar
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="font-medium">Overtime</p>
                            <p className="text-sm text-muted-foreground">
                                Horas extras detectadas automáticamente
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium">Cambio de Turno</p>
                            <p className="text-sm text-muted-foreground">
                                Modificaciones de horario
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium">Permisos</p>
                            <p className="text-sm text-muted-foreground">
                                Time off y días libres
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-medium">Intercambios</p>
                            <p className="text-sm text-muted-foreground">
                                Swap entre empleados
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="font-medium">Salida Temprana</p>
                            <p className="text-sm text-muted-foreground">
                                Early departure approvals
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
