import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LFTViolationsTable } from '@/components/reports/lft-violations-table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function LFTViolationsPage() {
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
                        <h1 className="text-3xl font-bold">Reporte de Violaciones LFT</h1>
                        <p className="text-muted-foreground mt-1">
                            Detección y seguimiento de violaciones a la Ley Federal del Trabajo
                        </p>
                    </div>
                </div>
            </div>

            <LFTViolationsTable />
        </div>
    );
}
