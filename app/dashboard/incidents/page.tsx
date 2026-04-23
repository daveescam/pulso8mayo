import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { incidents } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { IncidentList } from '@/components/incidents/incident-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

async function getIncidents(branchId?: string) {
    const conditions = [];

    if (branchId) {
        conditions.push(eq(incidents.branchId, branchId));
    }

    const query = db
        .select()
        .from(incidents)
        .orderBy(desc(incidents.createdAt))
        .limit(100);

    if (conditions.length > 0) {
        return await query.where(and(...conditions));
    }

    return await query;
}

async function getIncidentStats(allIncidents: any[]) {
    const total = allIncidents.length;
    const active = allIncidents.filter(i => i.status !== 'RESOLVED').length;
    const critical = allIncidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'FATAL').length;
    const resolved = allIncidents.filter(i => i.status === 'RESOLVED').length;

    return { total, active, critical, resolved };
}

export default async function IncidentsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect('/sign-in');
    }

    // Get user's branch (you may need to adjust this based on your auth setup)
    const userBranchId = (session.user as any).branchId;

    const allIncidents = await getIncidents(userBranchId);
    const stats = await getIncidentStats(allIncidents);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
                <p className="text-muted-foreground">
                    Monitor and manage workflow incidents
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Incidents List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Incidents</CardTitle>
                    <CardDescription>
                        View and manage incidents from workflow executions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Loading incidents...</div>}>
                        <IncidentList
                            incidents={allIncidents}
                        />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
