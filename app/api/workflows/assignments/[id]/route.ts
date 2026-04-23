import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowAssignmentService } from '@/lib/services/workflow-assignment-service';
import { apiResponse, apiError } from '@/lib/api/response';

/**
 * GET /api/workflows/assignments/[id]
 * Get a specific assignment by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return apiError('Unauthorized', 401);
        }

        const { id } = await params;
        const assignment = await WorkflowAssignmentService.getAssignmentById(id);

        if (!assignment) {
            return apiError('Assignment not found', 404);
        }

        return apiResponse(assignment);

    } catch (error) {
        console.error('Error fetching assignment:', error);
        return apiError('Failed to fetch assignment', 500);
    }
}
