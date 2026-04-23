"use client";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WorkflowInstance {
    id: string;
    templateName: string;
    status: string | null;
    score: number | null;
    assigneeName: string | null;
    updatedAt: Date | null;
}

interface RecentWorkflowsTableProps {
    workflows: WorkflowInstance[];
}

export function RecentWorkflowsTable({ workflows }: RecentWorkflowsTableProps) {
    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case "COMPLETED":
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completado</Badge>;
            case "IN_PROGRESS":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> En Progreso</Badge>;
            case "PENDING":
                return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
            case "BLOCKED":
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Bloqueado</Badge>;
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

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Workflow</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Calificación</TableHead>
                        <TableHead>Asignado a</TableHead>
                        <TableHead>Actualizado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {workflows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No hay actividad reciente.
                            </TableCell>
                        </TableRow>
                    ) : (
                        workflows.map((workflow) => (
                            <TableRow key={workflow.id}>
                                <TableCell className="font-medium">
                                    {workflow.templateName}
                                </TableCell>
                                <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                                <TableCell className={getScoreColor(workflow.score)}>
                                    {workflow.score !== null ? `${workflow.score}%` : "-"}
                                </TableCell>
                                <TableCell>{workflow.assigneeName || "Sin asignar"}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {workflow.updatedAt
                                        ? formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true, locale: es })
                                        : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/workflows/${workflow.id}/execute`}>
                                        <Button variant="ghost" size="sm">
                                            Ver detalles
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
