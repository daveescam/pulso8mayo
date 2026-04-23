import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowAssignmentService } from '@/lib/services/workflow-assignment-service';
import { assignmentFiltersSchema } from '@/lib/validations/workflow-scheduling';
import { apiResponse, apiError } from '@/lib/api/response';

/**
 * GET /api/workflows/assignments
 * List assignments for the current user with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return apiError('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);

        // Get userId from query params or use current user
        const userId = searchParams.get('userId') || session.user.id;

        // Parse filters
        const filters = {
            status: searchParams.get('status') || undefined,
            priority: searchParams.get('priority') || undefined,
            isOverdue: searchParams.has('isOverdue') ? searchParams.get('isOverdue') === 'true' : undefined,
            dueBefore: searchParams.get('dueBefore') || undefined,
            dueAfter: searchParams.get('dueAfter') || undefined,
        };

        // Validate filters
        const validatedFilters = assignmentFiltersSchema.safeParse(filters);
        if (!validatedFilters.success) {
            return apiError('Invalid filters', 400, validatedFilters.error.issues);
        }

        // Convert date strings to Date objects
        const processedFilters = {
            ...validatedFilters.data,
            dueBefore: validatedFilters.data.dueBefore ? new Date(validatedFilters.data.dueBefore) : undefined,
            dueAfter: validatedFilters.data.dueAfter ? new Date(validatedFilters.data.dueAfter) : undefined,
        };

        const assignments = await WorkflowAssignmentService.getUserAssignments(userId, processedFilters);

        return apiResponse(assignments);

    } catch (error) {
        console.error('Error fetching assignments:', error);
        return apiError('Failed to fetch assignments', 500);
    }
}
