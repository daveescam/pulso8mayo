'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { AlertCircle, CheckCircle2, Clock, ListChecks, Play, Target } from 'lucide-react';

interface AssignmentStatsProps {
    userId?: string;
}

interface Stats {
    total: number;
    pending: number;
    started: number;
    completed: number;
    overdue: number;
    completedToday: number;
}

export function AssignmentStats({ userId }: AssignmentStatsProps) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const url = userId
                    ? `/api/workflows/assignments/stats?userId=${userId}`
                    : '/api/workflows/assignments/stats';

                const response = await fetch(url, { credentials: 'include' });

                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching assignment stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="h-32 rounded-lg border bg-card animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <StatCard
                title="Total"
                value={stats.total}
                icon={Target}
                description="All assignments"
            />
            <StatCard
                title="Pending"
                value={stats.pending}
                icon={ListChecks}
                description="Not started"
                variant={stats.pending > 0 ? 'warning' : 'default'}
            />
            <StatCard
                title="Started"
                value={stats.started}
                icon={Play}
                description="In progress"
            />
            <StatCard
                title="Completed"
                value={stats.completed}
                icon={CheckCircle2}
                description="Finished tasks"
                variant="success"
            />
            <StatCard
                title="Overdue"
                value={stats.overdue}
                icon={AlertCircle}
                description="Past due date"
                variant={stats.overdue > 0 ? 'danger' : 'default'}
            />
            <StatCard
                title="Today"
                value={stats.completedToday}
                icon={Clock}
                description="Completed today"
            />
        </div>
    );
}
