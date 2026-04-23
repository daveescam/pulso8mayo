import { Metadata } from "next";
import { WorkflowHistoryTable } from "@/components/workflow/workflow-history-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { workflowInstances, workflowTemplates, branches, users } from "@/lib/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata: Metadata = {
    title: "Historial de Workflows - Pulso",
    description: "Consulta el historial completo de workflows ejecutados",
};

export default async function WorkflowHistoryPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // Fetch summary stats
    const stats = session?.user?.companyId ? await db.select({
        total: count(workflowInstances.id),
        completed: sql<number>`COUNT(CASE WHEN ${workflowInstances.status} = 'COMPLETED' THEN 1 END)`,
        inProgress: sql<number>`COUNT(CASE WHEN ${workflowInstances.status} = 'IN_PROGRESS' THEN 1 END)`,
        pending: sql<number>`COUNT(CASE WHEN ${workflowInstances.status} = 'PENDING' THEN 1 END)`,
    })
        .from(workflowInstances)
        .leftJoin(workflowTemplates, eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`))
        .where(eq(workflowTemplates.companyId, session.user.companyId))
        .then(rows => rows[0]) : { total: 0, completed: 0, inProgress: 0, pending: 0 };

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Historial de Workflows</h1>
                    <p className="text-muted-foreground mt-1">
                        Consulta y analiza todos los workflows ejecutados en tu organización
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Total
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats.total || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Completados
                        </CardDescription>
                        <CardTitle className="text-3xl text-green-600">{stats.completed || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-blue-600">
                            <Clock className="h-4 w-4" />
                            En Progreso
                        </CardDescription>
                        <CardTitle className="text-3xl text-blue-600">{stats.inProgress || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-orange-600">
                            <TrendingUp className="h-4 w-4" />
                            Tasa de Completación
                        </CardDescription>
                        <CardTitle className="text-3xl text-orange-600">
                            {stats.total && stats.total > 0 
                                ? Math.round(((stats.completed || 0) / stats.total) * 100) 
                                : 0}%
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Table */}
            <WorkflowHistoryTable />
        </div>
    );
}
