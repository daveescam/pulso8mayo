"use client";

import { useBuilder } from "./builder-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Play, Settings, Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';

export function BuilderHeader() {
    const { elements, templateMeta, updateTemplateMeta } = useBuilder();
    const [saving, setSaving] = useState(false);
    const [openSaveDialog, setOpenSaveDialog] = useState(false);

    // Sync local state if needed, but here we can use context directly in the dialog inputs

    const handleSave = async () => {
        if (!templateMeta.name.trim()) {
            toast.error("Por favor ingresa un nombre para la plantilla");
            return;
        }

        setSaving(true);
        try {
            const url = templateMeta.id
                ? `/api/workflows/templates/${templateMeta.id}`
                : "/api/workflows/templates";

            const method = templateMeta.id ? "PATCH" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: templateMeta.name,
                    description: templateMeta.description,
                    category: templateMeta.category,
                    steps: elements, // Save form elements as "steps" in DB JSON
                })
            });

            if (!res.ok) throw new Error("Failed to save");

            const savedTemplate = await res.json();

            // If new, update context with ID so subsequent saves are PATCH
            if (!templateMeta.id && savedTemplate.id) {
                updateTemplateMeta({ id: savedTemplate.id });
                // Optionally update URL without reload (using pushState or router.replace)
                window.history.replaceState(null, '', `/dashboard/builder?id=${savedTemplate.id}`);
            }

            toast.success("Plantilla guardada correctamente");
            setOpenSaveDialog(false);
        } catch (error) {
            toast.error("Error al guardar la plantilla");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
                <Link href="/dashboard/builder/templates">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="font-semibold">{templateMeta.name || "Nueva Plantilla"}</h2>
                    <p className="text-xs text-muted-foreground">{elements.length} elementos</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                </Button>
                <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Probar
                </Button>

                <Dialog open={openSaveDialog} onOpenChange={setOpenSaveDialog}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Plantilla
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Guardar Plantilla</DialogTitle>
                            <DialogDescription>
                                {templateMeta.id ? "Actualizar detalles de la plantilla." : "Ingresa los detalles para guardar esta nueva plantilla."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={templateMeta.name}
                                    onChange={(e) => updateTemplateMeta({ name: e.target.value })}
                                    placeholder="Ej. Check de Limpieza Diaria"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    value={templateMeta.description || ''}
                                    onChange={(e) => updateTemplateMeta({ description: e.target.value })}
                                    placeholder="Descripción breve del propósito de este flujo..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenSaveDialog(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
