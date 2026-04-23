import { NextRequest, NextResponse } from "next/server";
import { BreakManagementService } from "@/lib/services/break-management-service";
import { auth } from "@/lib/auth";

/**
 * GET /api/breaks
 * Get breaks for current session or by session ID
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const action = searchParams.get("action");
        const sessionId = searchParams.get("sessionId");

        // Handle compliance check
        if (action === 'compliance' || req.nextUrl.pathname.endsWith('/compliance')) {
            if (!sessionId) {
                return NextResponse.json({ error: "sessionId requerido" }, { status: 400 });
            }

            const compliance = await BreakManagementService.checkBreakCompliance(sessionId);
            return NextResponse.json(compliance);
        }

        if (!sessionId) {
            // Get active session for user
            const { db } = await import("@/lib/db");
            const { shiftSessions } = await import("@/lib/db/schema");
            const { eq, and } = await import("drizzle-orm");

            const activeSession = await db.query.shiftSessions.findFirst({
                where: and(
                    eq(shiftSessions.userId, session.user.id),
                    eq(shiftSessions.status, 'ACTIVE')
                )
            });

            if (!activeSession) {
                return NextResponse.json({ error: "No hay sesión activa" }, { status: 400 });
            }

            const breaks = await BreakManagementService.getSessionBreaks(activeSession.id);
            return NextResponse.json({ breaks });
        }

        const breaks = await BreakManagementService.getSessionBreaks(sessionId);
        return NextResponse.json({ breaks });
    } catch (error) {
        console.error("Error fetching breaks:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

/**
 * POST /api/breaks
 * Start or end a break based on action parameter
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, type = 'STANDARD', action } = body;

        // Determine action from body or URL
        const actionType = action || (req.nextUrl.searchParams.get('action') || 'start');

        if (actionType === 'end') {
            // End break
            let targetSessionId = sessionId;

            if (!targetSessionId) {
                // Get active session
                const { db } = await import("@/lib/db");
                const { shiftSessions } = await import("@/lib/db/schema");
                const { eq, and } = await import("drizzle-orm");

                const activeSession = await db.query.shiftSessions.findFirst({
                    where: and(
                        eq(shiftSessions.userId, session.user.id),
                        eq(shiftSessions.status, 'ACTIVE')
                    )
                });

                if (!activeSession) {
                    return NextResponse.json({ error: "No hay sesión activa" }, { status: 400 });
                }

                targetSessionId = activeSession.id;
            }

            const breakSession = await BreakManagementService.endBreak(
                session.user.id,
                targetSessionId
            );

            return NextResponse.json({ success: true, break: breakSession });
        } else {
            // Start break (default)
            let targetSessionId = sessionId;

            if (!targetSessionId) {
                // Get active session
                const { db } = await import("@/lib/db");
                const { shiftSessions } = await import("@/lib/db/schema");
                const { eq, and } = await import("drizzle-orm");

                const activeSession = await db.query.shiftSessions.findFirst({
                    where: and(
                        eq(shiftSessions.userId, session.user.id),
                        eq(shiftSessions.status, 'ACTIVE')
                    )
                });

                if (!activeSession) {
                    return NextResponse.json({ error: "No hay sesión activa" }, { status: 400 });
                }

                targetSessionId = activeSession.id;
            }

            const breakSession = await BreakManagementService.startBreak(
                session.user.id,
                targetSessionId,
                type
            );

            return NextResponse.json({ success: true, break: breakSession });
        }
    } catch (error: any) {
        console.error("Error managing break:", error);
        return NextResponse.json({ error: error.message || "Error al gestionar break" }, { status: 400 });
    }
}
