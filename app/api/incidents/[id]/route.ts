import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incidents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { IncidentEngine } from '@/lib/services/incident-engine';
import { EscalationService } from '@/lib/services/escalation-service';

/**
 * GET /api/incidents/[id]
 * Get incident details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const [incident] = await db
            .select()
            .from(incidents)
            .where(eq(incidents.id, id))
            .limit(1);

        if (!incident) {
            return NextResponse.json(
                { error: 'Incident not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ incident });
    } catch (error) {
        console.error('[API] Error fetching incident:', error);
        return NextResponse.json(
            { error: 'Failed to fetch incident' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/incidents/[id]/resolve
 * Resolve an incident
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { resolution, resolvedBy } = body;
        const { id } = await params;

        if (!resolution || !resolvedBy) {
            return NextResponse.json(
                { error: 'Missing resolution or resolvedBy' },
                { status: 400 }
            );
        }

        const incident = await IncidentEngine.resolveIncident(
            id,
            resolution,
            resolvedBy
        );

        if (!incident) {
            return NextResponse.json(
                { error: 'Incident not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ incident });
    } catch (error) {
        console.error('[API] Error resolving incident:', error);
        return NextResponse.json(
            { error: 'Failed to resolve incident' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/incidents/[id]
 * Delete an incident (soft delete)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db
            .delete(incidents)
            .where(eq(incidents.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error deleting incident:', error);
        return NextResponse.json(
            { error: 'Failed to delete incident' },
            { status: 500 }
        );
    }
}
