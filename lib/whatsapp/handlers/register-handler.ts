/**
 * WhatsApp Register Handler
 *
 * Handles the WhatsApp-first employee registration flow:
 * 1. Employee sends invite token (UUID) via WhatsApp
 * 2. Handler validates token, finds branch/company
 * 3. If user exists: links to branch
 * 4. If user doesn't exist: sends join link to complete profile
 */

import { db } from "@/lib/db";
import { branches, users, companies, whatsappConversationStates } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

export interface RegisterResult {
    success: boolean;
    message: string;
    branchName?: string;
    companyName?: string;
    role?: string;
    joinUrl?: string;
}

export class RegisterHandler {
    /**
     * Process an invite token received via WhatsApp
     * @param phoneNumber The WhatsApp phone number that sent the token
     * @param inviteToken The invite token (UUID) to validate
     * @param baseUrl Base URL for generating join links
     */
    async processInviteToken(
        phoneNumber: string,
        inviteToken: string,
        baseUrl: string
    ): Promise<RegisterResult> {
        try {
            const branch = await db.query.branches.findFirst({
                where: or(
                    eq(branches.inviteToken, inviteToken),
                    eq(branches.managerInviteToken, inviteToken)
                ),
            });

            if (!branch) {
                return {
                    success: false,
                    message: "❌ Código de invitación inválido.\n\nAsegúrate de haber copiado el código correctamente o solicita uno nuevo a tu gerente.",
                };
            }

            const role = branch.managerInviteToken === inviteToken ? "GERENTE" : "EMPLEADO";

            const company = await db.query.companies.findFirst({
                where: eq(companies.id, branch.companyId),
                columns: { name: true },
            });

            const branchName = branch.name;
            const companyName = company?.name || "la empresa";

            // Check if user already exists with this phone
            const existingUser = await db.query.users.findFirst({
                where: or(
                    eq(users.whatsappPhone, phoneNumber),
                    eq(users.phone, phoneNumber),
                ),
            });

            if (existingUser) {
                await db.update(users)
                    .set({
                        companyId: branch.companyId,
                        branchId: branch.id,
                        role: role,
                        whatsappPhone: phoneNumber,
                    })
                    .where(eq(users.id, existingUser.id));

                if (role === "GERENTE") {
                    await db.update(branches)
                        .set({ managerId: existingUser.id })
                        .where(eq(branches.id, branch.id));
                }

                return {
                    success: true,
                    message: `✅ *¡Ya estás vinculado a ${branchName}!*\n\n` +
                        `Tu número ha sido asociado a:\n` +
                        `🏢 ${companyName}\n` +
                        `📍 ${branchName}\n` +
                        `👤 Rol: ${role}\n\n` +
                        `Ya puedes usar los comandos de Pulso:\n` +
                        `• *entrada* - Registrar entrada\n` +
                        `• *salida* - Registrar salida\n` +
                        `• *tareas* - Ver tareas pendientes\n\n` +
                        `Escribe *ayuda* para ver todos los comandos.`,
                    branchName,
                    companyName,
                    role,
                };
            }

            // Store conversation state for tracking
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await db.insert(whatsappConversationStates).values({
                userPhone: phoneNumber,
                status: "ACTIVE",
                lastMessageAt: new Date(),
                expiresAt,
                context: {
                    type: "REGISTER",
                    inviteToken,
                    branchId: branch.id,
                    companyId: branch.companyId,
                    role,
                },
            });

            // Generate join link with phone pre-filled
            const joinUrl = `${baseUrl}/join/${inviteToken}?phone=${encodeURIComponent(phoneNumber)}`;

            return {
                success: true,
                message: `👋 *¡Bienvenido a ${companyName}!*\n\n` +
                    `Has sido invitado a unirte como *${role}* a:\n` +
                    `📍 ${branchName}\n\n` +
                    `Completa tu registro aquí:\n` +
                    `${joinUrl}\n\n` +
                    `Este enlace expira en 24 horas.`,
                branchName,
                companyName,
                role,
                joinUrl,
            };
        } catch (error) {
            console.error("[RegisterHandler] Error processing invite token:", error);
            return {
                success: false,
                message: "❌ Ocurrió un error al procesar tu invitación. Por favor intenta de nuevo más tarde.",
            };
        }
    }
}

export const registerHandler = new RegisterHandler();
