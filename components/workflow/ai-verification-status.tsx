"use client";

import * as React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, Upload, Image as ImageIcon, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CameraCapture } from "@/components/shared/camera-capture";
import { usePhotoUpload } from "@/components/shared/use-photo-upload";

export interface AIVerificationStatus {
    verificationId?: string;
    status: 'pending' | 'analyzing' | 'success' | 'failed' | 'escalated';
    confidence?: number;
    reason?: string;
    provider?: string;
    timestamp?: Date;
    requiresManualReview?: boolean;
    escalated?: boolean;
    photoUrl?: string;
    retryCount?: number;
    maxRetries?: number;
}

export interface AIVerificationStatusProps {
    status: AIVerificationStatus;
    onRetry?: () => void;
    onUpload?: (file: File) => void;
    className?: string;
}

export function AIVerificationStatus({
    status,
    onRetry,
    onUpload,
    className
}: AIVerificationStatusProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const { uploadPhotos } = usePhotoUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  const handleCameraConfirm = async (files: File[]) => {
    try {
      const results = await uploadPhotos(files);
      if (results.length > 0 && onUpload) {
        const response = await fetch(results[0].url);
        const blob = await response.blob();
        const file = new File([blob], results[0].name, { type: blob.type });
        onUpload(file);
      }
    } catch {
      // Upload error handled by hook error state
    }
  };

    const getStatusIcon = () => {
        switch (status.status) {
            case 'pending':
                return <Clock className="h-8 w-8 text-muted-foreground" />;
            case 'analyzing':
                return <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle2 className="h-8 w-8 text-green-500" />;
            case 'failed':
                return <XCircle className="h-8 w-8 text-red-500" />;
            case 'escalated':
                return <AlertTriangle className="h-8 w-8 text-orange-500" />;
            default:
                return <Clock className="h-8 w-8 text-muted-foreground" />;
        }
    };

    const getStatusColor = () => {
        switch (status.status) {
            case 'pending':
                return 'border-muted-foreground/25';
            case 'analyzing':
                return 'border-blue-500/50';
            case 'success':
                return 'border-green-500/50';
            case 'failed':
                return 'border-red-500/50';
            case 'escalated':
                return 'border-orange-500/50';
            default:
                return 'border-muted-foreground/25';
        }
    };

    const getStatusBadge = () => {
        const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
            pending: 'secondary',
            analyzing: 'default',
            success: 'default',
            failed: 'destructive',
            escalated: 'destructive'
        };

        const labels: Record<string, string> = {
            pending: 'Pendiente',
            analyzing: 'Analizando...',
            success: 'Aprobado',
            failed: 'Fallido',
            escalated: 'Escalado'
        };

        return (
            <Badge variant={variants[status.status] || 'outline'}>
                {labels[status.status] || status.status}
            </Badge>
        );
    };

    const getProgressValue = () => {
        if (status.status === 'analyzing') {
            return 60; // Simulate progress
        }
        if (status.status === 'success') {
            return 100;
        }
        if (status.status === 'failed' || status.status === 'escalated') {
            return 100;
        }
        return 0;
    };

    return (
        <Card className={cn("border-2 transition-colors", getStatusColor(), className)}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getStatusIcon()}
                        <div>
                            <CardTitle className="text-lg">Verificación AI</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                {getStatusBadge()}
                                {status.provider && (
                                    <span className="text-xs text-muted-foreground">
                                        via {status.provider}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                    {status.confidence !== undefined && status.status !== 'pending' && (
                        <div className="text-right">
                            <div className="text-2xl font-bold">
                                {Math.round(status.confidence * 100)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Confianza</div>
                        </div>
                    )}
                </div>
                {status.status === 'analyzing' && (
                    <Progress value={getProgressValue()} className="h-2" />
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Photo Preview */}
                {status.photoUrl && (
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                        <img
                            src={status.photoUrl}
                            alt="Evidence"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <ImageIcon className="h-8 w-8 text-white/50" />
                        </div>
                    </div>
                )}

        {/* Upload Button (if pending) */}
        {status.status === 'pending' && onUpload && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="text-center text-sm text-muted-foreground">
              Sube una foto para verificación
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex gap-2">
              <Button onClick={() => setCameraOpen(true)} variant="outline" className="gap-2">
                <Camera className="h-4 w-4" />
                Abrir Cámara
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />
                Subir Foto
              </Button>
            </div>
            <CameraCapture open={cameraOpen} onOpenChange={setCameraOpen} onConfirm={handleCameraConfirm} maxPhotos={1} />
          </div>
        )}

                {/* AI Analysis Result */}
                {status.reason && status.status !== 'pending' && (
                    <div className={cn(
                        "rounded-lg p-4 text-sm",
                        status.status === 'success'
                            ? 'bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-100'
                            : status.status === 'failed' || status.status === 'escalated'
                                ? 'bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-100'
                                : 'bg-muted'
                    )}>
                        <div className="font-semibold mb-1">
                            {status.status === 'success' ? '✓ ' : '✗ '}
                            Resultado:
                        </div>
                        {status.reason}
                    </div>
                )}

                {/* Retry Logic */}
                {(status.status === 'failed' || status.status === 'escalated') && onRetry && (
                    <div className="flex items-center justify-between gap-4">
                        {status.retryCount !== undefined && status.maxRetries !== undefined && (
                            <div className="text-sm text-muted-foreground">
                                Intento {status.retryCount}/{status.maxRetries}
                            </div>
                        )}
                        <Button
                            variant="outline"
                            onClick={onRetry}
                            disabled={status.retryCount !== undefined && status.maxRetries !== undefined && status.retryCount >= status.maxRetries}
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reintentar
                        </Button>
                    </div>
                )}

                {/* Escalation Notice */}
                {status.escalated && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                            <div className="text-sm text-orange-900 dark:text-orange-100">
                                <div className="font-semibold mb-1">Requiere Revisión Manual</div>
                                <p>
                                    La verificación falló después de {status.retryCount || 1} intento(s).
                                    Un supervisor ha sido notificado y revisará tu evidencia.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual Review Notice */}
                {status.requiresManualReview && !status.escalated && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="text-sm text-blue-900 dark:text-blue-100">
                                <div className="font-semibold mb-1">Revisión Pendiente</div>
                                <p>
                                    Tu evidencia está siendo revisada por un supervisor.
                                    Recibirás una notificación cuando se complete la revisión.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timestamp */}
                {status.timestamp && (
                    <div className="text-xs text-muted-foreground text-center">
                        {status.timestamp.toLocaleString('es-MX', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * AIVerificationList - Display multiple verification statuses
 */
export interface AIVerificationListItem {
    id: string;
    workflowName: string;
    status: AIVerificationStatus;
}

export interface AIVerificationListProps {
    verifications: AIVerificationListItem[];
    onVerificationClick?: (id: string) => void;
    className?: string;
}

export function AIVerificationList({
    verifications,
    onVerificationClick,
    className
}: AIVerificationListProps) {
    if (verifications.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="py-8 text-center text-muted-foreground">
                    No hay verificaciones pendientes
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("grid gap-4", className)}>
            {verifications.map((verification) => (
                <Card
                    key={verification.id}
                    className={cn(
                        "cursor-pointer transition-colors hover:bg-accent/50",
                        verification.status.status === 'success' && "border-green-500/50",
                        verification.status.status === 'failed' && "border-red-500/50",
                        verification.status.status === 'escalated' && "border-orange-500/50"
                    )}
                    onClick={() => onVerificationClick?.(verification.id)}
                >
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {verification.status.status === 'success' && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                )}
                                {verification.status.status === 'failed' && (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                {verification.status.status === 'escalated' && (
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                )}
                                {verification.status.status === 'analyzing' && (
                                    <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                                )}
                                {verification.status.status === 'pending' && (
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div>
                                    <div className="font-medium">{verification.workflowName}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {verification.status.reason?.substring(0, 50) || 'Sin resultados'}
                                    </div>
                                </div>
                            </div>
                            <Badge variant={
                                verification.status.status === 'success' ? 'default' :
                                verification.status.status === 'failed' ? 'destructive' :
                                verification.status.status === 'escalated' ? 'destructive' :
                                'secondary'
                            }>
                                {verification.status.status === 'success' ? 'Aprobado' :
                                 verification.status.status === 'failed' ? 'Fallido' :
                                 verification.status.status === 'escalated' ? 'Escalado' :
                                 verification.status.status === 'analyzing' ? 'Analizando' :
                                 'Pendiente'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
