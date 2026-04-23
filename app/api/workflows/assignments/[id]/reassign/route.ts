import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowAssignmentService } from '@/lib/services/workflow-assignment-service';
import { reassignWorkflowSchema } from '@/lib/validations/workflow-scheduling';
import { apiResponse, apiError } from '@/lib/api/response';

/**
 * POST /api/workflows/assignments/[id]/reassign
 * Reassign workflow to a different user
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return apiError('Unauthorized', 401);
        }

        const body = await request.json();
        const { id } = await params;

        // Validate input
        const validated = reassignWorkflowSchema.safeParse(body);
        if (!validated.success) {
            return apiError('Validation failed', 400, validated.error.issues);
        }

        const assignment = await WorkflowAssignmentService.reassignWorkflow(
            id,
            validated.data.newUserId,
            session.user.id
        );

        if (!assignment) {
            return apiError('Assignment not found', 404);
        }

        return apiResponse(assignment);

    } catch (error) {
        console.error('Error reassigning workflow:', error);
        return apiError('Failed to reassign workflow', 500);
    }
}
