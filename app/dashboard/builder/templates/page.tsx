
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { workflowTemplates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { TemplateManager } from './template-manager';

export default async function TemplatesPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        redirect('/sign-in');
    }

    const companyId = (session.user as any).companyId || (session.user as any).additionalFields?.companyId;

const rawTemplates = await db.select({
    id: workflowTemplates.id,
    name: workflowTemplates.name,
    description: workflowTemplates.description,
    category: workflowTemplates.category,
    steps: workflowTemplates.steps,
  })
  .from(workflowTemplates)
  .where(eq(workflowTemplates.companyId, companyId))
  .orderBy(desc(workflowTemplates.createdAt));

  const templates = rawTemplates as unknown as Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    steps?: Array<{ id: string; type: string; title: string; required?: boolean; options?: string[] }>;
    createdAt?: Date;
  }>;

  return <TemplateManager userTemplates={templates} />;
}
