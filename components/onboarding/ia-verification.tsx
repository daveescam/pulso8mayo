'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import Image from "next/image";

interface VerificationResult {
    passed: boolean;
    confidence: number;
    issues: string[];
    verifiedItems: string[];
}

interface IAVerificationProps {
    imageUrl?: string;
    type: 'uniform' | 'document';
    documentType?: string;
    onVerified?: (result: VerificationResult) => void;
    onError?: (error: string) => void;
}

export function IAVerification({ 
    imageUrl, 
    type, 
    documentType, 
    onVerified, 
    onError 
}: IAVerificationProps) {
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const uniformRequirements = [
        "wearing_apron",
        "wearing_uniform_shirt", 
        "wearing_cap_or_hairnet",
        "proper_footwear"
    ];

    const documentRequirements = {
        "contrato": ["signature_present", "all_pages_visible", "text_legible"],
        "identificacion": ["photo_visible", "document_legible", "expiration_date_visible"],
        "comprobante_domicilio": ["address_visible", "document_legible", "name_matches"]
    };

    const runVerification = async () => {
        if (!imageUrl) {
            onError?.("No se ha proporcionado una imagen");
            return;
        }

        setVerifying(true);
        setError(null);
        setResult(null);

        try {
            // Simulación de verificación por IA
            // En una implementación real, esto llamaría a un servicio de IA
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockResult: VerificationResult = {
                passed: Math.random() > 0.3, // 70% de éxito en simulación
                confidence: 0.75 + Math.random() * 0.25, // 75-100%
                issues: [],
                verifiedItems: []
            };

            // Generar issues aleatorios para demostración
            if (!mockResult.passed) {
                const possibleIssues = [
                    "Uniforme incompleto",
                    "Calzado no visible",
                    "Documento borroso",
                    "Firma no detectada",
                    "Páginas faltantes"
                ];
                mockResult.issues = [
                    possibleIssues[Math.floor(Math.random() * possibleIssues.length)]
                ];
            }

            // Generar items verificados
            const requirements = type === 'uniform' 
                ? uniformRequirements 
                : documentRequirements[documentType as keyof typeof documentRequirements] || [];
            
            mockResult.verifiedItems = requirements.slice(0, Math.floor(Math.random() * requirements.length) + 1);

            setResult(mockResult);
            onVerified?.(mockResult);

        } catch (err) {
            const errorMessage = "Error en la verificación por IA";
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setVerifying(false);
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case 'uniform': return 'Uniforme';
            case 'document': return documentType || 'Documento';
            default: return 'Verificación';
        }
    };

    const getTypeDescription = () => {
        switch (type) {
            case 'uniform': return 'Verifica que el empleado esté usando el uniforme completo correctamente';
            case 'document': return `Verifica que el ${documentType} esté completo y legible`;
            default: return 'Verificación automática por IA';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Verificación por IA - {getTypeLabel()}
                </CardTitle>
                <CardDescription>{getTypeDescription()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Área de imagen */}
                <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {imageUrl ? (
                            <div className="relative">
                                <Image 
                                    src={imageUrl} 
                                    alt="Verificación" 
                                    width={300} 
                                    height={200}
                                    className="mx-auto rounded-lg object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        ) : (
                            <div className="py-8">
                                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">Sube una foto para comenzar la verificación</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botón de verificación */}
                <Button 
                    onClick={runVerification} 
                    disabled={!imageUrl || verifying}
                    className="w-full"
                >
                    {verifying ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                        </>
                    ) : (
                        <>
                            <Camera className="mr-2 h-4 w-4" />
                            Iniciar Verificación por IA
                        </>
                    )}
                </Button>

                {/* Resultado de verificación */}
                {result && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {result.passed ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span className="font-medium">
                                    {result.passed ? "Verificación exitosa" : "Verificación fallida"}
                                </span>
                            </div>
                            <Badge variant={result.passed ? "default" : "destructive"}>
                                Confianza: {Math.round(result.confidence * 100)}%
                            </Badge>
                        </div>

                        <Progress value={result.confidence * 100} className="h-2" />

                        {result.issues.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-800">Problemas detectados:</span>
                                </div>
                                <ul className="text-sm text-red-700 space-y-1">
                                    {result.issues.map((issue, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-red-600">•</span>
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.verifiedItems.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">Elementos verificados:</span>
                                </div>
                                <ul className="text-sm text-green-700 space-y-1">
                                    {result.verifiedItems.map((item, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            {item.replace(/_/g, ' ')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-800">{error}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}