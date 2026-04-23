'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertCircle, AlertTriangle, XCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Incident {
    id: string;
    severity: 'CRITICAL' | 'WARNING' | 'FATAL';
    title: string;
    status: 'DETECTED' | 'IN_REMEDIATION' | 'RESOLVED' | 'ESCALATED';
    createdAt: Date;
    workflowInstanceId: string;
}

interface IncidentListProps {
    incidents: Incident[];
    // Removed function props to avoid serialization issues
}

const severityIcons = {
    CRITICAL: XCircle,
    WARNING: AlertTriangle,
    FATAL: AlertCircle,
};

const severityColors = {
    CRITICAL: 'bg-red-100 text-red-800',
    WARNING: 'bg-yellow-100 text-yellow-800',
    FATAL: 'bg-red-200 text-red-900',
};

const statusColors = {
    DETECTED: 'bg-red-100 text-red-800',
    IN_REMEDIATION: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    ESCALATED: 'bg-orange-100 text-orange-800',
};

export function IncidentList({ incidents }: IncidentListProps) {
    const router = useRouter();
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const handleViewDetails = (id: string) => {
        router.push(`/dashboard/incidents/${id}`);
    };

    const handleResolve = async (id: string) => {
        try {
            await fetch(`/api/incidents/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resolution: 'Resolved from dashboard',
                }),
            });
            router.refresh();
        } catch (error) {
            console.error("Failed to resolve incident", error);
        }
    };

    const filteredIncidents = incidents.filter((incident) => {
        if (severityFilter !== 'all' && incident.severity !== severityFilter) return false;
        if (statusFilter !== 'all' && incident.status !== statusFilter) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="WARNING">Warning</SelectItem>
                        <SelectItem value="FATAL">Fatal</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="DETECTED">Detected</SelectItem>
                        <SelectItem value="IN_REMEDIATION">In Remediation</SelectItem>
                        <SelectItem value="ESCALATED">Escalated</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Severity</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredIncidents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <CheckCircle2 className="h-12 w-12 mb-2 text-green-500" />
                                        <p>No incidents found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredIncidents.map((incident) => {
                                const SeverityIcon = severityIcons[incident.severity];
                                return (
                                    <TableRow key={incident.id}>
                                        <TableCell>
                                            <Badge variant="outline" className={severityColors[incident.severity]}>
                                                <SeverityIcon className="h-3 w-3 mr-1" />
                                                {incident.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{incident.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={statusColors[incident.status]}>
                                                {incident.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(incident.createdAt), 'MMM d, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleViewDetails(incident.id)}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>

                                                {incident.status !== 'RESOLVED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleResolve(incident.id)}
                                                    >
                                                        Resolve
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
