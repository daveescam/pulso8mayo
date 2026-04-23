import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LeaveDashboard } from '@/components/labor/leave-dashboard';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function LeavePage() {
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
    <LeaveDashboard
      companyId={user.companyId}
      userId={user.id}
      userRole={user.role}
    />
  );
}
