
import { sleep } from "workflow";
import { ShiftService } from "@/lib/services/shift-service";
import { ShiftWorkflowService } from "@/lib/services/shift-workflow-service";
import { WorkflowExecutionService } from "@/lib/services/workflow-execution-service";
import { SmartLinkService } from "@/lib/services/smart-link-service";
import { WhatsAppService } from "@/lib/services/whatsapp-service";

// Step 1: Get planned shift and workflow for today
export async function getShiftWorkflowStep(userId: string, branchId: string) {
    "use step";
    return await ShiftWorkflowService.getTodayShiftWorkflow(userId, branchId);
}

// Step 2: Register Clock In with geolocation
export async function registerClockInStep(
    userId: string,
    branchId: string,
    geolocation?: { latitude: number; longitude: number; accuracy?: number }
) {
    "use step";
    // First check if there's a planned shift
    const shiftContext = await ShiftWorkflowService.getTodayShiftWorkflow(userId, branchId);
    
    if (shiftContext?.plannedShift) {
        // Create session from planned shift
        const session = await ShiftWorkflowService.createShiftSessionFromPlannedShift(
            shiftContext.plannedShift.id,
            userId,
            branchId
        );
        
        if (session && geolocation) {
            // Update session with geolocation
            const { db } = await import("@/lib/db");
            const { shiftSessions } = await import("@/lib/db/schema");
            const { eq } = await import("drizzle-orm");
            
            await db.update(shiftSessions)
                .set({
                    checkInGeolocation: {
                        latitude: geolocation.latitude,
                        longitude: geolocation.longitude,
                        accuracy: geolocation.accuracy,
                        timestamp: Date.now()
                    },
                    checkInTime: new Date()
                })
                .where(eq(shiftSessions.id, session.id));
        }
        
        return { session, plannedShift: shiftContext.plannedShift, workflowTemplate: shiftContext.workflowTemplate };
    } else {
        // No planned shift - create ad-hoc session
        const session = await ShiftService.clockInV2(userId, branchId, new Date());
        return { session, plannedShift: null, workflowTemplate: null };
    }
}

// Step 3: Create Workflow Instance if template exists
export async function createWorkflowInstanceStep(
    workflowTemplateId: string,
    branchId: string,
    userId: string,
    sessionId: string
) {
    "use step";
    if (!workflowTemplateId) {
        return null;
    }
    
    return await WorkflowExecutionService.createExecution(
        workflowTemplateId,
        branchId,
        userId,
        sessionId
    );
}

// Step 4: Generate Smart Link
export async function generateSmartLinkStep(instanceId: string, workflowTemplateId: string, sessionId: string) {
  "use step";
  if (!instanceId || !workflowTemplateId || !sessionId) {
    return null;
  }
  return await SmartLinkService.createSmartLink(instanceId, workflowTemplateId, sessionId);
}

// Step 5: Send WhatsApp Message
export async function sendWhatsAppMessageStep(phone: string, text: string) {
    "use step";
    return await WhatsAppService.sendMessage(phone, text);
}

// Main Workflow
export async function handleClockInWorkflow(
    userId: string,
    branchId: string,
    phone: string,
    geolocation?: { latitude: number; longitude: number; accuracy?: number }
) {
    "use workflow";

    // 1. Get today's shift and associated workflow
    const shiftContext = await getShiftWorkflowStep(userId, branchId);

    // 2. Register Clock In
    const clockInResult = await registerClockInStep(userId, branchId, geolocation);

    if (!clockInResult.session) {
        await sendWhatsAppMessageStep(phone, "⚠️ Error al registrar entrada. Ya tienes una sesión activa o no hay turno planificado.");
        return;
    }

    const session = clockInResult.session;
    const startTime = session.checkInTime || session.startedAt;
    
    // 3. Check if there's a workflow associated with the shift
    const workflowTemplate = clockInResult.workflowTemplate || shiftContext?.workflowTemplate;
    
    if (workflowTemplate) {
        // 4. Create Workflow Instance
        const instance = await createWorkflowInstanceStep(
            workflowTemplate.id,
            branchId,
            userId,
            session.id
        );

    if (instance) {
      // 5. Generate Smart Link
      const link = await generateSmartLinkStep(instance.id, workflowTemplate.id, session.id);

            if (link) {
                // 6. Send WhatsApp with workflow link
                const message = `✅ *Entrada Registrada*\n\n` +
                    `⏰ Hora: ${startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}\n` +
                    `📋 Turno: ${shiftContext?.plannedShift?.startTime || 'N/A'} - ${shiftContext?.plannedShift?.endTime || 'N/A'}\n\n` +
                    `Tu workflow de turno es: *${workflowTemplate.name}*\n\n` +
                    `Completa tu workflow aquí:\n${link.url}`;
                
                await sendWhatsAppMessageStep(phone, message);
                return;
            }
        }
    }

    // No workflow - just confirm clock in
    const message = `✅ *Entrada Registrada*\n\n` +
        `⏰ Hora: ${startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}\n` +
        `📋 Turno: ${shiftContext?.plannedShift?.startTime || 'N/A'} - ${shiftContext?.plannedShift?.endTime || 'N/A'}\n\n` +
        `No hay workflow asignado para este turno.`;
    
    await sendWhatsAppMessageStep(phone, message);
}
