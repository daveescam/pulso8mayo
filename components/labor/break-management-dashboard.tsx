'use client';

import { useState, useEffect } from 'react';
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
import { Coffee, Clock, AlertTriangle, CheckCircle, XCircle, MessageCircle, RefreshCw } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface EmployeeBreakStatus {
    userId: string;
    userName: string;
    userPhone: string;
    branchId: string;
    branchName: string;
    shiftStarted: Date;
    minutesWorked: number;
    lastBreakStart: Date | null;
    lastBreakEnd: Date | null;
    lastBreakDuration: number | null;
    totalBreakMinutes: number;
    breakCount: number;
    hasActiveBreak: boolean;
    complianceStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
    complianceIssues: string[];
    lastWhatsAppNotification: Date | null;
}

interface BreakManagementDashboardProps {
    companyId: string;
    userRole: string;
    userBranchId?: string;
}

export function BreakManagementDashboard({ companyId, userRole, userBranchId }: BreakManagementDashboardProps) {
    const [employees, setEmployees] = useState<EmployeeBreakStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState<string>(userBranchId || 'all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        fetchBreakData();
        fetchBranches();
    }, [selectedBranch]);

    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/branches');
            if (response.ok) {
                const data = await response.json();
                setBranches(data.branches || []);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchBreakData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedBranch !== 'all') {
                params.set('branchId', selectedBranch);
            }

            const response = await fetch(`/api/labor/breaks/status?${params}`);
            if (response.ok) {
                const data = await response.json();
                setEmployees(data.employees || []);
            }
        } catch (error) {
            console.error('Error fetching break data:', error);
            toast.error('Error al cargar datos de breaks');
        } finally {
            setLoading(false);
        }
    };

    const sendWhatsAppReminder = async (userId: string, userName: string, phone: string) => {
        try {
            const response = await fetch('/api/labor/breaks/send-reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, phone }),
            });

            if (response.ok) {
                toast.success(`Recordatorio enviado a ${userName} por WhatsApp`);
                fetchBreakData(); // Refresh data
            } else {
                throw new Error('Error al enviar recordatorio');
            }
        } catch (error) {
            console.error('Error sending WhatsApp reminder:', error);
            toast.error('Error al enviar recordatorio');
        }
    };

    const getFilteredEmployees = () => {
        let filtered = employees;

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(emp => emp.complianceStatus === selectedStatus);
        }

        return filtered;
    };

    const getComplianceBadge = (status: string) => {
        switch (status) {
            case 'COMPLIANT':
                return <Badge className="bg-green-600">✅ Cumplido</Badge>;
            case 'WARNING':
                return <Badge variant="warning">⚠️ Advertencia</Badge>;
            case 'NON_COMPLIANT':
                return <Badge variant="destructive">❌ Incumplimiento</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getSummary = () => {
        return {
            total: employees.length,
            compliant: employees.filter(e => e.complianceStatus === 'COMPLIANT').length,
            warning: employees.filter(e => e.complianceStatus === 'WARNING').length,
            nonCompliant: employees.filter(e => e.complianceStatus === 'NON_COMPLIANT').length,
            onBreak: employees.filter(e => e.hasActiveBreak).length,
            missedBreaks: employees.filter(e => 
                e.minutesWorked > 300 && e.totalBreakMinutes === 0
            ).length,
        };
    };

    const summary = getSummary();
    const filteredEmployees = getFilteredEmployees();

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-12">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Cargando estado de breaks...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-6">
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">En Break</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold text-green-600">{summary.onBreak}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Cumplidos</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold text-green-600">{summary.compliant}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Incumplimientos</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold text-red-600">{summary.nonCompliant}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Breaks Omitidos</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="text-2xl font-bold text-red-700">{summary.missedBreaks}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Estado de Breaks por Empleado</CardTitle>
                            <CardDescription>
                                Monitoreo en tiempo real de descansos laborales
                            </CardDescription>
                        </div>
                        <Button onClick={fetchBreakData} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Actualizar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Sucursal</label>
                            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las sucursales</SelectItem>
                                    {branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Estado de Cumplimiento</label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="COMPLIANT">✅ Cumplidos</SelectItem>
                                    <SelectItem value="WARNING">⚠️ Advertencias</SelectItem>
                                    <SelectItem value="NON_COMPLIANT">❌ Incumplimientos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Employee Break Status Table */}
                    {filteredEmployees.length === 0 ? (
                        <div className="text-center py-12">
                            <Coffee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No hay empleados para mostrar</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                No hay empleados activos con los filtros seleccionados
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Sucursal</TableHead>
                                    <TableHead>Inicio Turno</TableHead>
                                    <TableHead>Horas Trabajadas</TableHead>
                                    <TableHead>Breaks Tomados</TableHead>
                                    <TableHead>Total Break</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Cumplimiento</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map((employee) => (
                                    <TableRow key={employee.userId}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{employee.userName}</p>
                                                <p className="text-xs text-muted-foreground">{employee.userPhone}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{employee.branchName}</TableCell>
                                        <TableCell>
                                            {format(employee.shiftStarted, 'HH:mm', { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {Math.floor(employee.minutesWorked / 60)}h {employee.minutesWorked % 60}m
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Coffee className={`h-4 w-4 ${employee.hasActiveBreak ? 'text-green-600' : 'text-muted-foreground'}`} />
                                                <span>
                                                    {employee.breakCount}
                                                    {employee.hasActiveBreak && (
                                                        <Badge variant="secondary" className="ml-2 text-xs">
                                                            En break
                                                        </Badge>
                                                    )}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{employee.totalBreakMinutes} min</span>
                                        </TableCell>
                                        <TableCell>
                                            {employee.complianceIssues.length > 0 ? (
                                                <div className="space-y-1">
                                                    {employee.complianceIssues.map((issue, idx) => (
                                                        <p key={idx} className="text-xs text-red-600 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {issue}
                                                        </p>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Sin problemas
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getComplianceBadge(employee.complianceStatus)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                {employee.minutesWorked > 240 && employee.totalBreakMinutes === 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => sendWhatsAppReminder(
                                                            employee.userId,
                                                            employee.userName,
                                                            employee.userPhone
                                                        )}
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
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

            {/* WhatsApp Automation Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        Automatización vía WhatsApp
                    </CardTitle>
                    <CardDescription>
                        Cómo funciona el sistema de notificaciones de breaks
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 border rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-sm font-bold text-green-600">1</span>
                                </div>
                                <p className="font-medium">Detección Automática</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                El sistema monitorea turnos activos y detecta cuando un empleado lleva 4+ horas sin break
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-sm font-bold text-green-600">2</span>
                                </div>
                                <p className="font-medium">Notificación WhatsApp</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Se envía un recordatorio automático al empleado: "⏰ Has trabajado 4 horas. Es tiempo de descansar"
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-sm font-bold text-green-600">3</span>
                                </div>
                                <p className="font-medium">Registro Automático</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Cuando el empleado responde "inicio pausa" por WhatsApp, el break se registra automáticamente
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                            <strong>Comandos disponibles por WhatsApp:</strong>
                        </p>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                            <li>• <code className="bg-blue-100 px-2 py-0.5 rounded">pausa</code> o <code className="bg-blue-100 px-2 py-0.5 rounded">break</code> - Iniciar pausa</li>
                            <li>• <code className="bg-blue-100 px-2 py-0.5 rounded">fin pausa</code> o <code className="bg-blue-100 px-2 py-0.5 rounded">regreso</code> - Terminar pausa</li>
                            <li>• <code className="bg-blue-100 px-2 py-0.5 rounded">status</code> o <code className="bg-blue-100 px-2 py-0.5 rounded">horas</code> - Ver resumen del día</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
