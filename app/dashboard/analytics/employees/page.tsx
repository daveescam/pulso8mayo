"use client";

import * as React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, AlertTriangle, Info, TrendingUp, Users, DollarSign, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface WorkforceData {
    totalHeadcount: number;
    newHires: number;
    terminations: number;
    turnoverRate: string;
    averageTenure: string;
    headcountTrend: Array<{ month: string; hires: number; terminations: number; net: number }>;
}

interface DemographicsData {
    genderDistribution: Array<{ name: string; value: number }>;
    departmentDistribution: Array<{ name: string; value: number }>;
    branchDistribution: Array<{ branchId: string | null; count: number }>;
}

interface CompensationData {
    avgSalaryByDept: Array<{ department: string; avgSalary: number; count: number }>;
}

interface ComplianceData {
    documentComplianceRate: string;
    expiringDocs: number;
    onboardingCompletionRate: string;
    activeOnboardings: number;
}

interface Insight {
    type: 'WARNING' | 'ALERT' | 'INFO';
    message: string;
    action: string;
}

interface AnalyticsData {
    workforce: WorkforceData;
    demographics: DemographicsData;
    compensation: CompensationData;
    attendance: { attendanceRate: number; absenteeismRate: number; tardinessRate: number };
    performance: { avgPerformanceRating: number };
    compliance: ComplianceData;
    insights: Insight[];
}

export default function EmployeeAnalyticsDashboard() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null);
    const [selectedPeriod, setSelectedPeriod] = React.useState("30d");
    const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date());

    const fetchAnalytics = React.useCallback(async () => {
        try {
            setIsLoading(true);
            // Get company ID from session or context
            const response = await fetch(`/api/analytics/employees?period=${selectedPeriod}`);
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
                setLastRefresh(new Date());
            } else {
                throw new Error('Failed to fetch analytics');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch employee analytics data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [selectedPeriod, toast]);

    React.useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex items-center justify-center h-96">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">No analytics data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Employee Analytics</h1>
                    <p className="text-muted-foreground">
                        Comprehensive workforce insights and trends
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">
                            {lastRefresh.toLocaleTimeString('es-MX')}
                        </span>
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Period Filter */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base">Period</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="YTD">Year to Date</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Insights & Alerts */}
            {analytics.insights.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            Insights & Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.insights.map((insight, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                                        insight.type === 'WARNING' ? 'bg-yellow-50 border-yellow-200' :
                                        insight.type === 'ALERT' ? 'bg-red-50 border-red-200' :
                                        'bg-blue-50 border-blue-200'
                                    }`}
                                >
                                    {insight.type === 'WARNING' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                                    {insight.type === 'ALERT' && <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />}
                                    {insight.type === 'INFO' && <Info className="h-5 w-5 text-blue-600 mt-0.5" />}
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{insight.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{insight.action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Total Headcount
                        </CardDescription>
                        <CardTitle className="text-3xl">{analytics.workforce.totalHeadcount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            New Hires
                        </CardDescription>
                        <CardTitle className="text-3xl text-green-600">{analytics.workforce.newHires}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                            Terminations
                        </CardDescription>
                        <CardTitle className="text-3xl text-red-600">{analytics.workforce.terminations}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Turnover Rate</CardDescription>
                        <CardTitle className="text-3xl">{analytics.workforce.turnoverRate}%</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg Tenure (months)</CardDescription>
                        <CardTitle className="text-3xl">{analytics.workforce.averageTenure}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="workforce" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="workforce">Workforce Trends</TabsTrigger>
                    <TabsTrigger value="demographics">Demographics</TabsTrigger>
                    <TabsTrigger value="compensation">Compensation</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="workforce" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Headcount Trend (Last 6 Months)</CardTitle>
                            <CardDescription>Monthly hires, terminations, and net change</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.workforce.headcountTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="hires" stroke="#10b981" strokeWidth={2} />
                                    <Line type="monotone" dataKey="terminations" stroke="#ef4444" strokeWidth={2} />
                                    <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="demographics" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gender Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.demographics.genderDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {analytics.demographics.genderDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Department Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics.demographics.departmentDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="compensation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Average Salary by Department</CardTitle>
                            <CardDescription>Average monthly salary (MXN)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.compensation.avgSalaryByDept}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="department" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="avgSalary" fill="#10b981" name="Avg Salary" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Document Compliance
                                </CardDescription>
                                <CardTitle className="text-3xl">{analytics.compliance.documentComplianceRate}%</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Expiring Documents</CardDescription>
                                <CardTitle className="text-3xl text-yellow-600">{analytics.compliance.expiringDocs}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Onboarding Completion</CardDescription>
                                <CardTitle className="text-3xl">{analytics.compliance.onboardingCompletionRate}%</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Active Onboardings</CardDescription>
                                <CardTitle className="text-3xl">{analytics.compliance.activeOnboardings}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground">Attendance Rate</div>
                                    <div className="text-2xl font-bold text-green-600">{analytics.attendance.attendanceRate}%</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground">Absenteeism Rate</div>
                                    <div className="text-2xl font-bold text-yellow-600">{analytics.attendance.absenteeismRate}%</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground">Tardiness Rate</div>
                                    <div className="text-2xl font-bold text-orange-600">{analytics.attendance.tardinessRate}%</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
