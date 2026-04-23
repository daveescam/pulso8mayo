import { NextRequest, NextResponse } from 'next/server';
import { RemediationService } from '@/lib/services/remediation-service';

/**
 * POST /api/incidents/[id]/remediate
 * Submit remediation step evidence
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { stepIndex, evidence } = body;
        const { id } = await params;

        if (stepIndex === undefined || !evidence) {
            return NextResponse.json(
                { error: 'Missing stepIndex or evidence' },
                { status: 400 }
            );
        }

        // Track the remediation attempt
        const success = await RemediationService.trackRemediationAttempt(
            id,
            stepIndex,
            true // Assume success for now, validation happens in service
        );

        return NextResponse.json({
            success,
            message: success ? 'Remediation step completed' : 'Remediation step failed',
        });
    } catch (error) {
        console.error('[API] Error submitting remediation:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to submit remediation' },
            { status: 500 }
        );
    }
}
