"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, Loader2, Calendar, Users, Workflow, Settings, Building2 } from "lucide-react";
import Link from "next/link";
import { TemplateViewer } from "@/components/onboarding/onboarding-template-viewer";

interface Employee {
    id: string;
    name: string;
    email: string;
    role?: string;
}

export default function NewOnboardingPage() {
    const router = useRouter();
    const { session } = useSession();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [branches, setBranches] = useState<any[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(true);

    const [form, setForm] = useState({
        userId: "",
        templateId: "",
        branchId: "",
        startDate: new Date().toISOString().split("T")[0],
        targetEndDate: "",
        assignedBuddyId: "",
        assignedMentorId: "",
        notes: "",
        hrNotes: "",
    });

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch("/api/users?active=true");
                if (res.ok) {
                    const data = await res.json();
                    const list = data.data || data.users || (Array.isArray(data) ? data : []);
                    setEmployees(Array.isArray(list) ? list : []);
                }
            } catch (e) {
                console.error("Error fetching employees:", e);
            } finally {
                setLoadingEmployees(false);
            }
        };
        fetchEmployees();

        const fetchTemplates = async () => {
            try {
                const res = await fetch("/api/workflows/templates?onboarding=true");
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(data.data || data.templates || []);
                }
            } catch (e) {
                console.error("Error fetching templates:", e);
            } finally {
                setLoadingTemplates(false);
            }
        };
        fetchTemplates();

        const fetchBranches = async () => {
            try {
                const res = await fetch("/api/branches?active=true");
                if (res.ok) {
                    const data = await res.json();
                    const list = data.data || data.branches || (Array.isArray(data) ? data : []);
                    setBranches(Array.isArray(list) ? list : []);
                }
            } catch (e) {
                console.error("Error fetching branches:", e);
            } finally {
                setLoadingBranches(false);
            }
        };
        fetchBranches();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.userId) {
            toast.error("Selecciona un empleado para el onboarding");
            return;
        }
        if (!form.startDate) {
            toast.error("La fecha de inicio es obligatoria");
            return;
        }
        if (!session?.user?.companyId) {
            toast.error("No se pudo obtener la información de la empresa");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/employees/lifecycle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: form.userId,
                    companyId: session.user.companyId,
                    templateId: form.templateId || undefined,
                    startDate: form.startDate,
                    targetEndDate: form.targetEndDate || undefined,
                    assignedBuddyId: form.assignedBuddyId || undefined,
                    assignedMentorId: form.assignedMentorId || undefined,
                    notes: form.notes || undefined,
                    hrNotes: form.hrNotes || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    toast.error("Ya existe un onboarding activo para este empleado");
                } else {
                    toast.error(data.error || "Error al crear el onboarding");
                }
                return;
            }

            toast.success("Onboarding creado exitosamente");
            router.push("/dashboard/employees/onboarding");
        } catch (error) {
            console.error("Error creating onboarding:", error);
            toast.error("Error al crear el onboarding");
        } finally {
            setLoading(false);
        }
    };

    const selectedEmployee = employees.find(e => e.id === form.userId);
    const availableBuddies = employees.filter(e => e.id !== form.userId);

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-4 lg:p-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/employees/onboarding">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                    </Link>
                </Button>
            </div>

            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <UserPlus className="h-6 w-6 text-primary" />
                    Nuevo Onboarding
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Inicia el proceso de incorporación para un nuevo empleado
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Plantilla de Onboarding */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Workflow className="h-4 w-4" /> Plantilla de Onboarding
                        </CardTitle>
                        <CardDescription>Selecciona una plantilla personalizada o usa la estándar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Plantilla de Onboarding</Label>
                            {loadingTemplates ? (
                                <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando plantillas...
                                </div>
                            ) : (
                                <Select value={form.templateId || "standard"} onValueChange={v => setForm(f => ({ ...f, templateId: v === "standard" ? "" : v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una plantilla..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Plantilla Estándar (10 pasos)</SelectItem>
                                        {templates.map(template => (
                                            <SelectItem key={template.id} value={template.id}>
                                                {template.name} — {template.steps?.length || 0} pasos
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {form.templateId && (
                                <p className="text-xs text-muted-foreground">
                                    Plantilla personalizada seleccionada
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sucursal */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Sucursal
                        </CardTitle>
                        <CardDescription>Selecciona la sucursal donde se realizará el onboarding</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Sucursal *</Label>
                            {loadingBranches ? (
                                <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando sucursales...
                                </div>
                            ) : (
                                <Select value={form.branchId} onValueChange={v => setForm(f => ({ ...f, branchId: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una sucursal..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.length === 0 ? (
                                            <SelectItem value="_none" disabled>No hay sucursales disponibles</SelectItem>
                                        ) : (
                                            branches.map(branch => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name} — {branch.address || branch.location}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Vista de Plantilla Seleccionada */}
                <TemplateViewer 
                    template={templates.find(t => t.id === form.templateId)}
                    selectedTemplateId={form.templateId}
                />

                {/* Empleado */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" /> Empleado
                        </CardTitle>
                        <CardDescription>Selecciona el empleado que iniciará el onboarding</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Empleado *</Label>
                            {loadingEmployees ? (
                                <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando empleados...
                                </div>
                            ) : (
                                <Select value={form.userId} onValueChange={v => setForm(f => ({ ...f, userId: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un empleado..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.length === 0 ? (
                                            <SelectItem value="_none" disabled>No hay empleados disponibles</SelectItem>
                                        ) : (
                                            employees.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.name} — {emp.email}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                            {selectedEmployee && (
                                <p className="text-xs text-muted-foreground">
                                    {selectedEmployee.role || "Sin rol asignado"} · {selectedEmployee.email}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Fechas */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Fechas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha de Inicio *</Label>
                            <Input
                                type="date"
                                value={form.startDate}
                                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha Estimada de Fin</Label>
                            <Input
                                type="date"
                                value={form.targetEndDate}
                                onChange={e => setForm(f => ({ ...f, targetEndDate: e.target.value }))}
                                min={form.startDate}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Apoyo */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Asignación de Apoyo</CardTitle>
                        <CardDescription>Opcional — asigna un buddy y/o mentor al nuevo empleado</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Buddy (Acompañante)</Label>
                            <Select
                                value={form.assignedBuddyId}
                                onValueChange={v => setForm(f => ({ ...f, assignedBuddyId: v === "_none" ? "" : v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin buddy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin buddy</SelectItem>
                                    {availableBuddies.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Mentor</Label>
                            <Select
                                value={form.assignedMentorId}
                                onValueChange={v => setForm(f => ({ ...f, assignedMentorId: v === "_none" ? "" : v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin mentor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin mentor</SelectItem>
                                    {availableBuddies.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Notas */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Notas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Notas Generales</Label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Instrucciones especiales, detalles del rol, etc."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notas de RH (internas)</Label>
                            <Textarea
                                value={form.hrNotes}
                                onChange={e => setForm(f => ({ ...f, hrNotes: e.target.value }))}
                                placeholder="Notas internas del departamento de Recursos Humanos..."
                                rows={2}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Info: pasos automáticos */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">✨ Pasos creados automáticamente</p>
                    <p className="text-xs">Al crear el onboarding se generarán 10 pasos estándar: documentos personales, contrato de trabajo, capacitación de seguridad, entrega de uniformes y más.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" asChild>
                        <Link href="/dashboard/employees/onboarding">Cancelar</Link>
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading || !form.userId}>
                        {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</>
                        ) : (
                            <><UserPlus className="h-4 w-4 mr-2" /> Crear Onboarding</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
