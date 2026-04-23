"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Approval {
    id: string;
    companyId: string;
    branchId: string;
    approvalType: string;
    requestedBy: string;
    requestedFor: string;
    title: string;
    description?: string | null;
    reason?: string | null;
    shiftSessionId?: string | null;
    plannedShiftId?: string | null;
    startTime?: Date | null;
    endTime?: Date | null;
    durationMinutes?: number | null;
    overtimeMinutes?: number | null;
    extraData?: any;
    status: string;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    rejectionReason?: string | null;
    notifiedAt?: Date | null;
    reminderSent: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface ApprovalStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    byType: Record<string, number>;
}

export function ApprovalManager() {
    const [approvals, setApprovals] = React.useState<Approval[]>([]);
    const [stats, setStats] = React.useState<ApprovalStats | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [selectedApproval, setSelectedApproval] = React.useState<Approval | null>(null);
    const [isDecisionDialogOpen, setIsDecisionDialogOpen] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [activeTab, setActiveTab] = React.useState<'pending' | 'all'>('pending');

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const params = activeTab === 'pending' ? '?status=PENDING' : '';
            const response = await fetch(`/api/approvals${params}`);
            if (response.ok) {
                const result = await response.json();
                setApprovals(result.approvals || []);
            }
        } catch (error) {
            console.error("Error fetching approvals:", error);
            toast.error("Error al cargar solicitudes");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            // Stats would need a separate endpoint
            // For now, calculate from approvals
            const pending = approvals.filter(a => a.status === 'PENDING').length;
            const approved = approvals.filter(a => a.status === 'APPROVED').length;
            const rejected = approvals.filter(a => a.status === 'REJECTED').length;
            const cancelled = approvals.filter(a => a.status === 'CANCELLED').length;

            setStats({
                total: approvals.length,
                pending,
                approved,
                rejected,
                cancelled,
                byType: {}
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    React.useEffect(() => {
        fetchApprovals();
    }, [activeTab]);

    React.useEffect(() => {
        fetchStats();
    }, [approvals]);

    const handleApprove = async () => {
        if (!selectedApproval) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/approvals?id=${selectedApproval.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: 'APPROVED'
                })
            });

            if (response.ok) {
                toast.success("Solicitud aprobada");
                setIsDecisionDialogOpen(false);
                setSelectedApproval(null);
                await fetchApprovals();
            } else {
                toast.error("Error al aprobar solicitud");
            }
        } catch (error) {
            console.error("Error approving:", error);
            toast.error("Error al aprobar solicitud");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedApproval) return;

        if (!rejectionReason.trim()) {
            toast.error("Ingresa la razón del rechazo");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/approvals?id=${selectedApproval.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: 'REJECTED',
                    rejectionReason
                })
            });

            if (response.ok) {
                toast.success("Solicitud rechazada");
                setIsDecisionDialogOpen(false);
                setSelectedApproval(null);
                setRejectionReason('');
                await fetchApprovals();
            } else {
                toast.error("Error al rechazar solicitud");
            }
        } catch (error) {
            console.error("Error rejecting:", error);
            toast.error("Error al rechazar solicitud");
        } finally {
            setLoading(false);
        }
    };

    const openDecisionDialog = (approval: Approval) => {
        setSelectedApproval(approval);
        setIsDecisionDialogOpen(true);
        setRejectionReason('');
    };

    const getApprovalTypeLabel = (type: string) => {
        switch (type) {
            case 'OVERTIME': return 'Overtime';
            case 'SCHEDULE_CHANGE': return 'Cambio de Turno';
            case 'TIME_OFF': return 'Permiso';
            case 'SHIFT_SWAP': return 'Intercambio';
            case 'EARLY_DEPARTURE': return 'Salida Temprana';
            default: return type;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
            case 'APPROVED':
                return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Aprobado</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rechazado</Badge>;
            case 'CANCELLED':
                return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" /> Cancelado</Badge>;
        }
    };

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.cancelled}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                    <TabsTrigger value="pending">Pendientes</TabsTrigger>
                    <TabsTrigger value="all">Todas</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Approvals Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Solicitudes de Aprobación</CardTitle>
                    <CardDescription>
                        Gestiona las aprobaciones de overtime, cambios de turno y permisos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Detalles</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {approvals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No hay solicitudes de aprobación
                                    </TableCell>
                                </TableRow>
                            ) : (
                                approvals.map((approval) => (
                                    <TableRow key={approval.id}>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {getApprovalTypeLabel(approval.approvalType)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {approval.title}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span className="text-sm">
                                                    {approval.requestedFor === approval.requestedBy
                                                        ? 'Auto-solicitud'
                                                        : 'Empleado'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {approval.overtimeMinutes ? (
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span className="text-sm">
                                                        {formatMinutes(approval.overtimeMinutes)}
                                                    </span>
                                                </div>
                                            ) : approval.durationMinutes ? (
                                                <span className="text-sm">
                                                    {formatMinutes(approval.durationMinutes)}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {format(approval.createdAt, "dd/MMM", { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(approval.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {approval.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => {
                                                            setSelectedApproval(approval);
                                                            handleApprove();
                                                        }}
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Aprobar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openDecisionDialog(approval)}
                                                    >
                                                        Revisar
                                                    </Button>
                                                </div>
                                            )}
                                            {approval.status !== 'PENDING' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setSelectedApproval(approval)}
                                                >
                                                    Ver
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Decision Dialog */}
            <Dialog open={isDecisionDialogOpen} onOpenChange={setIsDecisionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revisar Solicitud</DialogTitle>
                        <DialogDescription>
                            Revisa los detalles y decide sobre la solicitud
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApproval && (
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label>Tipo</Label>
                                <p className="font-medium">
                                    {getApprovalTypeLabel(selectedApproval.approvalType)}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Título</Label>
                                <p className="font-medium">{selectedApproval.title}</p>
                            </div>
                            {selectedApproval.description && (
                                <div className="grid gap-2">
                                    <Label>Descripción</Label>
                                    <p className="text-sm">{selectedApproval.description}</p>
                                </div>
                            )}
                            {selectedApproval.reason && (
                                <div className="grid gap-2">
                                    <Label>Razón</Label>
                                    <p className="text-sm">{selectedApproval.reason}</p>
                                </div>
                            )}
                            {selectedApproval.overtimeMinutes && (
                                <div className="grid gap-2">
                                    <Label>Overtime</Label>
                                    <p className="font-medium text-red-600">
                                        {formatMinutes(selectedApproval.overtimeMinutes)}
                                    </p>
                                </div>
                            )}
                            {selectedApproval.durationMinutes && (
                                <div className="grid gap-2">
                                    <Label>Duración Total</Label>
                                    <p className="font-medium">
                                        {formatMinutes(selectedApproval.durationMinutes)}
                                    </p>
                                </div>
                            )}

                            {selectedApproval.status === 'PENDING' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="rejection-reason">
                                        Razón de Rechazo (si aplica)
                                    </Label>
                                    <Textarea
                                        id="rejection-reason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explica por qué se rechaza la solicitud..."
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {selectedApproval?.status === 'PENDING' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsDecisionDialogOpen(false);
                                        setSelectedApproval(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={loading}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rechazar
                                </Button>
                            </>
                        )}
                        {selectedApproval?.status !== 'PENDING' && (
                            <Button onClick={() => setIsDecisionDialogOpen(false)}>
                                Cerrar
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
