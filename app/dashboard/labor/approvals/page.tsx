import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ApprovalManager } from "@/components/labor/approval-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default async function LaborApprovalsPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!user || !user.companyId) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aprobaciones de Turnos y Overtime</h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de aprobación de horas extras, cambios de turno y permisos
        </p>
      </div>

      <ApprovalManager companyId={user.companyId} userRole={user.role} />

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Aprobación</CardTitle>
          <CardDescription>
            Las solicitudes que puedes gestionar
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium">Overtime</p>
              <p className="text-sm text-muted-foreground">
                Horas extras detectadas automáticamente
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Cambio de Turno</p>
              <p className="text-sm text-muted-foreground">
                Modificaciones de horario
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Permisos</p>
              <p className="text-sm text-muted-foreground">
                Time off y días libres
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Intercambios</p>
              <p className="text-sm text-muted-foreground">
                Swap entre empleados
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium">Salida Temprana</p>
              <p className="text-sm text-muted-foreground">
                Aprobaciones de salida anticipada
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
