'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Download, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/utils/csv-export';

interface LFTViolation {
    id: string;
    userId: string;
    userName: string;
    branchId: string;
    branchName: string;
    type: string;
    date: Date;
    description: string;
    severity: 'LEVE' | 'GRAVE' | 'MUY_GRAVE';
    article: string;
    fineRange?: string;
    details: Record<string, any>;
}

interface LFTViolationsTableProps {
    branchId?: string;
}

export function LFTViolationsTable({ branchId }: LFTViolationsTableProps) {
    const [violations, setViolations] = useState<LFTViolation[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const fetchViolations = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/reports/lft-violations?startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`
            );

            if (response.ok) {
                const data = await response.json();
                setViolations(data.violations);
            } else {
                throw new Error('Error fetching violations');
            }
        } catch (error) {
            console.error('Error fetching LFT violations:', error);
            toast.error('Error al cargar reporte de violaciones LFT');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSVFile = () => {
        if (violations.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const data = violations.map(v => ({
            'Empleado': v.userName,
            'Sucursal': v.branchName,
            'Tipo': v.type,
            'Fecha': format(v.date, 'yyyy-MM-dd'),
            'Descripción': v.description,
            'Severidad': v.severity,
            'Artículo': v.article,
            'Rango Multa': v.fineRange || 'N/A',
        }));

        exportToCSV(data, 'lft-violations');
        toast.success('Reporte exportado exitosamente');
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'LEVE':
                return <Badge variant="warning">⚠️ LEVE</Badge>;
            case 'GRAVE':
                return <Badge variant="destructive">🔴 GRAVE</Badge>;
            case 'MUY_GRAVE':
                return <Badge variant="destructive">🚨 MUY GRAVE</Badge>;
            default:
                return <Badge variant="outline">{severity}</Badge>;
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'LEVE':
                return <Info className="h-5 w-5 text-yellow-600" />;
            case 'GRAVE':
                return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case 'MUY_GRAVE':
                return <AlertCircle className="h-5 w-5 text-red-700" />;
            default:
                return <Info className="h-5 w-5 text-gray-600" />;
        }
    };

    const getSummary = () => {
        return {
            total: violations.length,
            bySeverity: {
                LEVE: violations.filter(v => v.severity === 'LEVE').length,
                GRAVE: violations.filter(v => v.severity === 'GRAVE').length,
                MUY_GRAVE: violations.filter(v => v.severity === 'MUY_GRAVE').length,
            },
            byType: violations.reduce((acc, v) => {
                acc[v.type] = (acc[v.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };
    };

    const summary = getSummary();

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {violations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Violaciones</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total}</div>
                            <p className="text-xs text-muted-foreground">
                                En el período seleccionado
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Leves</CardTitle>
                            <Info className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{summary.bySeverity.LEVE}</div>
                            <p className="text-xs text-muted-foreground">
                                Requieren atención
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Graves</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{summary.bySeverity.GRAVE}</div>
                            <p className="text-xs text-muted-foreground">
                                Acción inmediata requerida
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Muy Graves</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-700" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">{summary.bySeverity.MUY_GRAVE}</div>
                            <p className="text-xs text-muted-foreground">
                                Riesgo legal alto
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters and Actions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Violaciones LFT</CardTitle>
                            <CardDescription>
                                Detección de violaciones a la Ley Federal del Trabajo
                            </CardDescription>
                        </div>
                        <Button onClick={exportToCSVFile} variant="outline" size="sm" disabled={violations.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchViolations} disabled={loading}>
                                {loading ? 'Cargando...' : 'Buscar'}
                            </Button>
                        </div>
                    </div>

                    {/* Violations Table */}
                    {violations.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No se encontraron violaciones</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                ¡Excelente! No se detectaron violaciones LFT en el período seleccionado
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Sucursal</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Severidad</TableHead>
                                    <TableHead>Artículo LFT</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {violations.map((violation) => (
                                    <TableRow key={violation.id}>
                                        <TableCell className="font-medium">{violation.userName}</TableCell>
                                        <TableCell>{violation.branchName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{violation.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(violation.date, 'dd/MM/yyyy', { locale: es })}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {violation.description}
                                        </TableCell>
                                        <TableCell>
                                            {getSeverityBadge(violation.severity)}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {violation.article}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
