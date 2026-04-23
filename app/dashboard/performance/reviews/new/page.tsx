import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ReviewForm } from '@/components/performance/review-form';

export default async function NewReviewPage() {
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
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva Evaluación de Desempeño</h1>
        <p className="text-muted-foreground">
          Crea una nueva evaluación para un empleado
        </p>
      </div>

      <ReviewForm
        companyId={user.companyId}
        userId={user.id}
      />
    </div>
  );
}
