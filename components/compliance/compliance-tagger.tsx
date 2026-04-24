"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Save, Loader2, AlertTriangle, CheckCircle2, Tag } from "lucide-react";

interface ComplianceMetadata {
    complianceType: string | null;
    regulationSection: string | null;
    requiredFrequency: string | null;
    isCritical: boolean;
}

interface ComplianceTaggerProps {
    templateId: string;
    templateName?: string;
    initialData?: Partial<ComplianceMetadata>;
    onSaved?: (data: ComplianceMetadata) => void;
    compact?: boolean;
}

const COMPLIANCE_TYPES = [
    { value: "NOM-251", label: "NOM-251 (Higiene y Salud)", color: "bg-blue-100 text-blue-800" },
    { value: "NOM-035", label: "NOM-035 (Riesgos Psicosociales)", color: "bg-purple-100 text-purple-800" },
    { value: "LABOR_LAW", label: "Ley Federal del Trabajo", color: "bg-green-100 text-green-800" },
];

const FREQUENCIES = [
    { value: "DAILY", label: "Diario" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "MONTHLY", label: "Mensual" },
    { value: "ANNUAL", label: "Anual" },
];

const REGULATION_SECTIONS: Record<string, { value: string; label: string }[]> = {
    "NOM-251": [
        { value: "5.1", label: "5.1 - Instalaciones y áreas" },
        { value: "5.2", label: "5.2 - Equipos y utensilios" },
        { value: "5.3", label: "5.3 - Servicios" },
        { value: "5.4", label: "5.4 - Almacenamiento" },
        { value: "5.5", label: "5.5 - Control de operaciones" },
        { value: "5.6", label: "5.6 - Control de materias primas" },
        { value: "5.7", label: "5.7 - Limpieza y desinfección" },
        { value: "5.8", label: "5.8 - Higiene personal" },
        { value: "5.9", label: "5.9 - Control de plagas" },
        { value: "5.10", label: "5.10 - Transporte" },
    ],
    "NOM-035": [
        { value: "7.1", label: "7.1 - Entorno organizacional" },
        { value: "7.2", label: "7.2 - Cargas de trabajo" },
        { value: "7.3", label: "7.3 - Liderazgo y relaciones" },
        { value: "7.4", label: "7.4 - Violencia laboral" },
        { value: "7.5", label: "7.5 - Factores propios de la actividad" },
        { value: "7.6", label: "7.6 - Tiempo de trabajo" },
        { value: "7.7", label: "7.7 - Interferencia trabajo-familia" },
        { value: "8", label: "8 - Medidas de prevención" },
    ],
    "LABOR_LAW": [
        { value: "art-58", label: "Art. 58 - Jornada de trabajo" },
        { value: "art-69", label: "Art. 69 - Días de descanso" },
        { value: "art-76", label: "Art. 76 - Vacaciones" },
        { value: "art-87", label: "Art. 87 - Aguinaldo" },
        { value: "art-117", label: "Art. 117 - PTU" },
        { value: "art-132", label: "Art. 132 - Obligaciones del patrón" },
        { value: "art-153", label: "Art. 153 - Capacitación" },
    ],
};

