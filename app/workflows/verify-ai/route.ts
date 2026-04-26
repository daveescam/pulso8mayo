import { NextRequest, NextResponse } from "next/server";
import { SmartLinkService } from "@/lib/services/smart-link-service";
import { AIService, SmartLinkVerificationResult } from "@/lib/services/ai-service";
import { VerificationRule, VerificationType } from "@/lib/types/ai-verification";
import { db } from "@/lib/db";
import { workflowInstanceSteps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NotificationService } from "@/lib/services/notification-service";
import { EscalationService, EscalationLevel } from "@/lib/services/escalation-service";

/**
 * POST /workflows/verify-ai
 * 
 * Handles AI verification for photos uploaded via smartlink
 * 
 * Request:
 * - token: JWT token from smartlink
 * - photoUrl: URL of uploaded photo
 * - stepId: Workflow step ID being verified
 * - rule: Verification rule configuration
 * 
 * Response:
 * - success: boolean
 * - verification: Verification result details
 * - requiresAction: Whether user needs to take action
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, photoUrl, stepId, rule } = body as {
            token: string;
            photoUrl: string;
            stepId: string;
            rule: VerificationRule;
        };

        // Validate required fields
        if (!token || !photoUrl || !stepId || !rule) {
            return NextResponse.json(
                { error: "Missing required fields: token, photoUrl, stepId, rule" },
                { status: 400 }
            );
        }

        console.log(`[VerifyAI] Starting verification for step ${stepId}`);

        // 1. Validate smartlink token
        const validatedLink = await SmartLinkService.validateSmartLink(token);
        if (!validatedLink) {
            console.warn('[VerifyAI] Invalid or expired smartlink token');
            return NextResponse.json(
                { error: "Invalid or expired smartlink" },
                { status: 401 }
            );
        }

        const { instance, link } = validatedLink;

        // 2. Perform AI verification with retry logic
        const verificationResult = await AIService.verifySmartLinkPhoto(
            photoUrl,
            rule,
            {
                instanceId: instance.id,
                stepId,
                workflowTemplateId: link.workflowTemplateId
            }
        );

        console.log(`[VerifyAI] Verification result:`, {
            success: verificationResult.success,
            verificationId: verificationResult.verificationId,
            requiresManualReview: verificationResult.requiresManualReview,
            escalated: verificationResult.escalated
        });

        // 3. Update workflow step with AI analysis
        await db
            .update(workflowInstanceSteps)
            .set({
                aiAnalysis: {
                    verificationId: verificationResult.verificationId,
                    ...verificationResult.aiResult,
                    timestamp: verificationResult.timestamp.toISOString()
                },
                evidenceUrl: photoUrl,
                completedAt: verificationResult.success ? new Date() : null,
                status: verificationResult.success ? 'COMPLETED' : 'FAILED'
            })
            .where(eq(workflowInstanceSteps.id, stepId));

        // 4. Handle verification result
        if (verificationResult.success) {
            // Mark smartlink as used
            await SmartLinkService.markSmartLinkUsed(token);

            // Send success notification
            if (instance.assigneeId) {
                await NotificationService.sendInAppNotification(instance.assigneeId, {
                    title: 'Verificación Exitosa',
                    message: 'Tu evidencia fue aprobada por el sistema AI.',
                    type: 'success',
                    actionUrl: `/dashboard/workflows/${instance.id}`,
                    actionLabel: 'Ver Detalles'
                });
            }

            return NextResponse.json({
                success: true,
                verification: verificationResult,
                requiresAction: false
            });
        }

        // 5. Handle failed verification
        await SmartLinkService.markSmartLinkFailed(token);

        // Trigger escalation if needed
        if (verificationResult.escalated) {
            console.log(`[VerifyAI] Triggering escalation for failed verification`);
            
            // Create incident for failed verification
            const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
    // Get escalation chain from workflow template or use default
    const escalationChain: EscalationLevel[] = [
      {
        afterMinutes: 0,
        role: 'SUPERVISOR',
        notificationTemplate: `⚠️ Verificación AI fallida: Workflow ${instance.id}. Se requiere revisión manual.`
      },
      {
        afterMinutes: 30,
        role: 'GERENTE',
        notificationTemplate: `🔴 Escalamiento: Verificación AI sin resolver por 30min. Workflow ${instance.id}.`
      }
    ];

            // Trigger escalation
            await EscalationService.executeEscalationLevel(incidentId, escalationChain[0]);

            // Send failure notification to assignee
            if (instance.assigneeId) {
                await NotificationService.sendInAppNotification(instance.assigneeId, {
                    title: 'Verificación Fallida',
                    message: 'La evidencia no pasó la verificación AI. Un supervisor será notificado.',
                    type: 'error',
                    actionUrl: `/dashboard/workflows/${instance.id}`,
                    actionLabel: 'Ver Detalles'
                });
            }
        }

        return NextResponse.json({
            success: false,
            verification: verificationResult,
            requiresAction: verificationResult.requiresManualReview,
            escalated: verificationResult.escalated
        });

    } catch (error: any) {
        console.error('[VerifyAI] Error processing verification:', error);
        return NextResponse.json(
            { error: `Verification failed: ${error.message}` },
            { status: 500 }
        );
    }
}

/**
 * GET /workflows/verify-ai
 * 
 * Get verification status for a specific verification ID
 */
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const verificationId = searchParams.get('verificationId');

        if (!verificationId) {
            return NextResponse.json(
                { error: "Missing verificationId parameter" },
                { status: 400 }
            );
        }

        // Query workflow instance steps for the verification
        const [step] = await db
            .select()
            .from(workflowInstanceSteps)
            .where(eq(workflowInstanceSteps.id, verificationId))
            .limit(1);

        if (!step) {
            return NextResponse.json(
                { error: "Verification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            verification: {
                stepId: step.id,
                instanceId: step.instanceId,
                status: step.status,
                aiAnalysis: step.aiAnalysis,
                evidenceUrl: step.evidenceUrl,
                completedAt: step.completedAt
            }
        });

    } catch (error: any) {
        console.error('[VerifyAI] Error getting verification status:', error);
        return NextResponse.json(
            { error: `Failed to get verification: ${error.message}` },
            { status: 500 }
        );
    }
}
