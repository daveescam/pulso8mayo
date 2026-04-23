"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    Brain,
    TrendingUp,
    TrendingDown,
    Users,
    AlertTriangle,
    CheckCircle2,
    Activity,
    Calendar,
    Download,
    RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { RiskLevel } from "@/lib/services/ComplianceReportService";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface PsychosocialDashboardProps {
    branchId: string;
}

interface DashboardData {
    totalEmployees: number;
    evaluatedEmployees: number;
    averageScore: number;
    riskDistribution: Record<RiskLevel, number>;
    criticalFactors: Array<{ factor: string; score: number; trend: 'up' | 'down' | 'stable' }>;
    highRiskEmployees: Array<{
        id: string;
        name: string;
        department: string;
        score: number;
        riskLevel: RiskLevel;
    }>;
    departmentRisk: Array<{
        department: string;
        averageScore: number;
        riskLevel: RiskLevel;
        employeesCount: number;
    }>;
    lastEvaluationDate: Date | null;
}

export function PsychosocialDashboard({ branchId }: PsychosocialDashboardProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | '180d' | '1y'>('90d');
    const [selectedEmployee, setSelectedEmployee] = useState<typeof data.highRiskEmployees[0] | null>(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            switch (selectedPeriod) {
                case '30d': startDate.setDate(startDate.getDate() - 30); break;
                case '90d': startDate.setDate(startDate.getDate() - 90); break;
                case '180d': startDate.setDate(startDate.getDate() - 180); break;
                case '1y': startDate.setFullYear(startDate.getFullYear() - 1); break;
            }

            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                branchId
            });

            const response = await fetch(`/api/reports/nom-035?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const reportData = await response.json();

            // Transform report data to dashboard format
            const dashboardData: DashboardData = {
                totalEmployees: reportData.summary.totalSurveys,
                evaluatedEmployees: reportData.summary.completedSurveys,
                averageScore: reportData.summary.averageScore,
                riskDistribution: reportData.summary.riskDistribution,
                criticalFactors: reportData.summary.criticalFactors.map((f: any) => ({
                    factor: f.factor,
                    score: f.averageScore,
                    trend: f.averageScore >= 60 ? 'up' : f.averageScore >= 40 ? 'stable' : 'down' as const
                })),
                highRiskEmployees: reportData.employeeEvaluations
                    .filter((e: any) => e.riskLevel === 'ALTO' || e.riskLevel === 'MUY_ALTO')
                    .map((e: any) => ({
                        id: e.employeeId,
                        name: e.employeeName,
                        department: e.department,
                        score: e.overallScore,
                        riskLevel: e.riskLevel
                    })),
                departmentRisk: Object.entries(reportData.summary.byDepartment)
                    .map(([dept, data]: [string, any]) => ({
                        department: dept,
                        averageScore: data.averageScore,
                        riskLevel: data.riskLevel,
                        employeesCount: data.total
                    }))
                    .sort((a, b) => b.averageScore - a.averageScore),
                lastEvaluationDate: reportData.reportPeriod.endDate
            };

            setData(dashboardData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error("Error al cargar datos del dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [selectedPeriod, branchId]);

    const getRiskLevelColor = (level: RiskLevel) => {
        switch (level) {
            case 'MUY_ALTO': return 'text-red-700 bg-red-100 border-red-300';
            case 'ALTO': return 'text-orange-700 bg-orange-100 border-orange-300';
            case 'MEDIO': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
            case 'BAJO': return 'text-green-700 bg-green-100 border-green-300';
            case 'MINIMO': return 'text-emerald-700 bg-emerald-100 border-emerald-300';
        }
    };

    const getRiskLevelName = (level: RiskLevel | number): string => {
        if (typeof level === 'number') {
            if (level < 20) return 'MINIMO';
            if (level < 40) return 'BAJO';
            if (level < 60) return 'MEDIO';
            if (level < 80) return 'ALTO';
            return 'MUY_ALTO';
        }
        const names: Record<RiskLevel, string> = {
            MINIMO: 'Mínimo',
            BAJO: 'Bajo',
            MEDIO: 'Medio',
            ALTO: 'Alto',
            MUY_ALTO: 'Muy Alto'
        };
        return names[level];
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return <TrendingUp className="h-4 w-4 text-red-600" />;
            case 'down': return <TrendingDown className="h-4 w-4 text-green-600" />;
            case 'stable': return <Activity className="h-4 w-4 text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                    <p className="text-muted-foreground">Cargando dashboard de riesgos psicosociales...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No hay datos disponibles</p>
                <Button onClick={fetchDashboardData} className="mt-4" variant="outline">
                    Reintentar
                </Button>
            </div>
        );
    }

    const evaluationRate = data.totalEmployees > 0
        ? Math.round((data.evaluatedEmployees / data.totalEmployees) * 100)
        : 0;

    const highRiskPercentage = data.totalEmployees > 0
        ? Math.round(((data.riskDistribution.ALTO + data.riskDistribution.MUY_ALTO) / data.totalEmployees) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="h-6 w-6 text-purple-600" />
                        Dashboard de Riesgos Psicosociales
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Monitoreo de factores de riesgo psicosocial (NOM-035-STPS-2018)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30d">Últimos 30 días</SelectItem>
                            <SelectItem value="90d">Últimos 90 días</SelectItem>
                            <SelectItem value="180d">Últimos 180 días</SelectItem>
                            <SelectItem value="1y">Último año</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={fetchDashboardData} variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.evaluatedEmployees}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            de {data.totalEmployees} empleados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Evaluación</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{evaluationRate}%</div>
                        <Progress value={evaluationRate} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.averageScore}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Riesgo: {getRiskLevelName(data.averageScore as RiskLevel)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Riesgo Alto/Muy Alto</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{highRiskPercentage}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.riskDistribution.ALTO + data.riskDistribution.MUY_ALTO} empleados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Risk Distribution */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {(Object.entries(data.riskDistribution) as Array<[RiskLevel, number]>).map(([level, count]) => (
                    <Card key={level}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{getRiskLevelName(level)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${getRiskLevelColor(level)}`}>
                                {count}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {data.totalEmployees > 0 ? Math.round((count / data.totalEmployees) * 100) : 0}% del total
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Critical Factors & Department Risk */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Critical Factors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            Factores Críticos
                        </CardTitle>
                        <CardDescription>
                            Factores con mayor puntuación de riesgo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.criticalFactors.map((factor) => (
                            <div key={factor.factor} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{factor.factor}</span>
                                        {getTrendIcon(factor.trend)}
                                    </div>
                                    <Badge
                                        variant={factor.score >= 60 ? 'destructive' : factor.score >= 40 ? 'secondary' : 'default'}
                                    >
                                        {factor.score} pts
                                    </Badge>
                                </div>
                                <Progress
                                    value={factor.score}
                                    className="h-2"
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Department Risk */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Riesgo por Departamento
                        </CardTitle>
                        <CardDescription>
                            Promedio de riesgo por área
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.departmentRisk.slice(0, 5).map((dept) => (
                            <div key={dept.department} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">{dept.department}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {dept.employeesCount} empleados
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Progress value={dept.averageScore} className="w-24 h-2" />
                                    <Badge variant={getRiskLevelName(dept.averageScore) as any}>
                                        {getRiskLevelName(dept.riskLevel)}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* High Risk Employees */}
            {data.highRiskEmployees.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Empleados con Riesgo Alto/Muy Alto
                        </CardTitle>
                        <CardDescription>
                            Requieren atención prioritaria
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.highRiskEmployees.map((employee) => (
                                <div
                                    key={employee.id}
                                    className="flex items-center justify-between border rounded-lg p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{employee.name}</p>
                                            <p className="text-sm text-muted-foreground">{employee.department}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{employee.score} puntos</p>
                                            <Badge variant="destructive" className="text-xs">
                                                {getRiskLevelName(employee.riskLevel)}
                                            </Badge>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedEmployee(employee)}
                                                >
                                                    Ver Detalle
                                                </Button>
                                            </DialogTrigger>
                                        </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Last Update */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Última Actualización
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        {data.lastEvaluationDate
                            ? `Datos actualizados al ${format(data.lastEvaluationDate, "dd 'de' MMMM 'de' yyyy", { locale: es })}`
                            : 'Sin datos de evaluaciones recientes'}
                    </p>
                </CardContent>
            </Card>

            {/* Employee Detail Dialog */}
            {selectedEmployee && (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalle de Empleado</DialogTitle>
                        <DialogDescription>
                            Información de riesgos psicosociales
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">{selectedEmployee.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedEmployee.department}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Puntuación</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">{selectedEmployee.score}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Nivel de Riesgo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Badge
                                        variant="destructive"
                                        className={getRiskLevelColor(selectedEmployee.riskLevel)}
                                    >
                                        {getRiskLevelName(selectedEmployee.riskLevel)}
                                    </Badge>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Recomendaciones
                            </h4>
                            <ul className="space-y-2 text-sm text-red-700">
                                <li>• Programar evaluación psicológica especializada</li>
                                <li>• Revisar condiciones de trabajo actuales</li>
                                <li>• Considerar redistribución de cargas laborales</li>
                                <li>• Establecer seguimiento quincenal</li>
                            </ul>
                        </div>
                    </div>
                </DialogContent>
            )}
        </div>
    );
}
