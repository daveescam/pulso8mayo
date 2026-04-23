import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";
import { z } from "zod";

const inviteSchema = z.object({
    branchId: z.string().uuid(),
    email: z.string().email(),
});

export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const body = await req.json();
        const { branchId, email } = inviteSchema.parse(body);

        // Get branch and verify it belongs to tenant
        const branch = await db.query.branches.findFirst({
            where: eq(branches.id, branchId),
        });

        if (!branch) {
            return ApiHandler.error(new Error("Branch not found"), 404);
        }

        if (branch.companyId !== tenant.id) {
            return ApiHandler.error(new Error("Unauthorized"), 403);
        }

        // Generate or get existing invite token
        const inviteToken = branch.inviteToken || crypto.randomUUID();

        if (!branch.inviteToken) {
            await db.update(branches)
                .set({ inviteToken })
                .where(eq(branches.id, branchId));
        }

        // Send email via Resend
        const resend = new Resend(process.env.RESEND_KEY);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const inviteUrl = `${baseUrl}/join/${inviteToken}?email=${encodeURIComponent(email)}`;

        console.log('[Invite Manager] Sending email to:', email);
        console.log('[Invite Manager] RESEND_KEY exists:', !!process.env.RESEND_KEY);
        console.log('[Invite Manager] Invite URL:', inviteUrl);

        const emailResult = await resend.emails.send({
            from: "Pulso <onboarding@resend.dev>",
            to: [email],
            subject: `Invitación para ser Gerente en ${branch.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>¡Te han invitado a unirte a Pulso!</h2>
                    <p>Has sido invitado como <strong>Gerente</strong> de la sucursal <strong>${branch.name}</strong>.</p>
                    <p>Para aceptar la invitación y crear tu cuenta, haz clic en el siguiente enlace:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${inviteUrl}"
                           style="background-color: #2563eb; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Aceptar Invitación
                        </a>
                    </p>
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${inviteUrl}</p>
                    <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        Si no esperabas esta invitación, puedes ignorar este correo.
                    </p>
                </div>
            `,
        });

        console.log('[Invite Manager] Resend response:', JSON.stringify(emailResult, null, 2));

        if (emailResult.error) {
            console.error('[Invite Manager] Resend error:', emailResult.error);
            throw new Error(`Failed to send email: ${emailResult.error.message || JSON.stringify(emailResult.error)}`);
        }

        return ApiHandler.success({ 
            message: "Invitation sent successfully",
            inviteToken 
        });
    } catch (error) {
        return ApiHandler.error(error);
    }
}
