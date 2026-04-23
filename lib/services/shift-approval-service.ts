import { db } from "@/lib/db";
import { shiftApprovals, shiftSessions, users, branches } from "@/lib/db/schema";
import { eq, and, or, desc, inArray } from "drizzle-orm";

export type ApprovalType = 'OVERTIME' | 'SCHEDULE_CHANGE' | 'TIME_OFF' | 'SHIFT_SWAP' | 'EARLY_DEPARTURE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ShiftApprovalRequest {
    companyId: string;
    branchId: string;
    approvalType: ApprovalType;
    requestedBy: string;
    requestedFor: string;
    title: string;
    description?: string;
    reason?: string;
    shiftSessionId?: string;
    plannedShiftId?: string;
    startTime?: Date;
    endTime?: Date;
    durationMinutes?: number;
    overtimeMinutes?: number;
    extraData?: any;
}

export interface ApprovalDecision {
    status: ApprovalStatus;
    approvedBy: string;
    rejectionReason?: string;
}

export class ShiftApprovalService {
    /**
     * Create a new approval request
     */
    static async createApproval(data: ShiftApprovalRequest): Promise<any> {
        const [approval] = await db.insert(shiftApprovals).values({
            companyId: data.companyId,
            branchId: data.branchId,
            approvalType: data.approvalType,
            requestedBy: data.requestedBy,
            requestedFor: data.requestedFor,
            title: data.title,
            description: data.description,
            reason: data.reason,
            shiftSessionId: data.shiftSessionId,
            plannedShiftId: data.plannedShiftId,
            startTime: data.startTime,
            endTime: data.endTime,
            durationMinutes: data.durationMinutes,
            overtimeMinutes: data.overtimeMinutes,
            extraData: data.extraData,
            status: 'PENDING'
        }).returning();

        // TODO: Send notification to managers
        // await this.notifyManagers(approval);

        return approval;
    }

    /**
     * Get pending approvals for a branch
     */
    static async getPendingApprovals(branchId: string, companyId: string): Promise<any[]> {
        const approvals = await db.query.shiftApprovals.findMany({
            where: and(
                eq(shiftApprovals.branchId, branchId),
                eq(shiftApprovals.companyId, companyId),
                eq(shiftApprovals.status, 'PENDING')
            ),
            orderBy: [desc(shiftApprovals.createdAt)],
            with: {
                // Add relations if needed
            }
        });

        return approvals;
    }

    /**
     * Get approvals for a specific user
     */
    static async getUserApprovals(
        userId: string,
        companyId: string,
        status?: ApprovalStatus
    ): Promise<any[]> {
        const conditions = [
            eq(shiftApprovals.companyId, companyId),
            or(
                eq(shiftApprovals.requestedBy, userId),
                eq(shiftApprovals.requestedFor, userId)
            )
        ];

        if (status) {
            conditions.push(eq(shiftApprovals.status, status));
        }

        const approvals = await db.query.shiftApprovals.findMany({
            where: and(...conditions),
            orderBy: [desc(shiftApprovals.createdAt)]
        });

        return approvals;
    }

    /**
     * Approve or reject an approval request
     */
    static async decideApproval(
        approvalId: string,
        companyId: string,
        decision: ApprovalDecision
    ): Promise<any | null> {
        const updateData: any = {
            status: decision.status,
            approvedBy: decision.approvedBy,
            approvedAt: new Date(),
            rejectionReason: decision.rejectionReason
        };

        const [approval] = await db.update(shiftApprovals).set(updateData)
            .where(and(
                eq(shiftApprovals.id, approvalId),
                eq(shiftApprovals.companyId, companyId)
            ))
            .returning();

        if (!approval) {
            return null;
        }

        // If approved, update related entities
        if (decision.status === 'APPROVED') {
            await this.handleApprovedApproval(approval);
        }

        // TODO: Send notification to requester
        // await this.notifyDecision(approval, decision);

        return approval;
    }

    /**
     * Handle approved approval (update related entities)
     */
    private static async handleApprovedApproval(approval: any): Promise<void> {
        switch (approval.approvalType) {
            case 'OVERTIME':
                // Update shift session with approved overtime
                if (approval.shiftSessionId && approval.overtimeMinutes) {
                    await db.update(shiftSessions).set({
                        overtimeMinutes: approval.overtimeMinutes,
                        requiresApproval: false,
                        approvedBy: approval.approvedBy,
                        approvedAt: approval.approvedAt
                    }).where(eq(shiftSessions.id, approval.shiftSessionId));
                }
                break;

            case 'EARLY_DEPARTURE':
                // Mark session as approved for early departure
                if (approval.shiftSessionId) {
                    await db.update(shiftSessions).set({
                        requiresApproval: false,
                        approvedBy: approval.approvedBy,
                        approvedAt: approval.approvedAt
                    }).where(eq(shiftSessions.id, approval.shiftSessionId));
                }
                break;

            case 'SCHEDULE_CHANGE':
            case 'SHIFT_SWAP':
            case 'TIME_OFF':
                // Handle schedule changes (would update planned_shifts)
                // This would require additional logic based on business rules
                break;
        }
    }

