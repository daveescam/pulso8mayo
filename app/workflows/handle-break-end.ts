
import { ShiftService } from "@/lib/services/shift-service";
import { ShiftWorkflowService } from "@/lib/services/shift-workflow-service";
import { WhatsAppService } from "@/lib/services/whatsapp-service";
import { db } from "@/lib/db";
import { breakLogs } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// Step 1: End Break with optional geolocation
export async function endBreakStep(
    userId: string,
    geolocation?: { latitude: number; longitude: number; accuracy?: number }
) {
    "use step";
    try {
        // Get active session
        const session = await ShiftWorkflowService.getActiveSession(userId);
        
        if (!session) {
            return { success: false, error: "No hay sesión activa" };
        }

        // Find active break
        const activeBreak = await db.query.breakLogs.findFirst({
            where: and(
                eq(breakLogs.sessionId, session.id),
                isNull(breakLogs.endTime)
            )
        });

        if (!activeBreak) {
            return { success: false, error: "No hay una pausa activa. Para iniciar una pausa, envía: inicio pausa" };
        }

        // End the break
        const endTime = new Date();
        const durationMs = endTime.getTime() - activeBreak.startTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);

        const [log] = await db.update(breakLogs)
            .set({
                endTime,
                durationMinutes
            })
            .where(eq(breakLogs.id, activeBreak.id))
            .returning();

        // Update total break minutes in session
        const currentBreakTotal = session.totalBreakMinutes || 0;
        await db.update(shiftSessions)
            .set({
                totalBreakMinutes: currentBreakTotal + durationMinutes
            })
            .where(eq(shiftSessions.id, session.id));

        return { success: true, log, durationMinutes };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// Step 2: Send WhatsApp Message
export async function sendWhatsAppMessageStep(phone: string, text: string) {
    "use step";
    return await WhatsAppService.sendMessage(phone, text);
}

// Main Workflow
export async function handleBreakEndWorkflow(
    userId: string,
    phoneNumber: string,
    geolocation?: { latitude: number; longitude: number; accuracy?: number }
) {
    "use workflow";

    // 1. End Break
    const result = await endBreakStep(userId, geolocation);

    if (!result.success) {
        await sendWhatsAppMessageStep(phoneNumber, `⚠️ No se pudo finalizar pausa: ${result.error}`);
        return;
    }

    // 2. Confirm with duration
    const endTime = new Date().toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    await sendWhatsAppMessageStep(phoneNumber, 
        `✅ *Pausa Finalizada*\n\n` +
        `⏰ Hora: ${endTime}\n` +
        `⏱️ Duración: ${result.durationMinutes} minutos\n\n` +
        `¡A trabajar! 💪`
    );
}
