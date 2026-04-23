import { NextRequest, NextResponse } from 'next/server';
import { EscalationService } from '@/lib/services/escalation-service';

/**
 * POST /api/incidents/[id]/escalate
 * Manually escalate an incident to a specific level
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { targetLevel, escalatedBy } = body;
        const { id } = await params;

        if (!targetLevel || !escalatedBy) {
            return NextResponse.json(
                { error: 'Missing targetLevel or escalatedBy' },
                { status: 400 }
            );
        }

        await EscalationService.manualEscalate(
            id,
            targetLevel,
            escalatedBy
        );

        return NextResponse.json({
            success: true,
            message: `Incident escalated to level ${targetLevel}`,
        });
    } catch (error) {
        console.error('[API] Error escalating incident:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to escalate incident' },
            { status: 500 }
        );
    }
}
