'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Calendar, CheckCircle, Clock, ListTodo } from 'lucide-react';

interface ScheduleStatsProps {
    branchId: string;
}

interface Stats {
    totalSchedules: number;
    activeSchedules: number;
    executionsToday: number;
    upcomingExecutions: number;
}

export function ScheduleStats({ branchId }: ScheduleStatsProps) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(
                    `/api/workflows/schedules/stats?branchId=${branchId}`,
                    { credentials: 'include' }
                );

                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching schedule stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [branchId]);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Total Schedules"
                value={stats.totalSchedules}
                icon={ListTodo}
                description="All configured schedules"
            />
            <StatCard
                title="Active Schedules"
                value={stats.activeSchedules}
                icon={CheckCircle}
                description="Currently running"
                variant="success"
            />
            <StatCard
                title="Executions Today"
                value={stats.executionsToday}
                icon={Calendar}
                description="Workflows executed today"
            />
            <StatCard
                title="Upcoming"
                value={stats.upcomingExecutions}
                icon={Clock}
                description="Next 24 hours"
            />
        </div>
    );
}
