
import { ShiftService } from "@/lib/services/shift-service";
import { ShiftWorkflowService } from "@/lib/services/shift-workflow-service";
import { WhatsAppService } from "@/lib/services/whatsapp-service";
import { db } from "@/lib/db";
import { shiftSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Step 1: End Session with geolocation
export async function endSessionStep(
    userId: string,
    geolocation?: { latitude: number; longitude: number; accuracy?: number }
) {
    "use step";
    try {
        // Get active session
        const session = await ShiftWorkflowService.getActiveSession(userId);
        
        if (!session) {
            return { success: false, error: "No active session found" };
        }

        // Update session with checkout geolocation
        if (geolocation) {
            await db.update(shiftSessions)
                .set({
                    checkOutGeolocation: {
                        latitude: geolocation.latitude,
                        longitude: geolocation.longitude,
                        accuracy: geolocation.accuracy,
                        timestamp: Date.now()
                    },
                    checkOutTime: new Date()
                })
                .where(eq(shiftSessions.id, session.id));
        }

        // End the session (calculates work time, overtime, etc.)
        const [updatedSession] = await ShiftService.endSession(userId);

        return { success: true, session: updatedSession };
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
export async function handleClockOutWorkflow(
    userId: string,
    phoneNumber: string,
    geolocation?: { latitude: number; longitude: number; accuracy?: number }
) {
    "use workflow";

    // 1. End Session
    const result = await endSessionStep(userId, geolocation);

    if (!result.success) {
        await sendWhatsAppMessageStep(phoneNumber, `⚠️ No se pudo registrar salida: ${result.error}`);
        return;
    }

    const session = result.session;
    const workHours = Math.floor((session.totalWorkMinutes || 0) / 60);
    const workMins = (session.totalWorkMinutes || 0) % 60;

    // 2. Send Summary
    let message = `✅ *Salida Registrada*\n\n`;
    message += `⏱️ Tiempo total: ${workHours}h ${workMins}m\n`;

    if (session.overtimeMinutes && session.overtimeMinutes > 0) {
        const otHours = Math.floor(session.overtimeMinutes / 60);
        const otMins = session.overtimeMinutes % 60;
        message += `⚡ Horas extras: ${otHours}h ${otMins}m\n`;
    }

    // Add break summary
    if (session.totalBreakMinutes && session.totalBreakMinutes > 0) {
        const breakHours = Math.floor(session.totalBreakMinutes / 60);
        const breakMins = session.totalBreakMinutes % 60;
        message += `☕ Pausas: ${breakHours}h ${breakMins}m\n`;
    }

    // Add compliance flags if any
    if (session.complianceFlags) {
        const flags = session.complianceFlags as any;
        if (flags.lateCheckIn) {
            message += `⚠️ Llegada tarde\n`;
        }
        if (flags.earlyCheckOut) {
            message += `⚠️ Salida temprana\n`;
        }
        if (flags.missedBreak) {
            message += `⚠️ No tomó pausa\n`;
        }
    }

    message += `\n¡Gracias por tu esfuerzo! 👏`;

    await sendWhatsAppMessageStep(phoneNumber, message);
}
