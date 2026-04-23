import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowScheduleService } from '@/lib/services/workflow-schedule-service';
import { apiResponse, apiError } from '@/lib/api/response';

/**
 * POST /api/workflows/schedules/[id]/toggle
 * Toggle schedule active status
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
        const { isActive } = body;
        const { id } = await params;

        if (typeof isActive !== 'boolean') {
            return apiError('isActive must be a boolean', 400);
        }

        const schedule = await WorkflowScheduleService.toggleSchedule(id, isActive);

        if (!schedule) {
            return apiError('Schedule not found', 404);
        }

        return apiResponse(schedule);

    } catch (error) {
        console.error('Error toggling schedule:', error);
        return apiError('Failed to toggle schedule', 500);
    }
}