    /**
     * Cancel an approval request
     */
    static async cancelApproval(
        approvalId: string,
        companyId: string,
        userId: string
    ): Promise<any | null> {
        const approval = await db.query.shiftApprovals.findFirst({
            where: and(
                eq(shiftApprovals.id, approvalId),
                eq(shiftApprovals.companyId, companyId)
            )
        });

        if (!approval || approval.status !== 'PENDING') {
            return null;
        }

        // Only the requester can cancel
        if (approval.requestedBy !== userId) {
            throw new Error("Only the requester can cancel an approval request");
        }

        const [updatedApproval] = await db.update(shiftApprovals).set({
            status: 'CANCELLED'
        }).where(eq(shiftApprovals.id, approvalId)).returning();

        return updatedApproval;
    }

    /**
     * Auto-detect overtime requiring approval
     */
    static async detectOvertimeRequiringApproval(
        sessionId: string,
        overtimeMinutes: number,
        threshold: number = 30
    ): Promise<any | null> {
        if (overtimeMinutes < threshold) {
            return null;
        }

        const session = await db.query.shiftSessions.findFirst({
            where: eq(shiftSessions.id, sessionId),
            with: {
                // Include user and branch data
            }
        });

        if (!session) {
            return null;
        }

        // Check if approval already exists
        const existingApproval = await db.query.shiftApprovals.findFirst({
            where: and(
                eq(shiftApprovals.shiftSessionId, sessionId),
                eq(shiftApprovals.approvalType, 'OVERTIME')
            )
        });

        if (existingApproval) {
            return existingApproval;
        }

        // Create approval request
        const approval = await this.createApproval({
            companyId: session.branchId, // Would need to get from branch
            branchId: session.branchId,
            approvalType: 'OVERTIME',
            requestedBy: session.userId,
            requestedFor: session.userId,
            title: `Overtime Detection - ${overtimeMinutes} minutos`,
            description: `Se detectaron ${overtimeMinutes} minutos de tiempo extra en la sesión del ${session.startedAt}`,
            shiftSessionId: sessionId,
            overtimeMinutes: overtimeMinutes,
            durationMinutes: session.totalWorkMinutes
        });

        // Mark session as requiring approval
        await db.update(shiftSessions).set({
            requiresApproval: true
        }).where(eq(shiftSessions.id, sessionId));

        return approval;
    }

    /**
     * Get approval statistics
     */
    static async getApprovalStats(branchId: string, companyId: string): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        cancelled: number;
        byType: Record<ApprovalType, number>;
    }> {
        const approvals = await db.query.shiftApprovals.findMany({
            where: and(
                eq(shiftApprovals.branchId, branchId),
                eq(shiftApprovals.companyId, companyId)
            )
        });

        const stats = {
            total: approvals.length,
            pending: approvals.filter(a => a.status === 'PENDING').length,
            approved: approvals.filter(a => a.status === 'APPROVED').length,
            rejected: approvals.filter(a => a.status === 'REJECTED').length,
            cancelled: approvals.filter(a => a.status === 'CANCELLED').length,
            byType: {} as Record<ApprovalType, number>
        };

        // Count by type
        const types: ApprovalType[] = ['OVERTIME', 'SCHEDULE_CHANGE', 'TIME_OFF', 'SHIFT_SWAP', 'EARLY_DEPARTURE'];
        types.forEach(type => {
            stats.byType[type] = approvals.filter(a => a.approvalType === type).length;
        });

        return stats;
    }

    /**
     * Notify managers about pending approvals (placeholder)
     */
    private static async notifyManagers(approval: any): Promise<void> {
        // TODO: Implement notification logic
        // Could send WhatsApp, email, or in-app notifications
        console.log(`Notifying managers about approval request ${approval.id}`);
    }

    /**
     * Notify requester about decision (placeholder)
     */
    private static async notifyDecision(approval: any, decision: ApprovalDecision): Promise<void> {
        // TODO: Implement notification logic
        console.log(`Notifying ${approval.requestedBy} about ${decision.status} decision`);
    }
}
