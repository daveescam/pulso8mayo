"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, MapPin, Users, UserCog, Calendar, Clock, QrCode, Mail, Send } from "lucide-react";
import { updateBranchSchema } from "@/lib/validations/branch";
import { QRCodeGenerator } from "@/components/qr-code-generator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BranchManagerSelector } from "@/components/branch-manager-selector";
import { OperatingHoursPicker } from "@/components/operating-hours-picker";
import { HolidaysManager } from "@/components/holidays-manager";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Branch {
    id: string;
    name: string;
    address: string | null;
    timezone: string;
    operatingHours: any;
    location: any;
    managerId: string | null;
    inviteToken: string;
    managerInviteToken: string;
    active: boolean;
manager?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

interface Employee {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

export default function BranchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [branch, setBranch] = useState<Branch | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [companyId, setCompanyId] = useState<string>("");
    const [branchLoading, setBranchLoading] = useState(true);
    
    // UI State
    const [activeTab, setActiveTab] = useState("general");
    const [inviteManagerOpen, setInviteManagerOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePhone, setInvitePhone] = useState("");

    const form = useForm<z.infer<typeof updateBranchSchema>>({
        resolver: zodResolver(updateBranchSchema),
        defaultValues: {
            name: "",
            address: "",
            timezone: "America/Mexico_City",
            operatingHours: undefined,
            managerId: null
        },
    });

    useEffect(() => {
        async function loadBranch() {
            try {
                const id = resolvedParams?.id;
                if (!id) return;

                if (id === 'new') {
                    setBranchLoading(false);
                    return;
                }

                setBranchLoading(true);
                const res = await fetch(`/api/branches/${id}`);
                if (!res.ok) throw new Error("Failed to load");
                const response = await res.json();
                const data = response.data;

                setBranch(data);
                setCompanyId(data.companyId);

                form.reset({
                    name: data.name,
                    address: data.address || "",
                    timezone: data.timezone || "America/Mexico_City",
                    operatingHours: data.operatingHours,
                    managerId: data.managerId || null
                });
            } catch (e) {
                console.error(e);
                toast.error("Error loading branch");
            } finally {
                setBranchLoading(false);
            }
        }
        loadBranch();
    }, [resolvedParams, form]);

    useEffect(() => {
        async function loadEmployees() {
            if (resolvedParams?.id === 'new') return;
            
            try {
                const res = await fetch(`/api/branches/${resolvedParams?.id}/employees`);
                if (!res.ok) return;
                const response = await res.json();
                setEmployees(response.data || []);
            } catch (e) {
                console.error(e);
            }
        }
        loadEmployees();
    }, [resolvedParams]);

    async function onSubmit(data: z.infer<typeof updateBranchSchema>) {
        setSaving(true);
        const id = resolvedParams?.id;
        const isNew = id === 'new';

        try {
            const res = await fetch(isNew ? '/api/branches' : `/api/branches/${id}`, {
                method: isNew ? 'POST' : 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed");

            const response = await res.json();

            if (isNew) {
                toast.success("Sucursal creada exitosamente");
                router.push(`/dashboard/company/branches/${response.data.id}`);
            } else {
                toast.success("Sucursal actualizada");
                setBranch(response.data);
            }
        } catch (e) {
            toast.error(isNew ? "Error al crear sucursal" : "Error al guardar");
        } finally {
            setSaving(false);
        }
    }

    const handleManagerChange = async (managerId: string | null) => {
        form.setValue("managerId", managerId);
        
        // Auto-save when manager changes
        if (branch && branch.id !== 'new') {
            setSaving(true);
            try {
                const res = await fetch(`/api/branches/${branch.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ managerId })
                });
                
                if (!res.ok) throw new Error("Failed to update manager");
                
                const response = await res.json();
                setBranch(response.data);
                toast.success("Gerente actualizado");
            } catch (e) {
                console.error(e);
                toast.error("Error al actualizar gerente");
            } finally {
                setSaving(false);
            }
        }
    };

    const handleOperatingHoursChange = (value: any) => {
        form.setValue("operatingHours", value);
    };

    const smartLink = typeof window !== 'undefined' && branch?.inviteToken 
        ? `${window.location.origin}/join/${branch.inviteToken}` 
        : '';

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleInviteManager = async () => {
        if (!inviteEmail && !invitePhone) {
            toast.error("Ingresa un Email o WhatsApp para enviar la invitación");
            return;
        }

        try {
            setSaving(true);
            
            if (inviteEmail) {
                const res = await fetch("/api/branches/invite-manager", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        branchId: branch.id,
                        email: inviteEmail,
                    }),
                });

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.message || "Failed to send invitation");
                }
            }

            toast.success("Invitación de Gerente enviada exitosamente" + (inviteEmail ? " por Email" : "") + (invitePhone ? " por WhatsApp" : ""));
            setInviteManagerOpen(false);
            setInviteEmail("");
            setInvitePhone("");
        } catch (e) {
            console.error(e);
            toast.error("Error al enviar invitación");
        } finally {
            setSaving(false);
        }
    };

    if (branchLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const isCreating = resolvedParams?.id === 'new';

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isCreating ? 'Nueva Sucursal' : branch?.name || 'Detalles de Sucursal'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isCreating 
                            ? 'Completa la información para crear una nueva sucursal' 
                            : 'Gestiona la configuración y empleados de esta sucursal'}
                    </p>
                </div>
                {!isCreating && branch && (
                    <div className="flex items-center gap-2">
                        <Badge variant={branch?.active ? "default" : "secondary"}>
                            {branch?.active ? "Activa" : "Inactiva"}
                        </Badge>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="general">Información General</TabsTrigger>
                    <TabsTrigger value="hours">Horarios</TabsTrigger>
                    <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                    <TabsTrigger value="employees">Empleados</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* General Information Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Básica</CardTitle>
                                <CardDescription>Datos principales de la sucursal</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ej. Centro" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Dirección</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Calle 123..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="timezone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Zona Horaria</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" disabled={saving}>
                                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Guardar Cambios
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>

                        {/* Branch Manager */}
                        {!isCreating && branch && (
                            <BranchManagerSelector
                                currentManagerId={branch.managerId}
                                currentManager={branch.manager}
                                companyId={companyId}
                                branchId={branch.id}
                                onChange={handleManagerChange}
                            />
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="hours" className="space-y-4">
                    <OperatingHoursPicker
                        value={form.watch("operatingHours")}
                        onChange={handleOperatingHoursChange}
                    />
                    
                    {!isCreating && (
                        <div className="mt-4">
                            <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Horarios
                            </Button>
                        </div>
                    )}

                    {!isCreating && (
                        <div className="mt-4">
                            <HolidaysManager companyId={companyId} />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="onboarding" className="space-y-4">
                    {!isCreating && branch ? (
                        <QRCodeGenerator
                            value={smartLink}
                            title="Onboarding de Empleados"
                            description="Comparte este código QR o link con tus empleados para que se unan a esta sucursal"
                            filename={`onboarding-${branch.name?.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Onboarding no disponible</CardTitle>
                                <CardDescription>
                                    Debes crear la sucursal primero para acceder al onboarding
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="employees" className="space-y-4">
                    {!isCreating ? (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    <div>
                                        <CardTitle>Empleados de la Sucursal</CardTitle>
                                        <CardDescription>
                                            Lista de empleados asignados a esta sucursal
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="hidden sm:inline-flex">
                                        {employees.length} empleado{employees.length !== 1 ? 's' : ''}
                                    </Badge>
                                    <Button variant="outline" size="sm" onClick={() => setActiveTab("onboarding")}>
                                        <QrCode className="mr-2 h-4 w-4" />
                                        Invitar Empleados
                                    </Button>
                                    <Button size="sm" onClick={() => setInviteManagerOpen(true)}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Invitar Gerente
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {employees.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No hay empleados aún</p>
                                        <p className="text-sm mt-1">
                                            Comparte el código QR de onboarding para agregar empleados
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {employees.map((employee) => (
                                            <div
                                                key={employee.id}
                                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback>
                                                            {getInitials(employee.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            {employee.name || "Sin nombre"}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {employee.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline">{employee.role}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Empleados no disponible</CardTitle>
                                <CardDescription>
                                    Debes crear la sucursal primero para ver los empleados
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Invite Manager Dialog */}
            <Dialog open={inviteManagerOpen} onOpenChange={setInviteManagerOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invitar Gerente de Sucursal</DialogTitle>
                        <DialogDescription>
                            Envía una invitación por Email y/o WhatsApp. El usuario se unirá con rol de GERENTE a esta sucursal.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="inviteEmail">Correo Electrónico</Label>
                            <Input
                                id="inviteEmail"
                                type="email"
                                placeholder="gerente@empresa.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invitePhone">Teléfono (WhatsApp)</Label>
                            <Input
                                id="invitePhone"
                                type="tel"
                                placeholder="+52 123 456 7890"
                                value={invitePhone}
                                onChange={(e) => setInvitePhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteManagerOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleInviteManager} disabled={saving || (!inviteEmail && !invitePhone)}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar Invitación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
