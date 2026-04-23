"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit, TrendingUp, Loader2, Target } from "lucide-react";

interface KPI {
    id: string;
    name: string;
    description?: string;
    formula: string;
    metricType: string;
    target?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
    unit?: string;
    category: string;
    frequency: string;
    active: boolean;
    isSystem: boolean;
}

interface KPIBuilderProps {
    branchId: string;
    companyId: string;
}

const metricTypes = [
    { value: "PERCENTAGE", label: "Porcentaje (%)" },
    { value: "COUNT", label: "Cantidad" },
    { value: "AVERAGE", label: "Promedio" },
    { value: "SUM", label: "Suma Total" },
    { value: "TIME", label: "Tiempo (horas)" },
    { value: "RATIO", label: "Proporción" }
];

const frequencies = [
    { value: "REALTIME", label: "Tiempo Real" },
    { value: "HOURLY", label: "Cada Hora" },
    { value: "DAILY", label: "Diario" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "MONTHLY", label: "Mensual" }
];

const categories = [
    { value: "OPERATIONS", label: "Operaciones" },
    { value: "COMPLIANCE", label: "Compliance" },
    { value: "LABOR", label: "Laboral" },
    { value: "INVENTORY", label: "Inventario" },
    { value: "SALES", label: "Ventas" }
];

const presetFormulas = [
    {
        name: "Workflow Completion Rate",
        formula: "(completed_workflows / total_workflows) * 100",
        description: "Porcentaje de workflows completados a tiempo"
    },
    {
        name: "Compliance Rate",
        formula: "(compliant_inspections / total_inspections) * 100",
        description: "Porcentaje de inspecciones compliantes"
    },
    {
        name: "On-Time Completion",
        formula: "(on_time_workflows / completed_workflows) * 100",
        description: "Porcentaje de workflows completados a tiempo"
    },
    {
        name: "Incident Resolution Rate",
        formula: "(resolved_incidents / total_incidents) * 100",
        description: "Porcentaje de incidentes resueltos"
    },
    {
        name: "Inventory Accuracy",
        formula: "(accurate_counts / total_counts) * 100",
        description: "Precisión del inventario"
    },
    {
        name: "Stockout Rate",
        formula: "(stockout_items / total_items) * 100",
        description: "Porcentaje de items agotados"
    },
    {
        name: "Employee Attendance",
        formula: "(attended_shifts / scheduled_shifts) * 100",
        description: "Porcentaje de asistencia de empleados"
    },
    {
        name: "Overtime Rate",
        formula: "(overtime_hours / total_hours) * 100",
        description: "Porcentaje de horas extra"
    }
];

