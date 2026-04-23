import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowScheduleService } from '@/lib/services/workflow-schedule-service';
import { updateScheduleSchema } from '@/lib/validations/workflow-scheduling';
import { apiResponse, apiError } from '@/lib/api/response';

/**
 * GET /api/workflows/schedules/[id]
 * Get a specific schedule by ID
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
        const schedule = await WorkflowScheduleService.getScheduleById(id);

        if (!schedule) {
            return apiError('Schedule not found', 404);
        }

        return apiResponse(schedule);

    } catch (error) {
        console.error('Error fetching schedule:', error);
        return apiError('Failed to fetch schedule', 500);
    }
}

/**
 * PATCH /api/workflows/schedules/[id]
 * Update a schedule
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
        const validated = updateScheduleSchema.safeParse(body);
        if (!validated.success) {
            return apiError('Validation failed', 400, validated.error.issues);
        }

        // Convert date strings to Date objects if present
        const data = {
            ...validated.data,
            startDate: validated.data.startDate ? new Date(validated.data.startDate) : undefined,
            endDate: validated.data.endDate ? new Date(validated.data.endDate) : undefined,
        };

        const schedule = await WorkflowScheduleService.updateSchedule(id, data);

        if (!schedule) {
            return apiError('Schedule not found', 404);
        }

        return apiResponse(schedule);

    } catch (error) {
        console.error('Error updating schedule:', error);
        return apiError('Failed to update schedule', 500);
    }
}

/**
 * DELETE /api/workflows/schedules/[id]
 * Delete a schedule
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return apiError('Unauthorized', 401);
        }

        const { id } = await params;
        await WorkflowScheduleService.deleteSchedule(id);

        return apiResponse({ success: true, message: 'Schedule deleted' });

    } catch (error) {
        console.error('Error deleting schedule:', error);
        return apiError('Failed to delete schedule', 500);
    }
}
