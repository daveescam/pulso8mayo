"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Clock, AlertTriangle, CheckCircle, Coffee, Play } from "lucide-react";
import { toast } from "sonner";

interface BreakStatus {
    userId: string;
    userName: string;
    branchId: string | null;
    branchName: string | null;
    sessionStatus: string;
    workedMinutes: number;
    lastBreakMinutes: number;
    timeSinceLastBreak: number;
    breakCount: number;
    complianceIssues: string[];
    isCompliant: boolean;
}

interface BreakSession {
    id: string;
    userId: string;
    userName: string;
    startTime: string;
    breakCount: number;
    totalBreakMinutes: number;
    lastBreakTime: string | null;
}

export default function BreaksPage() {
    const [breakStatuses, setBreakStatuses] = useState<BreakStatus[]>([]);
    const [sessions, setSessions] = useState<BreakSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingBreak, setStartingBreak] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/labor/breaks/status");
                if (res.ok) {
                    const data = await res.json();
                    setBreakStatuses(data.activeEmployees || []);
                    setSessions(data.sessions || []);
                }
            } catch (e) {
                toast.error("Error al cargar estado de breaks");
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const startBreak = async (sessionId: string) => {
        setStartingBreak(true);
        try {
            const res = await fetch("/api/breaks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, type: "STANDARD" }),
            });
            if (res.ok) {
                toast.success("Break iniciado");
                const statusRes = await fetch("/api/labor/breaks/status");
                if (statusRes.ok) {
                    const data = await statusRes.json();
                    setBreakStatuses(data.activeEmployees || []);
                    setSessions(data.sessions || []);
                }
            } else {
                toast.error("Error al iniciar break");
            }
        } catch (e) {
            toast.error("Error al iniciar break");
        } finally {
            setStartingBreak(false);
        }
    };

    const endBreak = async (breakId: string) => {
        setStartingBreak(true);
        try {
            const res = await fetch(`/api/breaks?id=${breakId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "end" }),
            });
            if (res.ok) {
                toast.success("Break terminado");
                const statusRes = await fetch("/api/labor/breaks/status");
                if (statusRes.ok) {
                    const data = await statusRes.json();
                    setBreakStatuses(data.activeEmployees || []);
                    setSessions(data.sessions || []);
                }
            } else {
                toast.error("Error al terminar break");
            }
        } catch (e) {
            toast.error("Error al terminar break");
        } finally {
            setStartingBreak(false);
        }
    };

    const compliantCount = breakStatuses.filter(b => b.isCompliant).length;
    const issuesCount = breakStatuses.filter(b => b.complianceIssues.length > 0).length;
    const onBreak = sessions.filter(s => s.breakCount > 0 && !s.lastBreakTime).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gestión de Pausas</h1>
                <p className="text-muted-foreground">
                    Control de pausas activas según NOM-035
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            En Turno
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{breakStatuses.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-green-600">
                            Cumpliendo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {compliantCount}
                        </div>
                        <Progress
                            value={
                                breakStatuses.length > 0
                                    ? (compliantCount / breakStatuses.length) * 100
                                    : 0
                            }
                            className="h-1 mt-2"
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-orange-600">
                            Con Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {issuesCount}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">En Break</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {onBreak}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Estado de Pausas por Empleado</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Sucursal</TableHead>
                                <TableHead>Tiempo Trabajado</TableHead>
                                <TableHead>Último Break</TableHead>
                                <TableHead>Breaks</TableHead>
                                <TableHead>Cumplimiento</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {breakStatuses.map(status => (
                                <TableRow key={status.userId}>
                                    <TableCell>
                                        <div className="font-medium">
                                            {status.userName}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {status.branchName || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {status.workedMinutes} min
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {status.lastBreakMinutes > 0 ? (
                                            <span>
                                                {status.lastBreakMinutes} min
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Sin break
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {status.breakCount}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {status.isCompliant ? (
                                            <Badge
                                                variant="default"
                                                className="bg-green-600"
                                            >
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                OK
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Issue
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    const session =
                                                        sessions.find(
                                                            s =>
                                                                s.userId ===
                                                                status.userId
                                                        );
                                                    if (session) {
                                                        startBreak(session.id);
                                                    }
                                                }}
                                                disabled={startingBreak}
                                            >
                                                <Play className="h-4 w-4 mr-1" />
                                                Iniciar Break
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Requisito Legal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium mb-2">
                            Según la Ley Federal del Trabajo (México):
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                • Jornada de 4-6 horas: Mínimo 15 min de
                                descanso
                            </li>
                            <li>
                                • Jornada de 6-8 horas: Mínimo 30 min de
                                descanso
                            </li>
                            <li>
                                • Jornada mayor a 8 horas: Mínimo 1 hora de descanso
                            </li>
                            <li>
                                • El descanso debe incluirse en la jornada
                                (tiempo productivo)
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}