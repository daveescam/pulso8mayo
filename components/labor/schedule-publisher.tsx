"use client"

import * as React from "react"
import { Calendar, Clock, Users, Send, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ShiftAssignment } from "./shift-assignment"

interface SchedulePublisherProps {
    assignments: ShiftAssignment[]
    weekStart: Date
    weekEnd: Date
    onPublish: (options: PublishOptions) => Promise<void>
}

interface PublishOptions {
    sendWhatsApp: boolean
    sendEmail: boolean
    sendInApp: boolean
    notifyAll: boolean
}

interface ShiftSummary {
    totalShifts: number
    totalEmployees: number
    shiftsByType: Record<string, number>
    shiftsByDay: Record<string, number>
    unpublishedCount: number
}

export function SchedulePublisher({
    assignments,
    weekStart,
    weekEnd,
    onPublish
}: SchedulePublisherProps) {
    const [isPublishing, setIsPublishing] = React.useState(false)
    const [options, setOptions] = React.useState<PublishOptions>({
        sendWhatsApp: true,
        sendEmail: true,
        sendInApp: true,
        notifyAll: true
    })
    const [published, setPublished] = React.useState(false)

    const calculateSummary = (): ShiftSummary => {
        const summary: ShiftSummary = {
            totalShifts: assignments.length,
            totalEmployees: new Set(assignments.map(a => a.employeeId)).size,
            shiftsByType: {},
            shiftsByDay: {},
            unpublishedCount: assignments.filter(a => a.status === "DRAFT").length
        }

        assignments.forEach(assignment => {
            // Count by type
            summary.shiftsByType[assignment.shiftType] = 
                (summary.shiftsByType[assignment.shiftType] || 0) + 1

            // Count by day
            const dayKey = format(new Date(assignment.date), "EEE", { locale: es })
            summary.shiftsByDay[dayKey] = 
                (summary.shiftsByDay[dayKey] || 0) + 1
        })

        return summary
    }

    const summary = calculateSummary()

    const handlePublish = async () => {
        if (assignments.length === 0) {
            toast.error("No hay turnos para publicar")
            return
        }

        setIsPublishing(true)
        try {
            await onPublish(options)
            setPublished(true)
            toast.success("Horario publicado exitosamente")
        } catch (error) {
            toast.error("Error al publicar el horario")
            console.error(error)
        } finally {
            setIsPublishing(false)
        }
    }

    if (published) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <div>
                            <CardTitle className="text-green-900">Horario Publicado</CardTitle>
                            <CardDescription className="text-green-700">
                                Las notificaciones han sido enviadas a todos los empleados
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{summary.totalShifts}</div>
                            <div className="text-sm text-muted-foreground">Turnos Publicados</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{summary.totalEmployees}</div>
                            <div className="text-sm text-muted-foreground">Empleados Notificados</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {options.sendWhatsApp ? "✓" : "✗"}
                            </div>
                            <div className="text-sm text-muted-foreground">WhatsApp Enviado</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Publicar Horario
                        </CardTitle>
                        <CardDescription>
                            Revisa y publica los turnos para la semana
                        </CardDescription>
                    </div>
                    <Badge variant={summary.unpublishedCount > 0 ? "secondary" : "default"}>
                        {summary.unpublishedCount} pendientes
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Calendar className="h-8 w-8 text-primary" />
                        <div>
                            <div className="text-2xl font-bold">{summary.totalShifts}</div>
                            <div className="text-sm text-muted-foreground">Total Turnos</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                            <div className="text-2xl font-bold">{summary.totalEmployees}</div>
                            <div className="text-sm text-muted-foreground">Empleados</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Clock className="h-8 w-8 text-primary" />
                        <div>
                            <div className="text-2xl font-bold">
                                {Object.keys(summary.shiftsByType).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Tipos de Turno</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <AlertCircle className="h-8 w-8 text-primary" />
                        <div>
                            <div className="text-2xl font-bold">{summary.unpublishedCount}</div>
                            <div className="text-sm text-muted-foreground">Sin Publicar</div>
                        </div>
                    </div>
                </div>

                {/* Shifts by Type */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Turnos por Tipo</h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(summary.shiftsByType).map(([type, count]) => (
                            <Badge key={type} variant="outline" className="px-3 py-1">
                                <span className="font-medium">{type}</span>
                                <span className="ml-2 text-muted-foreground">{count}</span>
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Shifts by Day */}
                <div>
                    <h4 className="text-sm font-medium mb-3">Turnos por Día</h4>
                    <div className="grid grid-cols-7 gap-2">
                        {Object.entries(summary.shiftsByDay).map(([day, count]) => (
                            <div key={day} className="text-center p-2 rounded-lg bg-muted/50">
                                <div className="text-xs text-muted-foreground uppercase">{day}</div>
                                <div className="text-lg font-bold">{count}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notification Options */}
                <div className="border-t pt-6">
                    <h4 className="text-sm font-medium mb-4">Opciones de Notificación</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                </div>
                                <div>
                                    <Label htmlFor="whatsapp-toggle" className="font-medium">WhatsApp</Label>
                                    <div className="text-sm text-muted-foreground">
                                        Enviar notificación por WhatsApp a todos los empleados
                                    </div>
                                </div>
                            </div>
                            <Switch
                                id="whatsapp-toggle"
                                checked={options.sendWhatsApp}
                                onCheckedChange={(checked) => setOptions({ ...options, sendWhatsApp: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <Label htmlFor="email-toggle" className="font-medium">Email</Label>
                                    <div className="text-sm text-muted-foreground">
                                        Enviar resumen por correo electrónico
                                    </div>
                                </div>
                            </div>
                            <Switch
                                id="email-toggle"
                                checked={options.sendEmail}
                                onCheckedChange={(checked) => setOptions({ ...options, sendEmail: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <Label htmlFor="inapp-toggle" className="font-medium">In-App</Label>
                                    <div className="text-sm text-muted-foreground">
                                        Notificación dentro de la aplicación
                                    </div>
                                </div>
                            </div>
                            <Switch
                                id="inapp-toggle"
                                checked={options.sendInApp}
                                onCheckedChange={(checked) => setOptions({ ...options, sendInApp: checked })}
                            />
                        </div>
                    </div>
                </div>

                {/* Warning */}
                {summary.unpublishedCount > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Turnos sin publicar</AlertTitle>
                        <AlertDescription>
                            Hay {summary.unpublishedCount} turnos en estado borrador. Se publicarán todos los turnos de la semana.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={handlePublish} 
                    disabled={isPublishing || assignments.length === 0}
                    className="w-full"
                >
                    {isPublishing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Publicando...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4 mr-2" />
                            Publicar Horario Semanal
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
