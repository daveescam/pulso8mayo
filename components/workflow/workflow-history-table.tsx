"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
    CheckCircle2, 
    Clock, 
    XCircle, 
    AlertTriangle, 
    Search, 
    Filter, 
    Download,
    Eye,
    Play,
    Calendar,
    User,
    FileText
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface WorkflowHistoryItem {
    id: string;
    templateName: string;
    templateId: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "FAILED" | "CANCELLED";
    score: number | null;
    assigneeName: string | null;
    assigneeId: string | null;
    branchName: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    stepsTotal: number;
    stepsCompleted: number;
    hasIncidents: boolean;
    hasEvidence: boolean;
    evidenceCount: number;
}

interface WorkflowHistoryFilters {
    status?: string;
    templateId?: string;
    assigneeId?: string;
    branchId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

interface WorkflowHistoryTableProps {
  initialData?: WorkflowHistoryItem[];
  branchId?: string;
}

export function WorkflowHistoryTable({ initialData, branchId: initialBranchId }: WorkflowHistoryTableProps) {
  const [workflows, setWorkflows] = useState<WorkflowHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<WorkflowHistoryFilters>({
    branchId: initialBranchId || undefined
  });
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  // Update filters when branchId prop changes
  useEffect(() => {
    if (initialBranchId !== filters.branchId) {
      setFilters(prev => ({ ...prev, branchId: initialBranchId || undefined }));
    }
  }, [initialBranchId]);

  // Fetch workflows
  useEffect(() => {
    fetchWorkflows();
    fetchFilters();
  }, [filters]);

    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.templateId) params.append("templateId", filters.templateId);
            if (filters.assigneeId) params.append("assigneeId", filters.assigneeId);
            if (filters.branchId) params.append("branchId", filters.branchId);
            if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
            if (filters.dateTo) params.append("dateTo", filters.dateTo);
            if (filters.search) params.append("search", filters.search);

            const response = await fetch(`/api/workflows/history?${params}`);
            if (response.ok) {
                const data = await response.json();
                setWorkflows(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch workflows:", error);
            toast.error("Error al cargar el historial");
        } finally {
            setLoading(false);
        }
    };

    const fetchFilters = async () => {
        try {
            const response = await fetch("/api/workflows/history/filters");
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates || []);
                setAssignees(data.assignees || []);
                setBranches(data.branches || []);
            }
        } catch (error) {
            console.error("Failed to fetch filter options:", error);
        }
    };

    const getStatusBadge = (status: WorkflowHistoryItem["status"]) => {
        switch (status) {
            case "COMPLETED":
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completado</Badge>;
            case "IN_PROGRESS":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Play className="w-3 h-3 mr-1" /> En Progreso</Badge>;
            case "PENDING":
                return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
            case "BLOCKED":
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Bloqueado</Badge>;
            case "FAILED":
                return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Fallido</Badge>;
            case "CANCELLED":
                return <Badge variant="secondary">Cancelado</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-muted-foreground";
        if (score >= 90) return "text-green-600 font-bold";
        if (score >= 70) return "text-yellow-600 font-bold";
        return "text-red-600 font-bold";
    };

    const getProgressPercentage = (completed: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    };

    const clearFilters = () => {
        setFilters({});
    };

    const hasFilters = Object.values(filters).some(v => v !== undefined && v !== "");

    const handleExport = () => {
        toast.info("Exportando historial a CSV...");
        // TODO: Implement CSV export
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <CardTitle className="text-base">Filtros</CardTitle>
                        </div>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nombre del workflow..."
                                    value={filters.search || ""}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estado</label>
                            <Select
                                value={filters.status || "all"}
                                onValueChange={(value) =>
                                    setFilters({ ...filters, status: value === "all" ? undefined : value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="COMPLETED">Completado</SelectItem>
                                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                                    <SelectItem value="PENDING">Pendiente</SelectItem>
                                    <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                                    <SelectItem value="FAILED">Fallido</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Plantilla</label>
                            <Select
                                value={filters.templateId || "all"}
                                onValueChange={(value) =>
                                    setFilters({ ...filters, templateId: value === "all" ? undefined : value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las plantillas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las plantillas</SelectItem>
                                    {templates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sucursal</label>
                            <Select
                                value={filters.branchId || "all"}
                                onValueChange={(value) =>
                                    setFilters({ ...filters, branchId: value === "all" ? undefined : value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las sucursales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las sucursales</SelectItem>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Asignado a</label>
                            <Select
                                value={filters.assigneeId || "all"}
                                onValueChange={(value) =>
                                    setFilters({ ...filters, assigneeId: value === "all" ? undefined : value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los usuarios" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los usuarios</SelectItem>
                                    {assignees.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fecha desde</label>
                            <Input
                                type="date"
                                value={filters.dateFrom || ""}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fecha hasta</label>
                            <Input
                                type="date"
                                value={filters.dateTo || ""}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button variant="outline" onClick={handleExport} className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Workflows</CardTitle>
                    <CardDescription>
                        Lista completa de todos los workflows ejecutados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                No se encontraron workflows con los filtros seleccionados
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Workflow</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Progreso</TableHead>
                                        <TableHead>Calificación</TableHead>
                                        <TableHead>Asignado</TableHead>
                                        <TableHead>Sucursal</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workflows.map((workflow) => (
                                        <TableRow key={workflow.id}>
                                            <TableCell className="font-medium">
                                                <div className="space-y-1">
                                                    <div>{workflow.templateName}</div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        {workflow.hasEvidence && (
                                                            <span className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                {workflow.evidenceCount} evidencias
                                                            </span>
                                                        )}
                                                        {workflow.hasIncidents && (
                                                            <span className="flex items-center gap-1 text-orange-600">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                Incidentes
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24">
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary transition-all"
                                                                style={{ width: `${getProgressPercentage(workflow.stepsCompleted, workflow.stepsTotal)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {workflow.stepsCompleted}/{workflow.stepsTotal}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={getScoreColor(workflow.score)}>
                                                {workflow.score !== null ? `${workflow.score}%` : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {workflow.assigneeName ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {workflow.assigneeName}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Sin asignar</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{workflow.branchName}</TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        {format(new Date(workflow.createdAt), "dd MMM yyyy", { locale: es })}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(workflow.createdAt), { addSuffix: true, locale: es })}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/dashboard/workflows/${workflow.id}/execute`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Ver
                                                        </Button>
                                                    </Link>
                                                    {workflow.status === "PENDING" && (
                                                        <Link href={`/dashboard/workflows/${workflow.id}/execute`}>
                                                            <Button variant="default" size="sm">
                                                                <Play className="h-4 w-4 mr-2" />
                                                                Iniciar
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
