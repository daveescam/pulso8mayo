import { QRScanner } from '@/components/whatsapp/qr-scanner';
import { SessionStatus } from '@/components/whatsapp/session-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Zap, Bell, Shield } from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function WhatsAppPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');
  const companyId = session.user.companyId;
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
                <h1 className="text-3xl font-bold tracking-tight">Integración WhatsApp</h1>
                <p className="text-muted-foreground mt-2">
                    Conecta WhatsApp para habilitar comandos de voz y notificaciones instantáneas
                </p>
            </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SessionStatus />
                <QRScanner companyId={companyId} />
            </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Funcionalidades</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Comandos de Voz</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Los empleados pueden registrar entrada, salida, pausas y consultar su estado
                                directamente desde WhatsApp.
                            </CardDescription>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex items-start space-x-2">
                                    <span className="font-mono bg-muted px-2 py-1 rounded">entrada</span>
                                    <span className="text-muted-foreground">Registrar entrada</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="font-mono bg-muted px-2 py-1 rounded">salida</span>
                                    <span className="text-muted-foreground">Registrar salida</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="font-mono bg-muted px-2 py-1 rounded">pausa</span>
                                    <span className="text-muted-foreground">Iniciar pausa</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="font-mono bg-muted px-2 py-1 rounded">horas</span>
                                    <span className="text-muted-foreground">Ver resumen del día</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Bell className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Notificaciones Instantáneas</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Recibe notificaciones automáticas sobre tareas asignadas, alertas de inventario
                                e incidentes críticos.
                            </CardDescription>
                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                <li>• Workflows asignados</li>
                                <li>• Recordatorios de vencimiento</li>
                                <li>• Alertas de stock bajo</li>
                                <li>• Productos por caducar</li>
                                <li>• Incidentes críticos</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Zap className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Respuestas Automáticas</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                El sistema responde automáticamente con confirmaciones, resúmenes y ayuda
                                contextual.
                            </CardDescription>
                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                <li>• Confirmación de registro</li>
                                <li>• Resumen de horas trabajadas</li>
                                <li>• Estado de pausas</li>
                                <li>• Lista de tareas pendientes</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Seguro y Privado</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Toda la comunicación está cifrada de extremo a extremo. Solo los empleados
                                registrados pueden usar comandos.
                            </CardDescription>
                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                <li>• Cifrado E2E de WhatsApp</li>
                                <li>• Validación por número de teléfono</li>
                                <li>• Logs de auditoría completos</li>
                                <li>• Sesión única por empresa</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

    <Card>
      <CardHeader>
                    <CardTitle>Instrucciones de Configuración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">1. Conectar WhatsApp</h3>
                        <p className="text-sm text-muted-foreground">
                            Genera un código QR y escanéalo con el WhatsApp de la empresa. Recomendamos usar
                            un número dedicado para el negocio.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">2. Registrar Empleados</h3>
                        <p className="text-sm text-muted-foreground">
                            Asegúrate de que todos los empleados tengan su número de teléfono registrado en
                            el sistema (Configuración → Equipo).
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">3. Probar Comandos</h3>
                        <p className="text-sm text-muted-foreground">
                            Envía "ayuda" al WhatsApp conectado para ver todos los comandos disponibles.
                            Prueba con "entrada" para registrar una entrada de prueba.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">4. Configurar Notificaciones</h3>
                        <p className="text-sm text-muted-foreground">
                            Los empleados pueden configurar sus preferencias de notificación en su perfil
                            (Configuración → Notificaciones).
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
