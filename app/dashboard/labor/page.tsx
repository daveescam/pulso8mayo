import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, MapPin, TrendingUp, FileText, ArrowLeftRight, Flag, CheckSquare, Coffee, FolderOpen, UserCheck } from "lucide-react"
import Link from "next/link"

export default function LaborManagementPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
                <p className="text-muted-foreground">
                    Administra turnos, asistencia, horas extras, breaks y expediente laboral de tu equipo
                </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Employee Directory - NEW */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                    <Link href="/dashboard/employees">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Directorio</CardTitle>
                            <UserCheck className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Empleados</div>
                            <p className="text-xs text-muted-foreground">
                                Perfiles y expedientes
                            </p>
                            <Button className="w-full mt-4" variant="default" size="sm">
                                Ver Directorio
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Aprobaciones - NEW */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-500">
                    <Link href="/dashboard/labor/approvals">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aprobaciones</CardTitle>
                            <CheckSquare className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Gestión</div>
                            <p className="text-xs text-muted-foreground">
                                Overtime, cambios y permisos
                            </p>
                            <Button className="w-full mt-4" variant="default" size="sm">
                                Ver Solicitudes
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Asistencia */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/labor/attendance">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Reportes</div>
                            <p className="text-xs text-muted-foreground">
                                Horas trabajadas, breaks y overtime
                            </p>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Ver Reportes
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Horas Extras */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/labor/overtime">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Horas Extras</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Cálculo LFT</div>
                            <p className="text-xs text-muted-foreground">
                                Según ley federal de trabajo
                            </p>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Ver Dashboard
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Turnos */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/labor/shifts">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Turnos</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Gestión</div>
                            <p className="text-xs text-muted-foreground">
                                Turnos actuales y próximos
                            </p>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Gestionar
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Breaks - NEW */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/labor/breaks">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Breaks</CardTitle>
                            <Coffee className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Pausas Activas</div>
                            <p className="text-xs text-muted-foreground">
                                Control NOM-035
                            </p>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Gestionar
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Expediente Laboral - NEW */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/labor/documents">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expediente</CardTitle>
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Documentos</div>
                            <p className="text-xs text-muted-foreground">
                                Gestión documental
                            </p>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Ver Expedientes
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Cambios de Turno */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/labor/shift-changes">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cambios de Turno</CardTitle>
                            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Intercambios</div>
                            <p className="text-xs text-muted-foreground">
                                Solicita y aprueba cambios
                            </p>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Ver Solicitudes
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Días Festivos */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/labor/holidays">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Días Festivos</CardTitle>
                            <Flag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Calendario</div>
                            <p className="text-xs text-muted-foreground">
                                Gestiona festivos de la empresa
                            </p>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Ver Calendario
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Constructor de Horarios */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/labor/schedule-builder">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Horarios</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Constructor</div>
                            <p className="text-xs text-muted-foreground">
                                Planifica turnos semanalmente
                            </p>
                            <Button className="w-full mt-4" variant="default" size="sm">
                                Crear Horario
                            </Button>
                        </CardContent>
                    </Link>
                </Card>

                {/* Geolocalización */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/dashboard/labor/geolocation">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Geolocalización</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Verificación</div>
                            <p className="text-xs text-muted-foreground">
                                Clock-in con GPS
                            </p>
                            <Button className="w-full mt-4" variant="outline" size="sm">
                                Ver Mapa
                            </Button>
                        </CardContent>
                    </Link>
                </Card>
            </div>

            {/* Information Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Características Principales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>✓ <strong>Calendarización visual</strong> - Arrastra y suelta para asignar turnos</p>
                        <p>✓ <strong>Verificación GPS</strong> - Clock-in con validación de ubicación</p>
                        <p>✓ <strong>Cálculo automático</strong> - Horas extras según LFT mexicana</p>
                        <p>✓ <strong>Cambios de turno</strong> - Intercambios entre empleados con aprobación</p>
                        <p>✓ <strong>Días festivos</strong> - Calendario de festivos de la empresa</p>
                        <p>✓ <strong>Reportes exportables</strong> - CSV y PDF disponibles</p>
                        <p>✓ <strong>Notificaciones multi-canal</strong> - WhatsApp, Email, In-App</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Atajos Rápidos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/dashboard/labor/schedule-builder">
                                    Nuevo Horario
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/dashboard/labor/attendance">
                                    Ver Asistencia
                                </Link>
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/dashboard/labor/shift-changes">
                                    Cambios de Turno
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/dashboard/labor/holidays">
                                    Días Festivos
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
