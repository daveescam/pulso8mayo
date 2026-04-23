import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowAssignmentService } from '@/lib/services/workflow-assignment-service';
import { updateAssignmentStatusSchema } from '@/lib/validations/workflow-scheduling';
import { apiResponse, apiError } from '@/lib/api/response';

/**
 * PATCH /api/workflows/assignments/[id]/status
 * Update assignment status
 */
export async function PATCH(
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
        const validated = updateAssignmentStatusSchema.safeParse(body);
        if (!validated.success) {
            return apiError('Validation failed', 400, validated.error.issues);
        }

        const assignment = await WorkflowAssignmentService.updateAssignmentStatus(
            id,
            validated.data.status
        );

        if (!assignment) {
            return apiError('Assignment not found', 404);
        }

        return apiResponse(assignment);

    } catch (error) {
        console.error('Error updating assignment status:', error);
        return apiError('Failed to update assignment status', 500);
    }
}
