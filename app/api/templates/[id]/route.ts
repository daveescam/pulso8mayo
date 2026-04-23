import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workflowTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireTenant } from '@/lib/tenant-context';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tenant = await requireTenant();
        const { id } = await params;
        const body = await request.json();
        const { name, steps, description } = body;

        // Update the template
        const updated = await db
            .update(workflowTemplates)
            .set({
                name: name || undefined,
                steps: steps || undefined,
                description: description || undefined,
                updatedAt: new Date()
            })
            .where(eq(workflowTemplates.id, id))
            .returning();

        if (!updated.length) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            template: updated[0]
        });
    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        );
    }
}

