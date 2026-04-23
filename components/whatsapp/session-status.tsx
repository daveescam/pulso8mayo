'use client';

/**
 * Session Status Component
 * 
 * Real-time WhatsApp session status indicator
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Phone, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SessionInfo {
    id: string;
    sessionId: string;
    phoneNumber: string | null;
    status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED';
    connectedAt: Date | null;
    lastActivityAt: Date | null;
}

export function SessionStatus() {
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const fetchSession = async () => {
        try {
            const response = await fetch('/api/whatsapp/session');
            if (!response.ok) return;

            const data = await response.json();
            setSession(data.session);
        } catch (err) {
            console.error('Fetch session error:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteSession = async () => {
        setDeleting(true);
        try {
            const response = await fetch('/api/whatsapp/session', {
                method: 'DELETE',
            });

            if (response.ok) {
                setSession(null);
            }
        } catch (err) {
            console.error('Delete session error:', err);
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        fetchSession();

        // Poll every 10 seconds
        const interval = setInterval(fetchSession, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!session) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Estado de WhatsApp</CardTitle>
                    <CardDescription>No hay sesión activa</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span>WhatsApp no conectado</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadge = () => {
        switch (session.status) {
            case 'CONNECTED':
                return (
                    <Badge className="bg-green-500">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Conectado
                    </Badge>
                );
            case 'CONNECTING':
                return (
                    <Badge variant="secondary">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Conectando
                    </Badge>
                );
            case 'FAILED':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline">
                        <XCircle className="mr-1 h-3 w-3" />
                        Desconectado
                    </Badge>
                );
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('es-MX', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Estado de WhatsApp</CardTitle>
                        <CardDescription>Información de la sesión activa</CardDescription>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Phone Number */}
                {session.phoneNumber && (
                    <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{session.phoneNumber}</span>
                    </div>
                )}

                {/* Connection Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Conectado desde</p>
                        <p className="font-medium">{formatDate(session.connectedAt)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Última actividad</p>
                        <p className="font-medium">{formatDate(session.lastActivityAt)}</p>
                    </div>
                </div>

                {/* Disconnect Button */}
                {session.status === 'CONNECTED' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Desconectar WhatsApp
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Desconectar WhatsApp?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esto desconectará WhatsApp de Pulso. Los empleados no podrán usar comandos
                                    y no se enviarán notificaciones por WhatsApp.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={deleteSession}
                                    disabled={deleting}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Desconectar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardContent>
        </Card>
    );
}
