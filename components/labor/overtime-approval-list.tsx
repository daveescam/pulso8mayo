'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface OvertimeRequest {
    id: string;
    userId: string;
    userName: string;
    branchId: string;
    branchName: string;
    title: string;
    description: string | null;
    reason: string | null;
    startTime: Date | null;
    endTime: Date | null;
    durationMinutes: number | null;
    overtimeMinutes: number | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectionReason: string | null;
    createdAt: Date | null;
}

interface OvertimeApprovalListProps {
    branchId?: string;
    userRole?: string;
}

export function OvertimeApprovalList({ branchId, userRole }: OvertimeApprovalListProps) {
    const [requests, setRequests] = useState<OvertimeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

    useEffect(() => {
        fetchRequests();
    }, [branchId]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (branchId) params.set('branchId', branchId);

            const response = await fetch(`/api/overtime/requests?${params}`);
            if (response.ok) {
                const data = await response.json();
                setRequests(data.requests);
            }
        } catch (error) {
            console.error('Error fetching overtime requests:', error);
            toast.error('Error al cargar solicitudes');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (action: 'approve' | 'reject') => {
        if (!selectedRequest) return;

        if (action === 'reject' && (!reviewComment || reviewComment.trim().length === 0)) {
            toast.error('La razón de rechazo es requerida');
            return;
        }

        try {
            const endpoint = action === 'approve' ? 'approve' : 'reject';
            const response = await fetch(`/api/overtime/requests/${selectedRequest.id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comment: reviewComment,
                    reason: reviewComment,
                }),
            });

            if (!response.ok) {
                throw new Error('Error al procesar solicitud');
            }

            toast.success(
                action === 'approve'
                    ? 'Solicitud aprobada'
                    : 'Solicitud rechazada'
            );

            setReviewDialogOpen(false);
            setReviewComment('');
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            console.error('Error reviewing overtime request:', error);
            toast.error('Error al procesar solicitud');
        }
    };

    const openReviewDialog = (request: OvertimeRequest, action: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setReviewAction(action);
        setReviewDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="warning">⏳ Pendiente</Badge>;
            case 'APPROVED':
                return <Badge variant="default" className="bg-green-600">✅ Aprobada</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive">❌ Rechazada</Badge>;
            case 'CANCELLED':
                return <Badge variant="outline">❌ Cancelada</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getReasonLabel = (reason: string | null) => {
        switch (reason) {
            case 'INVENTARIO':
                return 'Inventario';
            case 'DEMANDA_ALTA':
                return 'Alta demanda';
            case 'EVENTO_ESPECIAL':
                return 'Evento especial';
            case 'CAPACITACION':
                return 'Capacitación';
            case 'OTRO':
                return 'Otro';
            default:
                return reason || 'N/A';
        }
    };

    const canReview = userRole === 'ADMIN' || userRole === 'GERENTE' || userRole === 'SUPERVISOR';

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground">Cargando solicitudes...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Solicitudes de Horas Extras</CardTitle>
                    <CardDescription>
                        {requests.filter(r => r.status === 'PENDING').length} solicitud(es) pendiente(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No hay solicitudes</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                No se han registrado solicitudes de horas extras
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Razón</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Horas Extras</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">{request.userName}</TableCell>
                                        <TableCell>{request.title}</TableCell>
                                        <TableCell>{getReasonLabel(request.reason)}</TableCell>
                                        <TableCell>
                                            {request.startTime
                                                ? format(new Date(request.startTime), 'dd/MM/yyyy', { locale: es })
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {request.overtimeMinutes
                                                ? `${(request.overtimeMinutes / 60).toFixed(2)} hrs`
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedRequest(request)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {canReview && request.status === 'PENDING' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-green-600 hover:text-green-700"
                                                            onClick={() => openReviewDialog(request, 'approve')}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => openReviewDialog(request, 'reject')}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {reviewAction === 'approve'
                                ? 'Aprobar Solicitud'
                                : 'Rechazar Solicitud'}
                        </DialogTitle>
                        <DialogDescription>
                            {reviewAction === 'approve'
                                ? '¿Estás seguro de aprobar esta solicitud de horas extras?'
                                : 'Debes proporcionar una razón para el rechazo.'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Empleado</label>
                                <p className="text-sm text-muted-foreground">{selectedRequest.userName}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Título</label>
                                <p className="text-sm text-muted-foreground">{selectedRequest.title}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Horas Extras</label>
                                <p className="text-sm text-muted-foreground">
                                    {selectedRequest.overtimeMinutes
                                        ? `${(selectedRequest.overtimeMinutes / 60).toFixed(2)} horas`
                                        : 'N/A'}
                                </p>
                            </div>
                            {reviewAction === 'reject' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Razón de Rechazo *</label>
                                    <Textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Explica la razón del rechazo..."
                                        className="resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setReviewDialogOpen(false);
                                setReviewComment('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => handleReview(reviewAction)}
                            variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                        >
                            {reviewAction === 'approve' ? 'Aprobar' : 'Rechazar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