export function ComplianceTagger({
    templateId,
    templateName,
    initialData,
    onSaved,
    compact = false,
}: ComplianceTaggerProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<ComplianceMetadata>({
        complianceType: initialData?.complianceType || null,
        regulationSection: initialData?.regulationSection || null,
        requiredFrequency: initialData?.requiredFrequency || null,
        isCritical: initialData?.isCritical || false,
    });

    // Fetch current compliance data if not provided
    useEffect(() => {
        if (!initialData) {
            fetchComplianceData();
        }
    }, [templateId]);

    const fetchComplianceData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/workflows/templates/${templateId}/compliance`);
            if (res.ok) {
                const fetched = await res.json();
                setData({
                    complianceType: fetched.complianceType || null,
                    regulationSection: fetched.regulationSection || null,
                    requiredFrequency: fetched.requiredFrequency || null,
                    isCritical: fetched.isCritical || false,
                });
            }
        } catch (error) {
            console.error("Error fetching compliance data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/workflows/templates/${templateId}/compliance`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const result = await res.json();
                toast.success("Metadata de compliance actualizada");
                onSaved?.(data);
            } else {
                const error = await res.json();
                toast.error(error.error || "Error al guardar");
            }
        } catch (error) {
            toast.error("Error al guardar metadata de compliance");
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        setData({
            complianceType: null,
            regulationSection: null,
            requiredFrequency: null,
            isCritical: false,
        });
    };

    const availableSections = data.complianceType
        ? REGULATION_SECTIONS[data.complianceType] || []
        : [];

    const complianceInfo = COMPLIANCE_TYPES.find(t => t.value === data.complianceType);

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (compact) {
        return (
            <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Compliance Tags</span>
                    </div>
                    {data.complianceType && (
                        <Badge className={complianceInfo?.color}>
                            {data.complianceType}
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Tipo de Compliance</Label>
                        <Select
                            value={data.complianceType || "none"}
                            onValueChange={(val) =>
                                setData(prev => ({
                                    ...prev,
                                    complianceType: val === "none" ? null : val,
                                    regulationSection: null,
                                }))
                            }
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
                                {COMPLIANCE_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs">Frecuencia</Label>
                        <Select
                            value={data.requiredFrequency || "none"}
                            onValueChange={(val) =>
                                setData(prev => ({ ...prev, requiredFrequency: val === "none" ? null : val }))
                            }
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No requerida</SelectItem>
                                {FREQUENCIES.map(f => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={data.isCritical}
                            onCheckedChange={(checked) => setData(prev => ({ ...prev, isCritical: checked }))}
                        />
                        <Label className="text-xs">Crítico para compliance</Label>
                    </div>

                    <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        <span className="ml-1">Guardar</span>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Compliance Metadata</CardTitle>
                    </div>
                    {data.isCritical && (
                        <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Crítico
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    {templateName
                        ? `Configurar etiquetas de compliance para "${templateName}"`
                        : "Configurar etiquetas de compliance para este workflow"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Compliance Type */}
                <div className="space-y-2">
                    <Label>Tipo de Compliance</Label>
                    <Select
                        value={data.complianceType || "none"}
                        onValueChange={(val) =>
                            setData(prev => ({
                                ...prev,
                                complianceType: val === "none" ? null : val,
                                regulationSection: null, // Reset section when type changes
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo de compliance..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin compliance específico</SelectItem>
                            {COMPLIANCE_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                        <span>{type.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {data.complianceType && (
                        <Badge className={complianceInfo?.color + " mt-1"}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {complianceInfo?.label}
                        </Badge>
                    )}
                </div>

                {/* Regulation Section */}
                {data.complianceType && availableSections.length > 0 && (
                    <div className="space-y-2">
                        <Label>Sección de la Norma</Label>
                        <Select
                            value={data.regulationSection || "none"}
                            onValueChange={(val) =>
                                setData(prev => ({ ...prev, regulationSection: val === "none" ? null : val }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar sección..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">General (sin sección específica)</SelectItem>
                                {availableSections.map(section => (
                                    <SelectItem key={section.value} value={section.value}>
                                        {section.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Required Frequency */}
                <div className="space-y-2">
                    <Label>Frecuencia Requerida</Label>
                    <Select
                        value={data.requiredFrequency || "none"}
                        onValueChange={(val) =>
                            setData(prev => ({ ...prev, requiredFrequency: val === "none" ? null : val }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar frecuencia..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No requerida</SelectItem>
                            {FREQUENCIES.map(freq => (
                                <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Con qué frecuencia debe ejecutarse este workflow para mantener compliance
                    </p>
                </div>

                {/* Is Critical */}
                <div className="flex items-center justify-between border rounded-lg p-4">
                    <div className="space-y-0.5">
                        <Label>Crítico para Compliance</Label>
                        <p className="text-xs text-muted-foreground">
                            Marca este workflow como crítico para generar alertas automáticas si no se ejecuta
                        </p>
                    </div>
                    <Switch
                        checked={data.isCritical}
                        onCheckedChange={(checked) => setData(prev => ({ ...prev, isCritical: checked }))}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2">
                    <Button variant="ghost" size="sm" onClick={handleClear}>
                        Limpiar Tags
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Guardar Compliance
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
