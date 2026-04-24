
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workflowTemplates } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const [template] = await db.select()
            .from(workflowTemplates)
            .where(eq(workflowTemplates.id, id));

        if (!template) {
            return new NextResponse("Template not found", { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error("[WORKFLOW_TEMPLATE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, description, category, steps, active } = body;

        const [updatedTemplate] = await db.update(workflowTemplates)
            .set({
                ...(name && { name }),
                ...(description && { description }),
                ...(category && { category }),
                ...(steps && { steps }),
                ...(active !== undefined && { active }),
                updatedAt: new Date(),
            })
            .where(eq(workflowTemplates.id, id))
            .returning();

        return NextResponse.json(updatedTemplate);
    } catch (error) {
        console.error("[WORKFLOW_TEMPLATE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await db.delete(workflowTemplates)
            .where(eq(workflowTemplates.id, id));

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("[WORKFLOW_TEMPLATE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
