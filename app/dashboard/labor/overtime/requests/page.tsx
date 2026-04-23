import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OvertimeApprovalList } from '@/components/labor/overtime-approval-list';
import { OvertimeRequestForm } from '@/components/labor/overtime-request-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function OvertimeRequestsPage() {
    const session = await auth.api.getSession();

    if (!session?.user) {
        redirect('/sign-in');
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/labor">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a Labor
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Solicitudes de Horas Extras</h1>
                        <p className="text-muted-foreground mt-1">
                            Gestión y aprobación de horas extras
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Request Form */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Nueva Solicitud</CardTitle>
                                <CardDescription>
                                    Solicita horas extras para aprobación
                                </CardDescription>
                            </div>
                            <Plus className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <OvertimeRequestForm
                            branchId={session.user.branchId || ''}
                            onSuccess={() => window.location.reload()}
                        />
                    </CardContent>
                </Card>

                {/* Pending Requests */}
                <Card>
                    <CardHeader>
                        <CardTitle>Solicitudes Pendientes</CardTitle>
                        <CardDescription>
                            Revisa y aprueba solicitudes de horas extras
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OvertimeApprovalList
                            branchId={session.user.branchId}
                            userRole={session.user.role}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
