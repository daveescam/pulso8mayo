
import { sleep } from "workflow";
import { ShiftService } from "@/lib/services/shift-service";
import { ShiftWorkflowService } from "@/lib/services/shift-workflow-service";
import { WhatsAppService } from "@/lib/services/whatsapp-service";
import { db } from "@/lib/db";
import { breakLogs, shiftSessions } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// Step 1: Start Break with optional geolocation
export async function startBreakStep(
    userId: string,
    geolocation?: { latitude: number; longitude: number; accuracy?: number }
) {
    "use step";
    try {
        // Get active session
        const session = await ShiftWorkflowService.getActiveSession(userId);
        
        if (!session) {
            return { success: false, error: "No hay sesión activa. Registra tu entrada primero." };
        }

        // Check if already on break
        const activeBreak = await db.query.breakLogs.findFirst({
            where: and(
                eq(breakLogs.sessionId, session.id),
                isNull(breakLogs.endTime)
            )
        });

        if (activeBreak) {
            return { 
                success: false, 
                error: "Ya estás en pausa. Para terminar la pausa, envía: fin pausa" 
            };
        }

        // Start break
        const [log] = await db.insert(breakLogs).values({
            sessionId: session.id,
            startTime: new Date(),
            type: 'MEAL'
        }).returning();

        // Update geolocation if provided
        if (geolocation) {
            await db.update(breakLogs)
                .set({
                    // Assuming you might want to add geolocation to breakLogs schema later
                    // For now, just log it
                })
                .where(eq(breakLogs.id, log.id));
        }

        return { success: true, log };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// Step 2: Send WhatsApp Message
export async function sendWhatsAppMessageStep(phone: string, text: string) {
    "use step";
    return await WhatsAppService.sendMessage(phone, text);
}

// Step 3: Check Break Status (for reminder)
export async function checkBreakStatusStep(userId: string) {
    "use step";
    const session = await ShiftWorkflowService.getActiveSession(userId);

    if (!session) return false;

    const activeBreak = await db.query.breakLogs.findFirst({
        where: and(
            eq(breakLogs.sessionId, session.id),
            isNull(breakLogs.endTime)
        )
    });

    return !!activeBreak;
}

// Main Workflow
export async function handleBreakStartWorkflow(
    userId: string,
    phoneNumber: string,
    geolocation?: { latitude: number; longitude: number; accuracy?: number }
) {
    "use workflow";

    // 1. Start Break
    const result = await startBreakStep(userId, geolocation);

    if (!result.success) {
        await sendWhatsAppMessageStep(phoneNumber, `⚠️ No se pudo iniciar pausa: ${result.error}`);
        return;
    }

    const breakStartTime = result.log.startTime.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    // 2. Confirm
    await sendWhatsAppMessageStep(phoneNumber, 
        `☕ *Pausa Iniciada*\n\n` +
        `⏰ Hora: ${breakStartTime}\n` +
        `⏱️ Duración máxima: 30 minutos\n\n` +
        `Envía *fin pausa* cuando regreses.`
    );

    // 3. Wait 30 minutes
    await sleep("30m");

    // 4. Check if still on break
    const stillOnBreak = await checkBreakStatusStep(userId);

    if (stillOnBreak) {
        await sendWhatsAppMessageStep(phoneNumber, 
            `⚠️ *Recordatorio*: Ya pasaron 30 minutos de tu pausa.\n\n` +
            `Envía *fin pausa* para regresar.`
        );
    }
}
