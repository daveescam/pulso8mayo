"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, MessageCircle, Mail, Smartphone } from "lucide-react";

interface NotificationTest {
    type: string;
    name: string;
    description: string;
}

export function NotificationPreferences() {
    const [loading, setLoading] = useState(false);
    const [testType, setTestType] = useState<string>("");
    const [preferences, setPreferences] = useState({
        whatsappEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
        workflowAssignments: true,
        workflowDueSoon: true,
        workflowOverdue: true,
        incidents: true,
        stockAlerts: true,
        shiftReminders: true
    });

    const notificationTests: NotificationTest[] = [
        {
            type: "workflow_assignment",
            name: "Asignación de Workflow",
            description: "Prueba la notificación cuando se asigna una tarea"
        },
        {
            type: "stock_alert",
            name: "Alerta de Stock",
            description: "Prueba la notificación de stock bajo"
        },
        {
            type: "incident",
            name: "Incidente de Compliance",
            description: "Prueba la notificación de incidentes"
        },
        {
            type: "shift_reminder",
            name: "Recordatorio de Turno",
            description: "Prueba el recordatorio de turnos"
        }
    ];

    const handleSavePreferences = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/notifications/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preferences)
            });

            if (response.ok) {
                toast.success("Preferencias guardadas correctamente");
            } else {
                toast.error("Error al guardar preferencias");
            }
        } catch (error) {
            toast.error("Error al guardar preferencias");
        } finally {
            setLoading(false);
        }
    };

    const handleSendTest = async () => {
        if (!testType) {
            toast.error("Selecciona un tipo de notificación para probar");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/notifications/test-whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: testType
                })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
            } else {
                toast.error(result.error || "Error al enviar notificación");
            }
        } catch (error) {
            toast.error("Error al enviar notificación de prueba");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Channel Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Canales de Notificación
                    </CardTitle>
                    <CardDescription>
                        Configura por qué canales quieres recibir notificaciones
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <Label htmlFor="whatsapp">WhatsApp</Label>
                                <p className="text-sm text-muted-foreground">
                                    Recibe notificaciones en tu WhatsApp
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="whatsapp"
                            checked={preferences.whatsappEnabled}
                            onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, whatsappEnabled: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <p className="text-sm text-muted-foreground">
                                    Recibe notificaciones por correo electrónico
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="email"
                            checked={preferences.emailEnabled}
                            onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, emailEnabled: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-purple-600" />
                            <div>
                                <Label htmlFor="inapp">Notificaciones In-App</Label>
                                <p className="text-sm text-muted-foreground">
                                    Notificaciones dentro de la aplicación
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="inapp"
                            checked={preferences.inAppEnabled}
                            onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, inAppEnabled: checked }))
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Event Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Tipos de Notificación</CardTitle>
                    <CardDescription>
                        Elige qué tipos de notificaciones quieres recibir
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="workflow-assignments">Asignación de Workflows</Label>
                            <p className="text-sm text-muted-foreground">
                                Cuando se te asigne una nueva tarea
                            </p>
                        </div>
                        <Switch
                            id="workflow-assignments"
                            checked={preferences.workflowAssignments}
                            onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, workflowAssignments: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="workflow-due-soon">Workflows por Vencer</Label>
                            <p className="text-sm text-muted-foreground">
                                Recordatorio antes de la fecha límite
                            </p>
                        </div>
                        <Switch
                            id="workflow-due-soon"
                            checked={preferences.workflowDueSoon}
                            onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, workflowDueSoon: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="workflow-overdue">Workflows Vencidos</Label>
                            <p className="text-sm text-muted-foreground">
                                Cuando una tarea está vencida
                            </p>
                        </div>
                        <Switch
                            id="workflow-overdue"
                            checked={preferences.workflowOverdue}
                            onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, workflowOverdue: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="incidents">Incidentes de Compliance</Label>
                            <p className="text-sm text-muted-foreground">
                                Alertas de incidentes críticos
                            </p>
                        </div>
                        <Switch
                            id="incidents"
                            checked={preferences.incidents}
                            onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, incidents: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="stock-alerts">Alertas de Stock</Label>
                            <p className="text-sm text-muted-foreground">
                                Cuando el stock está bajo
                            </p>
                        </div>
                        <Switch
                            id="stock-alerts"
                            checked={preferences.stockAlerts}
                            onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, stockAlerts: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="shift-reminders">Recordatorios de Turno</Label>
                            <p className="text-sm text-muted-foreground">
                                Antes de tu turno programado
                            </p>
                        </div>
                        <Switch
                            id="shift-reminders"
                            checked={preferences.shiftReminders}
                            onCheckedChange={(checked) =>
                                setPreferences(prev => ({ ...prev, shiftReminders: checked }))
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Test Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle>Probar Notificaciones</CardTitle>
                    <CardDescription>
                        Envía notificaciones de prueba para verificar la configuración
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="test-type">Tipo de Notificación</Label>
                        <Select value={testType} onValueChange={setTestType}>
                            <SelectTrigger id="test-type">
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {notificationTests.map((test) => (
                                    <SelectItem key={test.type} value={test.type}>
                                        {test.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {testType && (
                            <p className="text-sm text-muted-foreground">
                                {notificationTests.find(t => t.type === testType)?.description}
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleSendTest}
                        disabled={loading || !testType}
                        className="w-full"
                    >
                        {loading ? "Enviando..." : "Enviar Notificación de Prueba"}
                    </Button>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSavePreferences} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Preferencias"}
                </Button>
            </div>
        </div>
    );
}
