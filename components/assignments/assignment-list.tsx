'use client';

import { useEffect, useState } from 'react';
import { AssignmentCard } from './assignment-card';
import { Loader2 } from 'lucide-react';

interface Assignment {
    id: string;
    instanceId: string;
    assignedTo: string;
    status: 'PENDING' | 'NOTIFIED' | 'STARTED' | 'COMPLETED' | 'OVERDUE';
    dueDate: Date;
    isOverdue: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    notes?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

interface WorkflowInstance {
    id: string;
    workflowTemplateId: string;
    status: string;
}

interface AssignmentWithInstance {
    assignment: Assignment;
    instance: WorkflowInstance;
}

interface AssignmentFilters {
    status?: string;
    priority?: string;
    isOverdue?: boolean;
}

interface AssignmentListProps {
    userId?: string;
    filters?: AssignmentFilters;
    onStatusChange: (assignmentId: string, status: Assignment['status']) => void;
    onViewDetails: (assignmentId: string) => void;
}

export function AssignmentList({
    userId,
    filters,
    onStatusChange,
    onViewDetails,
}: AssignmentListProps) {
    const [assignments, setAssignments] = useState<AssignmentWithInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssignments = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();

                if (userId) {
                    params.append('userId', userId);
                }
                if (filters?.status) {
                    params.append('status', filters.status);
                }
                if (filters?.priority) {
                    params.append('priority', filters.priority);
                }
                if (filters?.isOverdue !== undefined) {
                    params.append('isOverdue', String(filters.isOverdue));
                }

                const response = await fetch(`/api/workflows/assignments?${params}`, {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch assignments');
                }

                const data = await response.json();
                setAssignments(Array.isArray(data.data) ? data.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [userId, filters]);

    const handleStatusChange = async (assignmentId: string, newStatus: Assignment['status']) => {
        try {
            const response = await fetch(`/api/workflows/assignments/${assignmentId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update assignment status');
            }

            const updated = await response.json();

            setAssignments(assignments.map(item =>
                item.assignment.id === assignmentId
                    ? { ...item, assignment: updated }
                    : item
            ));

            onStatusChange(assignmentId, newStatus);
        } catch (err) {
            alert('Error al actualizar el estado de la tarea');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Error: {error}</p>
            </div>
        );
    }

    if (assignments.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    No tienes tareas asignadas en este momento.
                </p>
            </div>
        );
    }

    // Group assignments by status
    const groupedAssignments = {
        overdue: assignments.filter(a => a.assignment.isOverdue),
        pending: assignments.filter(a => !a.assignment.isOverdue && (a.assignment.status === 'PENDING' || a.assignment.status === 'NOTIFIED')),
        started: assignments.filter(a => a.assignment.status === 'STARTED'),
        completed: assignments.filter(a => a.assignment.status === 'COMPLETED'),
    };

    return (
        <div className="space-y-6">
            {groupedAssignments.overdue.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-600">Vencidas ({groupedAssignments.overdue.length})</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groupedAssignments.overdue.map(({ assignment, instance }) => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                instance={instance}
                                onStatusChange={(status) => handleStatusChange(assignment.id, status)}
                                onViewDetails={() => onViewDetails(assignment.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {groupedAssignments.pending.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Pendientes ({groupedAssignments.pending.length})</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groupedAssignments.pending.map(({ assignment, instance }) => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                instance={instance}
                                onStatusChange={(status) => handleStatusChange(assignment.id, status)}
                                onViewDetails={() => onViewDetails(assignment.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {groupedAssignments.started.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">En Progreso ({groupedAssignments.started.length})</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groupedAssignments.started.map(({ assignment, instance }) => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                instance={instance}
                                onStatusChange={(status) => handleStatusChange(assignment.id, status)}
                                onViewDetails={() => onViewDetails(assignment.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {groupedAssignments.completed.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Completadas ({groupedAssignments.completed.length})</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groupedAssignments.completed.map(({ assignment, instance }) => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                instance={instance}
                                onStatusChange={(status) => handleStatusChange(assignment.id, status)}
                                onViewDetails={() => onViewDetails(assignment.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
