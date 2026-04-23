import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowAssignmentService } from '@/lib/services/workflow-assignment-service';
import { apiResponse, apiError } from '@/lib/api/response';

/**
 * GET /api/workflows/assignments/stats
 * Get assignment statistics for current user or specified user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return apiError('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || session.user.id;
        const branchId = searchParams.get('branchId');

        // If branchId is provided, get branch stats
        if (branchId) {
            const stats = await WorkflowAssignmentService.getBranchAssignmentStats(branchId);
            return apiResponse(stats);
        }

        // Otherwise get user stats
        const stats = await WorkflowAssignmentService.getAssignmentStats(userId);

        return apiResponse(stats);

    } catch (error) {
        console.error('Error fetching assignment stats:', error);
        return apiError('Failed to fetch assignment stats', 500);
    }
}
