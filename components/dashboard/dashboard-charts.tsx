"use client"

import { useEffect, useState } from "react"
import { ComplianceRadialChart } from "./compliance-radial-chart"
import { WorkflowStatusChart } from "./workflow-status-chart"
import { DailyExecutionsChart } from "./daily-executions-chart"
import { CriticalIncidentsList } from "./critical-incidents-list"
import { Loader2 } from "lucide-react"

export function DashboardCharts() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/analytics/compliance")
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (error) {
                console.error("Error fetching dashboard charts data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="h-[400px] rounded-xl bg-muted animate-pulse" />
                    <div className="h-[400px] rounded-xl bg-muted animate-pulse" />
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="h-[400px] rounded-xl bg-muted animate-pulse" />
                    <div className="h-[400px] rounded-xl bg-muted animate-pulse" />
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ComplianceRadialChart 
                    data={data.complianceByCategory || []} 
                    overallScore={data.complianceRate} 
                />
                <WorkflowStatusChart 
                    data={data.workflowsByStatus || []} 
                />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DailyExecutionsChart 
                    data={data.dailyTrend || []} 
                />
                <CriticalIncidentsList 
                    incidents={data.criticalIncidents || []} 
                />
            </div>
        </div>
    )
}
