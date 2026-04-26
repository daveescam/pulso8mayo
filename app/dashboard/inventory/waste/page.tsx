import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { WasteClient } from './waste-client';

export const metadata = {
  title: 'Registro de Mermas | Pulso',
};

interface Props {
  searchParams: Promise<{ item?: string }>;
}

export default async function WastePage({ searchParams }: Props) {
  const session = await getSession();
  const params = await searchParams;
  const preselectedItemId = params.item;

  if (!session?.user) {
    redirect('/login');
  }

  const branchId = session.user.branchId;

  if (!branchId) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inventario
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Selecciona una Sucursal</h2>
            <p className="text-muted-foreground">
              Necesitas estar en el contexto de una sucursal para registrar mermas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inventario
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Registro de Mermas</h1>
            <p className="text-muted-foreground mt-1">
              Registra productos vencidos, dañados o con problemas de calidad
            </p>
          </div>
        </div>
      </div>

      <WasteClient branchId={branchId} preselectedItemId={preselectedItemId} />
    </div>
  );
}
