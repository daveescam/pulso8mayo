import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incidents } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { IncidentEngine } from '@/lib/services/incident-engine';

/**
 * GET /api/incidents
 * List incidents with filtering
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const branchId = searchParams.get('branchId');
        const status = searchParams.get('status');
        const severity = searchParams.get('severity');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query conditions
        const conditions = [];

        if (branchId) {
            conditions.push(eq(incidents.branchId, branchId));
        }

        if (status) {
            conditions.push(eq(incidents.status, status as any));
        }

        if (severity) {
            conditions.push(eq(incidents.severity, severity as any));
        }

        // Query incidents
        const query = db
            .select()
            .from(incidents)
            .orderBy(desc(incidents.createdAt))
            .limit(limit)
            .offset(offset);

        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        const results = await query;

        return NextResponse.json({
            incidents: results,
            total: results.length,
            limit,
            offset,
        });
    } catch (error) {
        console.error('[API] Error fetching incidents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch incidents' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/incidents
 * Create incident manually (for testing or manual reporting)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            workflowInstanceId: instanceId, // Map from body param to schema column
            stepId,
            branchId,
            severity,
            title,
            description,
            detectedBy,
        } = body;

        // Validate required fields
        if (!instanceId || !branchId || !severity || !title) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create incident
        const [incident] = await db
            .insert(incidents)
            .values({
                instanceId,
                stepId,
                branchId,
                severity,
                status: 'DETECTED',
                title,
                description,
                detectedBy,
            })
            .returning();

        return NextResponse.json({ incident }, { status: 201 });
    } catch (error) {
        console.error('[API] Error creating incident:', error);
        return NextResponse.json(
            { error: 'Failed to create incident' },
            { status: 500 }
        );
    }
}
