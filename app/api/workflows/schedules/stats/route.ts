import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowScheduleService } from '@/lib/services/workflow-schedule-service';
import { apiResponse, apiError } from '@/lib/api/response';

/**
 * GET /api/workflows/schedules/stats
 * Get schedule statistics for a branch
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return apiError('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');

        if (!branchId) {
            return apiError('branchId is required', 400);
        }

        const stats = await WorkflowScheduleService.getScheduleStats(branchId);

        return apiResponse(stats);

    } catch (error) {
        console.error('Error fetching schedule stats:', error);
        return apiError('Failed to fetch schedule stats', 500);
    }
}
