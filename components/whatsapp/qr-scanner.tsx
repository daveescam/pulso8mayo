'use client';

/**
 * QR Scanner Component
 * 
 * Displays QR code for WhatsApp connection and handles auto-refresh
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import Image from 'next/image';

interface QRScannerProps {
    companyId: string;
    onConnected?: () => void;
}

export function QRScanner({ companyId, onConnected }: QRScannerProps) {
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Create session and get QR code
    const createSession = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/whatsapp/session', {
                method: 'POST',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create session');
            }

            const data = await response.json();
            setSessionId(data.session.sessionId);
            setQrCode(data.session.qrCode);
            setStatus(data.session.status);

            // Start polling for status
            startStatusPolling(data.session.sessionId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setStatus('failed');
        } finally {
            setLoading(false);
        }
    };

    // Poll session status every 3 seconds
    const startStatusPolling = (sessionId: string) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/whatsapp/session');
                if (!response.ok) return;

                const data = await response.json();
                if (data.session) {
                    setStatus(data.session.status);
                    setQrCode(data.session.qrCode);

                    if (data.session.status === 'CONNECTED') {
                        clearInterval(interval);
                        onConnected?.();
                    } else if (data.session.status === 'FAILED') {
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error('Status polling error:', err);
            }
        }, 3000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    };

    // Check existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch('/api/whatsapp/session');
                if (!response.ok) return;

                const data = await response.json();
                if (data.session) {
                    setSessionId(data.session.sessionId);
                    setStatus(data.session.status);
                    setQrCode(data.session.qrCode);

                    if (data.session.status === 'CONNECTING') {
                        startStatusPolling(data.session.sessionId);
                    }
                }
            } catch (err) {
                console.error('Check session error:', err);
            }
        };

        checkSession();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Conectar WhatsApp</CardTitle>
                <CardDescription>
                    Escanea el código QR con WhatsApp para conectar tu cuenta
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status Indicator */}
                {status === 'connected' && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            WhatsApp conectado exitosamente
                        </AlertDescription>
                    </Alert>
                )}

                {status === 'failed' && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error || 'Error al conectar WhatsApp'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* QR Code Display */}
                {status === 'connecting' && qrCode && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative w-64 h-64 bg-white p-4 rounded-lg border-2 border-gray-200">
                            <Image
                                src={qrCode}
                                alt="WhatsApp QR Code"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Esperando escaneo...</span>
                        </div>
                        <p className="text-sm text-center text-muted-foreground max-w-md">
                            1. Abre WhatsApp en tu teléfono<br />
                            2. Ve a Configuración → Dispositivos vinculados<br />
                            3. Toca "Vincular un dispositivo"<br />
                            4. Escanea este código QR
                        </p>
                    </div>
                )}

                {/* Connect Button */}
                {status === 'disconnected' && (
                    <div className="flex flex-col items-center space-y-4">
                        <Button
                            onClick={createSession}
                            disabled={loading}
                            size="lg"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generar Código QR
                        </Button>
                    </div>
                )}

                {/* Refresh Button */}
                {status === 'connecting' && (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={createSession}
                            disabled={loading}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refrescar QR
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
