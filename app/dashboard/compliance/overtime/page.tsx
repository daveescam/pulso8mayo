"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Clock, AlertTriangle, CheckCircle, DollarSign, XCircle } from "lucide-react";
import { toast } from "sonner";

interface OvertimeRequest {
    id: string;
    userId: string;
    userName: string;
    branchName: string;
    requestedAt: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    overtimeMinutes: number;
    reason: string;
    approvedBy: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
}

export default function OvertimePage() {
    const [requests, setRequests] = useState<OvertimeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/overtime-requests");
                if (res.ok) {
                    const data = await res.json();
                    setRequests(data.requests || []);
                }
            } catch (e) {
                toast.error("Error al cargar solicitudes");
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const approveOvertime = async (id: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/overtime-requests/${id}/approve`, {
                method: "POST",
            });
            if (res.ok) {
                toast.success("Horas extra aprobadas");
                setRequests(prev =>
                    prev.map(r =>
                        r.id === id
                            ? {
                                  ...r,
                                  status: "APPROVED",
                                  approvedAt: new Date().toISOString(),
                              }
                            : r
                    )
                );
                setSelectedRequest(null);
            } else {
                toast.error("Error al aprobar");
            }
        } catch (e) {
            toast.error("Error al aprobar");
        } finally {
            setActionLoading(false);
        }
    };

    const rejectOvertime = async (id: string, reason: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/overtime-requests/${id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });
            if (res.ok) {
                toast.success("Solicitud rechazada");
                setRequests(prev =>
                    prev.map(r =>
                        r.id === id
                            ? { ...r, status: "REJECTED", rejectionReason: reason }
                            : r
                    )
                );
                setSelectedRequest(null);
                setRejectionReason("");
            } else {
                toast.error("Error al rechazar");
            }
        } catch (e) {
            toast.error("Error al rechazar");
        } finally {
            setActionLoading(false);
        }
    };

    const pending = requests.filter(r => r.status === "PENDING");
    const approved = requests.filter(r => r.status === "APPROVED");
    const rejected = requests.filter(r => r.status === "REJECTED");

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return (
                    <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aprobada
                    </Badge>
                );
            case "REJECTED":
                return (
                    <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rechazada
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendiente
                    </Badge>
                );
        }
    };

    const formatOvertime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

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
                <h1 className="text-3xl font-bold">Horas Extra</h1>
                <p className="text-muted-foreground">
                    Solicitudes y aprobación de overtime
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Pendientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {pending.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-green-600">
                            Aprobadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {approved.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-red-600">
                            Rechazadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {rejected.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Total Minutos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {approved.reduce((sum, r) => sum + r.overtimeMinutes, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Minutos aprobados este mes
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">
                        Pendientes ({pending.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        Aprobadas ({approved.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                        Rechazadas ({rejected.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    {pending.length > 0 ? (
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Empleado</TableHead>
                                            <TableHead>Sucursal</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Minutos</TableHead>
                                            <TableHead>Motivo</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pending.map(req => (
                                            <TableRow key={req.id}>
                                                <TableCell className="font-medium">
                                                    {req.userName}
                                                </TableCell>
                                                <TableCell>
                                                    {req.branchName}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        req.requestedAt
                                                    ).toLocaleDateString(
                                                        "es-MX"
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {formatOvertime(
                                                            req.overtimeMinutes
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {req.reason}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                approveOvertime(
                                                                    req.id
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading
                                                            }
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Aprobar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                setSelectedRequest(
                                                                    req
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading
                                                            }
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Rechazar
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="flex items-center justify-center py-12">
                                <div className="text-center text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No hay solicitudes pendientes</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="approved">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Empleado</TableHead>
                                        <TableHead>Minutos</TableHead>
                                        <TableHead>Aprobada</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approved.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">
                                                {req.userName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="default" className="bg-green-600">
                                                    {formatOvertime(req.overtimeMinutes)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {req.approvedAt
                                                    ? new Date(
                                                          req.approvedAt
                                                      ).toLocaleDateString(
                                                          "es-MX"
                                                      )
                                                    : "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rejected">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Empleado</TableHead>
                                        <TableHead>Minutos</TableHead>
                                        <TableHead>Motivo Rechazo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rejected.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">
                                                {req.userName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {formatOvertime(req.overtimeMinutes)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{req.rejectionReason}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle>Reglas de Horas Extra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium mb-2">
                            Según la Ley Federal del Trabajo (México):
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                • Máximo 3 horas extra por día
                            </li>
                            <li>
                                • Máximo 3 veces por semana (por empleado)
                            </li>
                            <li>
                                • Primeras 9 horas semanales: Doble (2x)
                            </li>
                            <li>
                                • Horas 10+ semanales: Triple (3x)
                            </li>
                            <li>
                                • Jornada diurna: 8 horas máximo
                            </li>
                            <li>
                                • Jornada nocturna: 7 horas máximo
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Dialog
                open={!!selectedRequest}
                onOpenChange={() => setSelectedRequest(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Solicitud</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm">
                            Rechazar solicitud de{" "}
                            <strong>{selectedRequest?.userName}</strong> por{" "}
                            {formatOvertime(selectedRequest?.overtimeMinutes || 0)}
                        </p>
                        <Label>Motivo del rechazo</Label>
                        <Textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Indica el motivo..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedRequest(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!rejectionReason || actionLoading}
                            onClick={() =>
                                selectedRequest &&
                                rejectOvertime(selectedRequest.id, rejectionReason)
                            }
                        >
                            {actionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Rechazar"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}