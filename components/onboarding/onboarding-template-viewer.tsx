'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText, List, Camera, Signature } from "lucide-react";

interface TemplateStep {
    id: string;
    type: string;
    title: string;
    description?: string;
    required: boolean;
    options?: string[];
}

interface TemplateViewerProps {
    template?: {
        id: string;
        name: string;
        description: string;
        steps: TemplateStep[];
    };
    selectedTemplateId?: string;
}

export function TemplateViewer({ template, selectedTemplateId }: TemplateViewerProps) {
    if (!template && !selectedTemplateId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Plantilla de Onboarding
                    </CardTitle>
                    <CardDescription>
                        Selecciona una plantilla personalizada para ver los pasos detallados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No se ha seleccionado ninguna plantilla</p>
                        <p className="text-sm">Usando plantilla estándar con 10 pasos</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const displayTemplate = template || {
        name: "Plantilla Estándar",
        description: "Proceso de onboarding estándar para nuevos empleados",
        steps: [
            {
                id: "datos_personales",
                type: "text",
                title: "Datos Personales",
                required: true,
                description: "Recopilación de información básica del empleado"
            },
            {
                id: "documentacion",
                type: "checklist",
                title: "Documentación Requerida",
                required: true,
                description: "Verificación de documentos legales",
                options: ["Contrato de trabajo", "Identificación oficial", "Comprobante de domicilio", "Alta IMSS"]
            },
            {
                id: "uniforme",
                type: "photo",
                title: "Entrega de Uniforme",
                required: true,
                description: "Registro de entrega de equipo de trabajo"
            },
            {
                id: "capacitacion",
                type: "checklist",
                title: "Capacitación Inicial",
                required: true,
                description: "Registro de capacitaciones del día 1",
                options: ["Recorrido de instalaciones", "Presentación con equipo", "Reglamento interno", "Sistema de asistencia"]
            },
            {
                id: "firma",
                type: "signature",
                title: "Firmas Digitales",
                required: true,
                description: "Confirmación de recepción de documentos y equipo"
            }
        ]
    };

    const getStepIcon = (type: string) => {
        switch (type) {
            case 'text': return <FileText className="h-4 w-4" />;
            case 'checklist': return <List className="h-4 w-4" />;
            case 'photo': return <Camera className="h-4 w-4" />;
            case 'signature': return <Signature className="h-4 w-4" />;
            default: return <CheckCircle className="h-4 w-4" />;
        }
    };

    const getStepTypeLabel = (type: string) => {
        switch (type) {
            case 'text': return 'Texto';
            case 'checklist': return 'Lista de verificación';
            case 'photo': return 'Foto';
            case 'signature': return 'Firma';
            case 'multiple_choice': return 'Selección múltiple';
            default: return type;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {displayTemplate.name}
                </CardTitle>
                <CardDescription>{displayTemplate.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {displayTemplate.steps.length} pasos en total
                        </span>
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-muted-foreground">45-60 min estimado</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {displayTemplate.steps.map((step, index) => (
                            <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                                    <span className="text-xs font-medium text-primary">{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="text-sm font-medium leading-tight">
                                            {step.title}
                                            {step.required && (
                                                <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">
                                                    Obligatorio
                                                </Badge>
                                            )}
                                        </h4>
                                        <Badge variant="outline" className="text-xs">
                                            {getStepTypeLabel(step.type)}
                                        </Badge>
                                    </div>
                                    {step.description && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {step.description}
                                        </p>
                                    )}
                                    {step.options && step.options.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground mb-1">Elementos:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {step.options.map((option, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {option}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4" />
                            <span>Al completar todos los pasos, el onboarding se dará por finalizado</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}