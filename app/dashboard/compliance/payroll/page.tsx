'use client';

import { useEffect, useState } from 'react';
import { PayrollExport } from '@/components/compliance/payroll-export';
import { DollarSign } from 'lucide-react';

export default function PayrollPage() {
  const [companyId, setCompanyId] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setCompanyId(data.user?.companyId || '');
        }
      } catch (e) {
        console.error('Error fetching user:', e);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Exportación de Nómina</h1>
          <p className="text-muted-foreground">
            Genera archivos de exportación para tu sistema de nómina
          </p>
        </div>
      </div>

      {companyId ? (
        <PayrollExport companyId={companyId} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      )}
    </div>
  );
}
