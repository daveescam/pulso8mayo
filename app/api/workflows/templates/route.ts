import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workflowTemplates } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const onboarding = searchParams.get('onboarding') === 'true';

        let query = db.select()
            .from(workflowTemplates)
            .where(eq(workflowTemplates.companyId, session.user.companyId))
            .orderBy(workflowTemplates.updatedAt);

        if (onboarding) {
            // For onboarding, filter by category only
            query = db.select()
                .from(workflowTemplates)
                .where(
                    and(
                        eq(workflowTemplates.companyId, session.user.companyId),
                        or(
                            eq(workflowTemplates.category, 'ONBOARDING'),
                            eq(workflowTemplates.category, 'RECURSOS_HUMANOS')
                        )
                    )
                )
                .orderBy(workflowTemplates.updatedAt);
        }

        const templates = await query;

        return NextResponse.json({
            data: templates,
            count: templates.length
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, category, steps } = body;

        if (!name || !category) {
            return NextResponse.json(
                { error: 'Name and category are required' },
                { status: 400 }
            );
        }

        const newTemplate = await db.insert(workflowTemplates).values({
            name,
            description: description || '',
            category: category.toUpperCase(),
            steps: steps || [],
            companyId: session.user.companyId,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        return NextResponse.json({
            data: newTemplate[0],
            message: 'Template created successfully'
        });
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
