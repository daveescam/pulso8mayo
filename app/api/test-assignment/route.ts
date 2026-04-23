
import { NextResponse } from "next/server";
import { WorkflowAssignmentService } from "@/lib/services/workflow-assignment-service";
import { db } from "@/lib/db";
import { users, workflowInstances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { branchId, role, type } = body;

        // 1. Create a dummy workflow instance for testing
        const [instance] = await db.insert(workflowInstances).values({
            workflowTemplateId: "test-template-id",
            branchId: branchId,
            status: "PENDING",
            priority: "MEDIUM"
        }).returning();

        // 2. Mock a schedule object associated with this test
        const mockSchedule = {
            id: "test-schedule-id",
            branchId: branchId,
            assignmentType: type || "AUTO", // 'ROLE', 'USER', 'AUTO'
            assignedRole: role, // e.g. 'EMPLEADO'
            priority: "MEDIUM"
        };

        console.log(`[TestAssignment] Testing assignment for instance ${instance.id} with type ${mockSchedule.assignmentType}`);

        // 3. Trigger Auto Assignment
        const result = await WorkflowAssignmentService.autoAssignWorkflow(instance.id, mockSchedule);

        // 4. Fetch the assigned user details
        const assignedUser = await db.query.users.findFirst({
            where: eq(users.id, result.assignedTo)
        });

        return NextResponse.json({
            success: true,
            assignment: result,
            assignedUser: {
                id: assignedUser?.id,
                name: assignedUser?.name,
                role: assignedUser?.role
            },
            methodUsed: mockSchedule.assignmentType
        });

    } catch (error: any) {
        console.error("[TestAssignment] Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