export function KPIBuilder({ branchId, companyId }: KPIBuilderProps) {
    const [loading, setLoading] = useState(false);
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
    const [usePreset, setUsePreset] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [formula, setFormula] = useState("");
    const [metricType, setMetricType] = useState("PERCENTAGE");
    const [target, setTarget] = useState<string>("");
    const [warningThreshold, setWarningThreshold] = useState<string>("");
    const [criticalThreshold, setCriticalThreshold] = useState<string>("");
    const [unit, setUnit] = useState("");
    const [category, setCategory] = useState("OPERATIONS");
    const [frequency, setFrequency] = useState("DAILY");
    const [active, setActive] = useState(true);

    const fetchKPIs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/kpi?branchId=${branchId}`);
            if (response.ok) {
                const data = await response.json();
                setKpis(data.kpis || []);
            }
        } catch (error) {
            console.error("Error fetching KPIs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (branchId && companyId) {
            fetchKPIs();
        }
    }, [branchId, companyId]);

    const handleSaveKPI = async () => {
        if (!name || !formula) {
            toast.error("Nombre y fórmula son requeridos");
            return;
        }

        try {
            const kpiData = {
                name,
                description,
                formula,
                metricType,
                target: target ? parseInt(target) : null,
                warningThreshold: warningThreshold ? parseInt(warningThreshold) : null,
                criticalThreshold: criticalThreshold ? parseInt(criticalThreshold) : null,
                thresholdType: "TARGET",
                frequency,
                unit,
                category,
                branchId
            };

            const url = editingKpi
                ? `/api/kpi?id=${editingKpi.id}`
                : "/api/kpi";

            const response = await fetch(url, {
                method: editingKpi ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(kpiData)
            });

            if (response.ok) {
                toast.success(editingKpi ? "KPI actualizado" : "KPI creado");
                setIsDialogOpen(false);
                resetForm();
                await fetchKPIs();
            } else {
                const error = await response.json();
                toast.error(error.error || "Error al guardar KPI");
            }
        } catch (error) {
            console.error("Error saving KPI:", error);
            toast.error("Error al guardar KPI");
        }
    };

    const handleEditKPI = (kpi: KPI) => {
        setEditingKpi(kpi);
        setName(kpi.name);
        setDescription(kpi.description || "");
        setFormula(kpi.formula);
        setMetricType(kpi.metricType);
        setTarget(kpi.target?.toString() || "");
        setWarningThreshold(kpi.warningThreshold?.toString() || "");
        setCriticalThreshold(kpi.criticalThreshold?.toString() || "");
        setUnit(kpi.unit || "");
        setCategory(kpi.category);
        setFrequency(kpi.frequency);
        setActive(kpi.active);
        setIsDialogOpen(true);
    };

    const handleDeleteKPI = async (kpiId: string) => {
        if (!confirm("¿Estás seguro de eliminar este KPI?")) return;

        try {
            const response = await fetch(`/api/kpi?id=${kpiId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                toast.success("KPI eliminado");
                await fetchKPIs();
            } else {
                const error = await response.json();
                toast.error(error.error || "Error al eliminar KPI");
            }
        } catch (error) {
            console.error("Error deleting KPI:", error);
            toast.error("Error al eliminar KPI");
        }
    };

    const handleSelectPreset = (presetName: string) => {
        const preset = presetFormulas.find(p => p.name === presetName);
        if (preset) {
            setName(preset.name);
            setFormula(preset.formula);
            setDescription(preset.description);
            setMetricType("PERCENTAGE");
            setTarget("90");
            setWarningThreshold("75");
            setCriticalThreshold("50");
            setUnit("%");
        }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setFormula("");
        setMetricType("PERCENTAGE");
        setTarget("");
        setWarningThreshold("");
        setCriticalThreshold("");
        setUnit("");
        setCategory("OPERATIONS");
        setFrequency("DAILY");
        setActive(true);
        setEditingKpi(null);
        setUsePreset(false);
        setSelectedPreset("");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">KPIs y Métricas</h2>
                    <p className="text-muted-foreground">
                        Define y rastrea los indicadores clave de rendimiento
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo KPI
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingKpi ? "Editar KPI" : "Crear Nuevo KPI"}
                            </DialogTitle>
                            <DialogDescription>
                                Define un indicador clave de rendimiento (KPI) para rastrear métricas importantes
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Preset Selection */}
                            {!editingKpi && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>¿Usar fórmula predefinida?</Label>
                                        <Switch
                                            checked={usePreset}
                                            onCheckedChange={setUsePreset}
                                        />
                                    </div>
                                    {usePreset && (
                                        <Select value={selectedPreset} onValueChange={handleSelectPreset}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar fórmula predefinida" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {presetFormulas.map((preset) => (
                                                    <SelectItem key={preset.name} value={preset.name}>
                                                        {preset.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Tasa de Completación de Workflows"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descripción del KPI"
                                />
                            </div>

                            {/* Formula */}
                            <div className="grid gap-2">
                                <Label htmlFor="formula">Fórmula *</Label>
                                <Input
                                    id="formula"
                                    value={formula}
                                    onChange={(e) => setFormula(e.target.value)}
                                    placeholder="Ej: (completed_workflows / total_workflows) * 100"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Usa variables como: completed_workflows, total_workflows, compliant_inspections, etc.
                                </p>
                            </div>

                            {/* Metric Type and Frequency */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="metricType">Tipo de Métrica</Label>
                                    <Select value={metricType} onValueChange={setMetricType}>
                                        <SelectTrigger id="metricType">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {metricTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="frequency">Frecuencia de Cálculo</Label>
                                    <Select value={frequency} onValueChange={setFrequency}>
                                        <SelectTrigger id="frequency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {frequencies.map((freq) => (
                                                <SelectItem key={freq.value} value={freq.value}>
                                                    {freq.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Targets and Thresholds */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="target">Objetivo</Label>
                                    <Input
                                        id="target"
                                        type="number"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                        placeholder="90"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="warning">Umbral Amarillo</Label>
                                    <Input
                                        id="warning"
                                        type="number"
                                        value={warningThreshold}
                                        onChange={(e) => setWarningThreshold(e.target.value)}
                                        placeholder="75"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="critical">Umbral Rojo</Label>
                                    <Input
                                        id="critical"
                                        type="number"
                                        value={criticalThreshold}
                                        onChange={(e) => setCriticalThreshold(e.target.value)}
                                        placeholder="50"
                                    />
                                </div>
                            </div>

                            {/* Unit and Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="unit">Unidad</Label>
                                    <Input
                                        id="unit"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        placeholder="Ej: %, hrs, unidades"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="category">Categoría</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger id="category">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="active">KPI Activo</Label>
                                <Switch
                                    id="active"
                                    checked={active}
                                    onCheckedChange={setActive}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveKPI}>
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                {editingKpi ? "Actualizar" : "Crear"} KPI
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* KPI List */}
            <Card>
                <CardHeader>
                    <CardTitle>KPIs Configurados</CardTitle>
                    <CardDescription>
                        Lista de todos los indicadores clave de rendimiento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : kpis.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay KPIs configurados</p>
                            <p className="text-sm">Crea tu primer KPI para comenzar a rastrear métricas</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Fórmula</TableHead>
                                    <TableHead>Objetivo</TableHead>
                                    <TableHead>Frecuencia</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kpis.map((kpi) => (
                                    <TableRow key={kpi.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div>{kpi.name}</div>
                                                {kpi.description && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {kpi.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {metricTypes.find(t => t.value === kpi.metricType)?.label || kpi.metricType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-xs font-mono">
                                            {kpi.formula}
                                        </TableCell>
                                        <TableCell>
                                            {kpi.target ? (
                                                <div className="flex items-center gap-1">
                                                    <Target className="h-3 w-3" />
                                                    {kpi.target}{kpi.unit}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {frequencies.find(f => f.value === kpi.frequency)?.label || kpi.frequency}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={kpi.active ? "default" : "secondary"}>
                                                {kpi.active ? "Activo" : "Inactivo"}
                                            </Badge>
                                            {kpi.isSystem && (
                                                <Badge variant="outline" className="ml-1">
                                                    Sistema
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditKPI(kpi)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {!kpi.isSystem && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteKPI(kpi.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
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

            {/* Preset Formulas Reference */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Fórmulas Predefinidas Disponibles</CardTitle>
                    <CardDescription>
                        Puedes usar estas fórmulas como punto de partida
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                        {presetFormulas.map((preset) => (
                            <div
                                key={preset.name}
                                className="p-3 rounded-lg border bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                                onClick={() => {
                                    handleSelectPreset(preset.name);
                                    setIsDialogOpen(true);
                                }}
                            >
                                <div className="font-medium text-sm">{preset.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {preset.description}
                                </div>
                                <div className="text-xs font-mono mt-2 text-blue-600 dark:text-blue-400">
                                    {preset.formula}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
