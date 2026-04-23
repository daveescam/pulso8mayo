import { NextRequest, NextResponse } from "next/server";
import { ShiftApprovalService, ApprovalDecision } from "@/lib/services/shift-approval-service";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";

/**
 * GET /api/approvals
 * Get approval requests
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const branchId = searchParams.get("branchId");
        const userId = searchParams.get("userId");
        const status = searchParams.get("status") as any;

        // Get pending approvals for branch (managers)
        if (branchId && !userId) {
            const approvals = await ShiftApprovalService.getPendingApprovals(branchId, tenant.companyId);
            return NextResponse.json({ approvals });
        }

        // Get approvals for specific user
        if (userId) {
            const approvals = await ShiftApprovalService.getUserApprovals(
                userId,
                tenant.companyId,
                status
            );
            return NextResponse.json({ approvals });
        }

        // Default: get approvals for current user
        const approvals = await ShiftApprovalService.getUserApprovals(
            session.user.id,
            tenant.companyId,
            status
        );
        return NextResponse.json({ approvals });
    } catch (error) {
        console.error("Error fetching approvals:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

/**
 * POST /api/approvals
 * Create a new approval request
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const body = await req.json();

        const approval = await ShiftApprovalService.createApproval({
            companyId: tenant.companyId,
            branchId: body.branchId,
            approvalType: body.approvalType,
            requestedBy: session.user.id,
            requestedFor: body.requestedFor || session.user.id,
            title: body.title,
            description: body.description,
            reason: body.reason,
            shiftSessionId: body.shiftSessionId,
            plannedShiftId: body.plannedShiftId,
            startTime: body.startTime ? new Date(body.startTime) : undefined,
            endTime: body.endTime ? new Date(body.endTime) : undefined,
            durationMinutes: body.durationMinutes,
            overtimeMinutes: body.overtimeMinutes,
            extraData: body.extraData
        });

        return NextResponse.json({ success: true, approval });
    } catch (error) {
        console.error("Error creating approval:", error);
        return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 });
    }
}

/**
 * PATCH /api/approvals/:id
 * Approve or reject an approval request
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const approvalId = searchParams.get("id");

        if (!approvalId) {
            return NextResponse.json({ error: "Approval ID requerido" }, { status: 400 });
        }

        const body = await req.json();
        const decision: ApprovalDecision = {
            status: body.status,
            approvedBy: session.user.id,
            rejectionReason: body.rejectionReason
        };

        if (!decision.status || !['APPROVED', 'REJECTED'].includes(decision.status)) {
            return NextResponse.json(
                { error: "Status debe ser APPROVED o REJECTED" },
                { status: 400 }
            );
        }

        const approval = await ShiftApprovalService.decideApproval(
            approvalId,
            tenant.companyId,
            decision
        );

        if (!approval) {
            return NextResponse.json({ error: "Approval no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ success: true, approval });
    } catch (error) {
        console.error("Error deciding approval:", error);
        return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 });
    }
}

/**
 * DELETE /api/approvals/:id
 * Cancel an approval request
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const approvalId = searchParams.get("id");

        if (!approvalId) {
            return NextResponse.json({ error: "Approval ID requerido" }, { status: 400 });
        }

        const approval = await ShiftApprovalService.cancelApproval(
            approvalId,
            tenant.companyId,
            session.user.id
        );

        if (!approval) {
            return NextResponse.json({ error: "Approval no encontrado o ya procesado" }, { status: 404 });
        }

        return NextResponse.json({ success: true, approval });
    } catch (error: any) {
        console.error("Error cancelling approval:", error);
        return NextResponse.json({ error: error.message || "Error al cancelar solicitud" }, { status: 500 });
    }
}
