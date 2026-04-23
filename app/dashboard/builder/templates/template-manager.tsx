'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { templateLibrary } from '@/templates';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Calendar, Copy, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface TemplateManagerProps {
    userTemplates: Array<{
        id: string;
        name: string;
        description?: string;
        category: string;
        steps?: Array<{
            id: string;
            type: string;
            title: string;
            required?: boolean;
            options?: string[];
        }>;
    }>;
}

export function TemplateManager({ userTemplates }: TemplateManagerProps) {
    const router = useRouter();
    const [creating, setCreating] = useState(false);
    const [cloning, setCloning] = useState<string | null>(null);

    const handleCreateNew = async () => {
        setCreating(true);
        try {
            const payload = {
                name: "Nueva Plantilla",
                description: "Descripción de la nueva plantilla",
                category: "GENERAL",
                steps: []
            };

            const res = await fetch('/api/workflows/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create template");

            const newTemplate = await res.json();
            if (newTemplate && newTemplate.id) {
                toast.success("Plantilla creada");
                router.push(`/dashboard/builder/editor/${newTemplate.id}`);
            } else {
                throw new Error("ID de plantilla no recibido");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al crear la plantilla");
        } finally {
            setCreating(false);
        }
    };

    const handleClone = async (templateId: string, templateData: { title?: string; name?: string; description?: string; category?: string; steps?: unknown[] }) => {
        setCloning(templateId);
        try {
            const payload = {
                name: `${templateData.title || templateData.name} (Copia)`,
                description: templateData.description,
                category: templateData.category || "GENERAL",
                steps: templateData.steps || []
            };

            const res = await fetch('/api/workflows/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to clone template");

            const newTemplate = await res.json();
            if (newTemplate && newTemplate.id) {
                toast.success("Plantilla clonada correctamente");
                router.push(`/dashboard/builder/editor/${newTemplate.id}`);
            } else {
                throw new Error("ID de plantilla clonada no recibido");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al clonar la plantilla");
        } finally {
            setCloning(null);
        }
    };

    const systemTemplates = Object.entries(templateLibrary).map(([key, tpl]) => ({
        id: key,
        ...tpl
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Mis Plantillas</h1>
                        <p className="text-muted-foreground">
                            Gestiona tus plantillas de flujos de trabajo personalizadas.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const onboardingTemplate = {
                                    name: "Onboarding de Empleado",
                                    description: "Plantilla para el proceso de incorporación de nuevos empleados",
                                    category: "RECURSOS_HUMANOS",
                                    steps: [
                                        {
                                            id: "datos_empleado",
                                            type: "text",
                                            title: "Nombre Completo del Empleado",
                                            required: true
                                        },
                                        {
                                            id: "puesto",
                                            type: "multiple_choice",
                                            title: "Puesto Asignado",
                                            required: true,
                                            options: ["Mesero", "Cocinero", "Lavaloza", "Hostess", "Cajero", "Ayudante General", "Gerente"]
                                        },
                                        {
                                            id: "documentacion",
                                            type: "checklist",
                                            title: "Entrega de Documentación",
                                            required: true,
                                            options: ["Contrato Individual de Trabajo firmado", "Copia de Identificación Oficial", "Comprobante de Domicilio", "Alta en IMSS", "Carta de Confidencialidad"]
                                        }
                                    ]
                                };
                                handleCreateWithTemplate(onboardingTemplate);
                            }}
                            disabled={creating}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Onboarding Rápido
                        </Button>
                        <Button onClick={handleCreateNew} disabled={creating}>
                            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Nueva Plantilla
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="my-templates" className="w-full">
                <TabsList>
                    <TabsTrigger value="my-templates">Mis Plantillas</TabsTrigger>
                    <TabsTrigger value="system-templates">Catálogo Pulso</TabsTrigger>
                </TabsList>

                <TabsContent value="my-templates" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {userTemplates.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-card">
                                <p className="text-lg font-medium mb-2">No tienes plantillas aún</p>
                                <p className="text-sm mb-4">Crea una nueva o explora el catálogo.</p>
                                <Link href="/dashboard/builder">
                                    <Button variant="outline">Crear desde cero</Button>
                                </Link>
                            </div>
                        ) : (
                            userTemplates.map((template) => (
                                <Card key={template.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-start">
                                            <span className="truncate" title={template.name}>{template.name}</span>
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 min-h-[40px]">
                                            {template.description || "Sin descripción"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <span className="bg-secondary px-2 py-1 rounded-md">{template.category}</span>
                                            <span className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {template.createdAt ? format(new Date(template.createdAt), "d MMM yyyy", { locale: es }) : '-'}
                                            </span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t pt-4 flex gap-2">
                                        <Link href={`/dashboard/builder/editor/${template.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full">
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="system-templates" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {systemTemplates.map((template) => (
                            <Card key={template.id} className="flex flex-col border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-start gap-2">
                                        <span className="truncate block w-full" title={template.title}>{template.title}</span>
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {template.description || "Plantilla oficial de Pulso."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="text-xs text-muted-foreground flex gap-2">
                                        <span className="bg-primary/20 text-primary px-2 py-1 rounded-md font-medium">{template.category}</span>
                                        <span className="bg-background/80 px-2 py-1 rounded-md border">{template.steps?.length || 0} pasos</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-4">
                                    <Button
                                        className="w-full"
                                        onClick={() => handleClone(template.id, template)}
                                        disabled={cloning === template.id}
                                    >
                                        {cloning === template.id ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Copy className="w-4 h-4 mr-2" />
                                        )}
                                        Usar Plantilla
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
