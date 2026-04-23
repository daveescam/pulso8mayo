import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflowInstanceSteps, workflowInstances, workflowTemplates, users, branches } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/dashboard/ai-verifications
 * 
 * Fetch AI verification records for dashboard display
 * 
 * Query Parameters:
 * - status: Filter by status (success, failed, escalated, pending, analyzing)
 * - limit: Maximum number of results (default: 50)
 * - branchId: Filter by branch
 * - assigneeId: Filter by assignee
 */
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const branchId = searchParams.get('branchId');
        const assigneeId = searchParams.get('assigneeId');

        // Build where conditions
        const conditions = [
            sql`${workflowInstanceSteps.aiAnalysis} IS NOT NULL`
        ];

        if (status) {
            if (status === 'success') {
                conditions.push(eq(workflowInstanceSteps.status, 'COMPLETED'));
            } else if (status === 'failed' || status === 'escalated') {
                conditions.push(eq(workflowInstanceSteps.status, 'FAILED'));
            } else if (status === 'pending' || status === 'analyzing') {
                conditions.push(eq(workflowInstanceSteps.status, 'PENDING'));
            }
        }

        if (branchId) {
            conditions.push(eq(workflowInstances.branchId, branchId));
        }

        if (assigneeId) {
            conditions.push(eq(workflowInstances.assigneeId, assigneeId));
        }

        // Query verifications with joins
        const verifications = await db
            .select({
                id: workflowInstanceSteps.id,
                instanceId: workflowInstanceSteps.instanceId,
                stepId: workflowInstanceSteps.id,
                status: workflowInstanceSteps.status,
                aiAnalysis: workflowInstanceSteps.aiAnalysis,
                evidenceUrl: workflowInstanceSteps.evidenceUrl,
                completedAt: workflowInstanceSteps.completedAt,
                workflowName: workflowTemplates.name,
                assigneeName: users.name,
                branchName: branches.name,
                branchId: workflowInstances.branchId
            })
            .from(workflowInstanceSteps)
            .innerJoin(workflowInstances, eq(workflowInstanceSteps.instanceId, workflowInstances.id))
            .innerJoin(workflowTemplates, eq(workflowInstances.workflowTemplateId, workflowTemplates.id))
            .leftJoin(users, eq(workflowInstances.assigneeId, users.id))
            .leftJoin(branches, eq(workflowInstances.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(desc(workflowInstanceSteps.completedAt))
            .limit(limit);

        // Transform data for frontend
        const transformedVerifications = verifications.map(v => {
            const aiAnalysis = v.aiAnalysis as Record<string, unknown>;
            
            let processedStatus: 'pending' | 'analyzing' | 'success' | 'failed' | 'escalated' = 'pending';
            
            if (v.status === 'COMPLETED' && aiAnalysis?.passed) {
                processedStatus = 'success';
            } else if (v.status === 'FAILED') {
                processedStatus = (aiAnalysis?.escalated as boolean) ? 'escalated' : 'failed';
            } else if (v.status === 'PENDING' && aiAnalysis) {
                processedStatus = 'analyzing';
            }

            return {
                id: (aiAnalysis?.verificationId as string) || v.id,
                workflowName: v.workflowName,
                instanceId: v.instanceId,
                stepId: v.stepId,
                status: processedStatus,
                confidence: aiAnalysis?.confidence as number | undefined,
                reason: aiAnalysis?.reason as string | undefined,
                provider: aiAnalysis?.provider as string | undefined,
                timestamp: (aiAnalysis?.timestamp as string) || v.completedAt,
                requiresManualReview: aiAnalysis?.requiresManualReview as boolean | undefined,
                escalated: aiAnalysis?.escalated as boolean | undefined,
                photoUrl: v.evidenceUrl,
                assignee: v.assigneeName,
                branch: v.branchName
            };
        });

        return NextResponse.json({
            success: true,
            data: transformedVerifications,
            count: transformedVerifications.length
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API] Error fetching AI verifications:', errorMessage);
        return NextResponse.json(
            { error: `Failed to fetch verifications: ${errorMessage}` },
            { status: 500 }
        );
    }
}
