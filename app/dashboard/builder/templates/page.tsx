
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

    const templates = await db.select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.companyId, companyId))
        .orderBy(desc(workflowTemplates.createdAt));

    return <TemplateManager userTemplates={templates} />;
}
