"use client";

import * as React from "react";
import { format } from "date-fns";
import { Coffee, Play, Square, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

interface Break {
    id: string;
    sessionId: string;
    startTime: Date;
    endTime: Date | null;
    durationMinutes: number | null;
    type: string;
    isCompliant: boolean;
    complianceNotes: string | null;
}

interface BreakCompliance {
    isCompliant: boolean;
    issues: string[];
    breaks: Break[];
}

export function BreakManager() {
    const [activeBreak, setActiveBreak] = React.useState<Break | null>(null);
    const [breaks, setBreaks] = React.useState<Break[]>([]);
    const [compliance, setCompliance] = React.useState<BreakCompliance | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [workDuration, setWorkDuration] = React.useState(0); // in minutes

    // Fetch breaks on mount
    React.useEffect(() => {
        fetchBreaks();
    }, []);

    // Update work duration timer
    React.useEffect(() => {
        const interval = setInterval(() => {
            setWorkDuration(prev => prev + 1);
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    const fetchBreaks = async () => {
        try {
            const response = await fetch("/api/breaks");
            if (response.ok) {
                const result = await response.json();
                setBreaks(result.breaks || []);
                
                // Find active break
                const active = result.breaks?.find((b: Break) => !b.endTime);
                setActiveBreak(active || null);
            }
        } catch (error) {
            console.error("Error fetching breaks:", error);
        }
    };

    const handleStartBreak = async (type: string = 'STANDARD') => {
        setLoading(true);
        try {
            const response = await fetch("/api/breaks/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type })
            });

            if (response.ok) {
                const result = await response.json();
                setActiveBreak(result.break);
                setBreaks(prev => [...prev, result.break]);
                toast.success("Break iniciado");
            } else {
                const error = await response.json();
                toast.error(error.error || "Error al iniciar break");
            }
        } catch (error) {
            console.error("Error starting break:", error);
            toast.error("Error al iniciar break");
        } finally {
            setLoading(false);
        }
    };

    const handleEndBreak = async () => {
        if (!activeBreak) return;

        setLoading(true);
        try {
            const response = await fetch("/api/breaks/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                const result = await response.json();
                const updatedBreak = result.break;
                
                // Update breaks list
                setBreaks(prev => prev.map(b => 
                    b.id === updatedBreak.id ? updatedBreak : b
                ));
                setActiveBreak(null);
                
                toast.success(`Break terminado: ${updatedBreak.durationMinutes} minutos`);
                
                // Check compliance
                if (!updatedBreak.isCompliant) {
                    toast.warning(updatedBreak.complianceNotes || "Break no cumple con normativa");
                }
            } else {
                const error = await response.json();
                toast.error(error.error || "Error al terminar break");
            }
        } catch (error) {
            console.error("Error ending break:", error);
            toast.error("Error al terminar break");
        } finally {
            setLoading(false);
        }
    };

    const checkCompliance = async () => {
        try {
            const response = await fetch("/api/breaks/compliance");
            if (response.ok) {
                const result = await response.json();
                setCompliance(result);
                
                if (!result.isCompliant && result.issues.length > 0) {
                    toast.warning("Problemas de cumplimiento detectados");
                }
            }
        } catch (error) {
            console.error("Error checking compliance:", error);
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getBreakTypeLabel = (type: string) => {
        switch (type) {
            case 'MEAL': return 'Comida';
            case 'REST': return 'Descanso';
            case 'EMERGENCY': return 'Emergencia';
            default: return 'Estándar';
        }
    };

    const isBreakDue = workDuration > 300; // 5 hours
    const isMealBreakDue = workDuration > 300 && !breaks.some(b => b.type === 'MEAL');

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coffee className="h-5 w-5" />
                        Gestión de Breaks
                    </CardTitle>
                    <CardDescription>
                        Control de pausas activas y cumplimiento laboral
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Tiempo Trabajado</p>
                            <p className="text-2xl font-bold">{formatDuration(workDuration)}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Breaks Tomados</p>
                            <p className="text-2xl font-bold">{breaks.filter(b => b.endTime).length}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Estado</p>
                            {activeBreak ? (
                                <Badge variant="secondary" className="text-sm">
                                    <Clock className="h-3 w-3 mr-1" />
                                    En Break
                                </Badge>
                            ) : (
                                <Badge variant="default" className="text-sm">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Trabajando
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Alerts */}
                    {isMealBreakDue && !breaks.some(b => b.type === 'MEAL' && b.endTime) && (
                        <Alert className="mt-4" variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Break de Comida Requerido</AlertTitle>
                            <AlertDescription>
                                Has trabajado más de 5 horas seguidas. Es obligatorio tomar un break de comida de al menos 30 minutos.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                        {!activeBreak ? (
                            <>
                                <Button
                                    onClick={() => handleStartBreak('MEAL')}
                                    disabled={loading}
                                    variant="default"
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    Break Comida
                                </Button>
                                <Button
                                    onClick={() => handleStartBreak('REST')}
                                    disabled={loading}
                                    variant="outline"
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    Break Descanso
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleEndBreak}
                                disabled={loading}
                                variant="destructive"
                            >
                                <Square className="h-4 w-4 mr-2" />
                                Terminar Break ({activeBreak.type === 'MEAL' ? 'Comida' : 'Descanso'})
                            </Button>
                        )}
                        <Button
                            onClick={checkCompliance}
                            variant="outline"
                            disabled={loading}
                        >
                            Verificar Cumplimiento
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Compliance Status */}
            {compliance && (
                <Card>
                    <CardHeader>
                        <CardTitle>Estado de Cumplimiento</CardTitle>
                        <CardDescription>
                            Análisis de breaks según normativa laboral
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {compliance.isCompliant ? (
                            <Alert className="bg-green-50 text-green-800 border-green-200">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Cumplimiento Correcto</AlertTitle>
                                <AlertDescription>
                                    Todos los breaks cumplen con la normativa laboral.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-red-50 text-red-800 border-red-200">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Problemas de Cumplimiento</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc list-inside mt-2">
                                        {compliance.issues.map((issue, i) => (
                                            <li key={i}>{issue}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Break History */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Breaks</CardTitle>
                    <CardDescription>
                        Registro de pausas tomadas en esta sesión
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {breaks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No hay breaks registrados
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {breaks.map((breakItem) => (
                                <div
                                    key={breakItem.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <Coffee className={`h-5 w-5 ${breakItem.endTime ? 'text-muted-foreground' : 'text-green-600'}`} />
                                        <div>
                                            <p className="font-medium">
                                                {getBreakTypeLabel(breakItem.type)}
                                                {!breakItem.endTime && (
                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                        En curso
                                                    </Badge>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {breakItem.startTime ? format(breakItem.startTime, "HH:mm") : "N/A"}
                                                {breakItem.endTime && (
                                                    <> - {format(breakItem.endTime, "HH:mm")}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {breakItem.durationMinutes ? (
                                            <p className="font-medium">{breakItem.durationMinutes} min</p>
                                        ) : (
                                            <Clock className="h-5 w-5 animate-pulse" />
                                        )}
                                        {breakItem.complianceNotes && (
                                            <p className="text-xs text-muted-foreground">
                                                {breakItem.complianceNotes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
