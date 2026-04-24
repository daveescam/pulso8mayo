"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CheckCircle, AlertTriangle, Calculator, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface SATStats {
    validRFCs: number;
    invalidRFCs: number;
    totalEmployees: number;
    certificatesGenerated: number;
    monthlyWithholding: number;
}

export default function SATPage() {
    const [stats, setStats] = useState<SATStats>({
        validRFCs: 0,
        invalidRFCs: 0,
        totalEmployees: 0,
        certificatesGenerated: 0,
        monthlyWithholding: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [empRes, certRes] = await Promise.all([
                    fetch("/api/employees"),
                    fetch("/api/sat/certificates"),
                ]);

                let validRFCs = 0, invalidRFCs = 0, totalEmployees = 0;
                let certificatesGenerated = 0;

                if (empRes.ok) {
                    const empData = await empRes.json();
                    totalEmployees = empData.pagination?.total || 0;
                }
                if (certRes.ok) {
                    const certData = await certRes.json();
                    certificatesGenerated = certData.generated || 0;
                    validRFCs = certData.generated || 0;
                    invalidRFCs = certData.pending || 0;
                }

                setStats({
                    validRFCs,
                    invalidRFCs,
                    totalEmployees,
                    certificatesGenerated,
                    monthlyWithholding: 0,
                });
            } catch (e) {
                console.error("Error loading stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">SAT Integration</h1>
                <p className="text-muted-foreground">
                    Servicio de Administración Tributaria (SAT) compliance and reporting
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valid RFCs</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.validRFCs}</div>
                            <p className="text-xs text-muted-foreground">
                                Of {stats.totalEmployees} employees
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Invalid/Expired</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.invalidRFCs}</div>
                            <p className="text-xs text-muted-foreground">
                                Need attention
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Annual Certificates</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.certificatesGenerated}</div>
                            <p className="text-xs text-muted-foreground">
                                Generated this year
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Withholding Tax</CardTitle>
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${(stats.monthlyWithholding / 100).toLocaleString("es-MX")}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Monthly average
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="validation">RFC/CURP Validation</TabsTrigger>
                    <TabsTrigger value="certificates">Salary Certificates</TabsTrigger>
                    <TabsTrigger value="reports">Tax Reports</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>SAT Compliance Overview</CardTitle>
                            <CardDescription>
                                Current status of SAT validations and reporting
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">RFC Validation</p>
                                        <p className="text-sm text-muted-foreground">
                                            All employees must have valid RFC for tax purposes
                                        </p>
                                    </div>
                                    <Link href="/dashboard/compliance/sat/validation">
                                        <Button size="sm" variant="outline">
                                            Validar RFC/CURP
                                        </Button>
                                    </Link>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Salary Certificates</p>
                                        <p className="text-sm text-muted-foreground">
                                            Constancia de Retenciones e Ingresos
                                        </p>
                                    </div>
                                    <Link href="/dashboard/compliance/sat/certificates">
                                        <Button size="sm" variant="outline">
                                            Generar Constancias
                                        </Button>
                                    </Link>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Annual Tax Summary</p>
                                        <p className="text-sm text-muted-foreground">
                                            Complete tax year summary
                                        </p>
                                    </div>
                                    <Button size="sm" variant="outline" disabled>
                                        Generate Report
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="validation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>RFC/CURP Validation</CardTitle>
                            <CardDescription>
                                Valida RFC y CURP de empleados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                Valida el formato de RFC y CURP de manera individual o masiva.
                            </p>
                            <Link href="/dashboard/compliance/sat/validation">
                                <Button>
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Ir a Validación
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="certificates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Salary Certificates (Constancia de Retenciones)</CardTitle>
                            <CardDescription>
                                Generate annual salary certificates for employees
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                Genera Constancia de Retenciones e Ingresos requerida por SAT.
                            </p>
                            <Link href="/dashboard/compliance/sat/certificates">
                                <Button>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Ir a Constancias
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>SAT Tax Reports</CardTitle>
                            <CardDescription>
                                Generate reports for SAT compliance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium">Monthly ISR Report</h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Income tax withholding summary
                                        </p>
                                        <Button size="sm" variant="outline" disabled>
                                            Generate Report
                                        </Button>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium">Annual Tax Summary</h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Complete tax year summary
                                        </p>
                                        <Button size="sm" variant="outline" disabled>
                                            Generate Report
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>SAT Settings</CardTitle>
                            <CardDescription>
                                Configure SAT integration settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Configura el RFC de la empresa y preferencias de reporte.
                                Esta funcionalidad estará disponible en la siguiente versión.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}