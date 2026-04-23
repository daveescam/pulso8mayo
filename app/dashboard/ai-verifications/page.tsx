"use client";

import * as React from "react";
import { AIVerificationList, AIVerificationListItem, AIVerificationStatus } from "@/components/workflow/ai-verification-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Download } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface VerificationData {
    id: string;
    workflowName: string;
    instanceId: string;
    stepId: string;
    status: 'pending' | 'analyzing' | 'success' | 'failed' | 'escalated';
    confidence?: number;
    reason?: string;
    provider?: string;
    timestamp?: string;
    requiresManualReview?: boolean;
    escalated?: boolean;
    photoUrl?: string;
    assignee?: string;
    branch?: string;
}

export default function AIVerificationsPage() {
    const [verifications, setVerifications] = React.useState<VerificationData[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<'all' | 'success' | 'failed' | 'escalated' | 'pending'>('all');
    const [selectedVerification, setSelectedVerification] = React.useState<VerificationData | null>(null);

    const loadVerifications = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/dashboard/ai-verifications');
            const data = await response.json();
            
            const mockData: VerificationData[] = data.data || [
                {
                    id: 'vrf_1',
                    workflowName: 'Recepción de Inventario - Temperatura',
                    instanceId: 'inst_001',
                    stepId: 'step_001',
                    status: 'success',
                    confidence: 0.95,
                    reason: 'La temperatura es correcta (4°C). Producto en buen estado.',
                    provider: 'openai',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                    photoUrl: '/mock-temperature.jpg',
                    assignee: 'Juan Pérez',
                    branch: 'Sucursal Centro'
                },
                {
                    id: 'vrf_2',
                    workflowName: 'Limpieza de Cocina - Verificación',
                    instanceId: 'inst_002',
                    stepId: 'step_002',
                    status: 'failed',
                    confidence: 0.72,
                    reason: 'Se detectaron áreas sucias en la superficie. Se requiere limpieza adicional.',
                    provider: 'moondream',
                    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
                    photoUrl: '/mock-kitchen.jpg',
                    requiresManualReview: true,
                    assignee: 'María García',
                    branch: 'Sucursal Norte'
                },
                {
                    id: 'vrf_3',
                    workflowName: 'Control de Calidad - Producto Perecedero',
                    instanceId: 'inst_003',
                    stepId: 'step_003',
                    status: 'escalated',
                    confidence: 0.65,
                    reason: 'No se pudo determinar claramente la fecha de expiración. Requiere revisión manual.',
                    provider: 'openai',
                    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
                    photoUrl: '/mock-product.jpg',
                    requiresManualReview: true,
                    escalated: true,
                    assignee: 'Carlos López',
                    branch: 'Sucursal Sur'
                },
                {
                    id: 'vrf_4',
                    workflowName: 'Verificación de Almacenamiento',
                    instanceId: 'inst_004',
                    stepId: 'step_004',
                    status: 'pending',
                    assignee: 'Ana Martínez',
                    branch: 'Sucursal Centro'
                },
                {
                    id: 'vrf_5',
                    workflowName: 'Control de Temperatura - Congelador',
                    instanceId: 'inst_005',
                    stepId: 'step_005',
                    status: 'analyzing',
                    provider: 'openai',
                    timestamp: new Date(Date.now() - 1000 * 5).toISOString(),
                    assignee: 'Roberto Sánchez',
                    branch: 'Sucursal Oeste'
                }
            ];
            
            setVerifications(mockData);
        } catch (error) {
            console.error('Failed to load verifications:', error);
            toast.error('Error al cargar verificaciones');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadVerifications();
    }, [loadVerifications]);

    const filteredVerifications = React.useMemo(() => {
        if (filter === 'all') {
            return verifications;
        }
        return verifications.filter(v => v.status === filter);
    }, [verifications, filter]);

    const verificationsForList: AIVerificationListItem[] = React.useMemo(() => {
        return filteredVerifications.map(v => ({
            id: v.id,
            workflowName: v.workflowName,
            status: {
                status: v.status,
                confidence: v.confidence,
                reason: v.reason,
                provider: v.provider,
                timestamp: v.timestamp ? new Date(v.timestamp) : undefined,
                requiresManualReview: v.requiresManualReview,
                escalated: v.escalated,
                photoUrl: v.photoUrl
            }
        }));
    }, [filteredVerifications]);

    const stats = React.useMemo(() => {
        return {
            total: verifications.length,
            success: verifications.filter(v => v.status === 'success').length,
            failed: verifications.filter(v => v.status === 'failed').length,
            escalated: verifications.filter(v => v.status === 'escalated').length,
            pending: verifications.filter(v => v.status === 'pending' || v.status === 'analyzing').length
        };
    }, [verifications]);

    const handleExport = () => {
        // TODO: Implement export to CSV
        toast.info('Función de exportación en desarrollo');
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Verificaciones AI</h1>
                    <p className="text-muted-foreground mt-1">
                        Estado de verificaciones de evidencia con inteligencia artificial
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadVerifications}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total</CardDescription>
                        <CardTitle className="text-3xl">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Aprobados</CardDescription>
                        <CardTitle className="text-3xl text-green-600">{stats.success}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Fallidos</CardDescription>
                        <CardTitle className="text-3xl text-red-600">{stats.failed}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Escalados</CardDescription>
                        <CardTitle className="text-3xl text-orange-600">{stats.escalated}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pendientes</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">{stats.pending}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filtrar:</span>
                </div>
                <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="success">Aprobados</SelectItem>
                        <SelectItem value="failed">Fallidos</SelectItem>
                        <SelectItem value="escalated">Escalados</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                    </SelectContent>
                </Select>
                <div className="ml-auto flex items-center gap-2">
                    <Badge variant="outline">
                        {filteredVerifications.length} resultados
                    </Badge>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Verification List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lista de Verificaciones</CardTitle>
                            <CardDescription>
                                Haz clic en una verificación para ver detalles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Cargando verificaciones...
                                </div>
                            ) : (
                                <AIVerificationList
                                    verifications={verificationsForList}
                                    onVerificationClick={(id) => {
                                        const verification = verifications.find(v => v.id === id);
                                        if (verification) {
                                            setSelectedVerification(verification);
                                        }
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Detail View */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-8">
                        <CardHeader>
                            <CardTitle>Detalles</CardTitle>
                            <CardDescription>
                                {selectedVerification
                                    ? selectedVerification.workflowName
                                    : 'Selecciona una verificación'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedVerification ? (
                                <div className="space-y-4">
                                    <AIVerificationStatus
                                        status={{
                                            status: selectedVerification.status,
                                            confidence: selectedVerification.confidence,
                                            reason: selectedVerification.reason,
                                            provider: selectedVerification.provider,
                                            timestamp: selectedVerification.timestamp
                                                ? new Date(selectedVerification.timestamp)
                                                : undefined,
                                            requiresManualReview: selectedVerification.requiresManualReview,
                                            escalated: selectedVerification.escalated,
                                            photoUrl: selectedVerification.photoUrl
                                        }}
                                    />
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Asignado a:</span>
                                            <span className="font-medium">{selectedVerification.assignee || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Sucursal:</span>
                                            <span className="font-medium">{selectedVerification.branch || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Instancia:</span>
                                            <span className="font-medium font-mono text-xs">{selectedVerification.instanceId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Step:</span>
                                            <span className="font-medium font-mono text-xs">{selectedVerification.stepId}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <Button variant="outline" className="flex-1">
                                            Ver Workflow
                                        </Button>
                                        <Button variant="outline" className="flex-1">
                                            Ver Incidente
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Selecciona una verificación de la lista para ver los detalles
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
