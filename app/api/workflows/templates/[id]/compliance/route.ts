import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { workflowTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';

/**
 * PATCH /api/workflows/templates/[id]/compliance
 * Update compliance metadata for a workflow template
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Validate input
        const { complianceType, regulationSection, requiredFrequency, isCritical } = body;

        // Validate complianceType
        const validTypes = ['NOM-251', 'NOM-035', 'LABOR_LAW', null, ''];
        if (complianceType !== undefined && !validTypes.includes(complianceType)) {
            return NextResponse.json(
                { error: 'Invalid complianceType. Must be NOM-251, NOM-035, LABOR_LAW, or null' },
                { status: 400 }
            );
        }

        // Validate requiredFrequency
        const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL', null, ''];
        if (requiredFrequency !== undefined && !validFrequencies.includes(requiredFrequency)) {
            return NextResponse.json(
                { error: 'Invalid requiredFrequency' },
                { status: 400 }
            );
        }

        // Verify the template belongs to user's company
        const template = await db.query.workflowTemplates.findFirst({
            where: and(
                eq(workflowTemplates.id, id),
                eq(workflowTemplates.companyId, session.user.companyId)
            )
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Build update object with only provided fields
        const updateData: Record<string, any> = { updatedAt: new Date() };

        if (complianceType !== undefined) {
            updateData.complianceType = complianceType || null;
        }
        if (regulationSection !== undefined) {
            updateData.regulationSection = regulationSection || null;
        }
        if (requiredFrequency !== undefined) {
            updateData.requiredFrequency = requiredFrequency || null;
        }
        if (isCritical !== undefined) {
            updateData.isCritical = Boolean(isCritical);
        }

        // Update the template
        const [updated] = await db
            .update(workflowTemplates)
            .set(updateData)
            .where(eq(workflowTemplates.id, id))
            .returning();

        return NextResponse.json({
            success: true,
            template: {
                id: updated.id,
                name: updated.name,
                complianceType: updated.complianceType,
                regulationSection: updated.regulationSection,
                requiredFrequency: updated.requiredFrequency,
                isCritical: updated.isCritical,
            }
        });

    } catch (error) {
        console.error('[Compliance Tagging API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/workflows/templates/[id]/compliance
 * Get compliance metadata for a workflow template
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const template = await db.query.workflowTemplates.findFirst({
            where: and(
                eq(workflowTemplates.id, id),
                eq(workflowTemplates.companyId, session.user.companyId)
            ),
            columns: {
                id: true,
                name: true,
                complianceType: true,
                regulationSection: true,
                requiredFrequency: true,
                isCritical: true,
            }
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error('[Compliance Tagging API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
