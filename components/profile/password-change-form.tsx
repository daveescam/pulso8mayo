"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Key, Loader2 } from "lucide-react";

export function PasswordChangeForm() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            toast.error("Todos los campos son requeridos");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            if (response.ok) {
                toast.success("Contraseña actualizada exitosamente");
                setFormData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
            } else {
                const error = await response.json();
                toast.error(error.error || "Error al cambiar contraseña");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error("Error al cambiar contraseña");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                    Actualiza tu contraseña de acceso
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-muted-foreground">
                            Mínimo 8 caracteres
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="••••••••"
                        />
                    </div>

                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <Key className="h-4 w-4 mr-2" />
                                Actualizar Contraseña
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
