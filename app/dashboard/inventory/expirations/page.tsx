import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ExpirationReport } from '@/components/inventory/expiration-report';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default async function ExpirationsPage() {
  const session = await auth.api.getSession();

  if (!session?.user) {
    redirect('/sign-in');
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
            <h1 className="text-3xl font-bold">Reporte de Vencimientos</h1>
            <p className="text-muted-foreground mt-1">
              Monitoreo de productos próximos a vencer (FIFO)
            </p>
          </div>
        </div>
      </div>

      <ExpirationReport />
    </div>
  );
}
