import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shiftApprovals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/overtime/requests/[id]/reject
 * Reject an overtime request
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { reason } = body;

        if (!reason || reason.trim().length === 0) {
            return NextResponse.json(
                { error: 'La razón de rechazo es requerida' },
                { status: 400 }
            );
        }

        // Update request to rejected
        const [updated] = await db
            .update(shiftApprovals)
            .set({
                status: 'REJECTED',
                approvedBy: session.user.id,
                approvedAt: new Date(),
                rejectionReason: reason,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(shiftApprovals.id, params.id),
                    eq(shiftApprovals.status, 'PENDING')
                )
            )
            .returning();

        if (!updated) {
            return NextResponse.json(
                { error: 'Solicitud no encontrada o ya procesada' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            request: updated,
        });
    } catch (error) {
        console.error('Error rejecting overtime request:', error);
        return NextResponse.json(
            { error: 'Error al rechazar solicitud' },
            { status: 500 }
        );
    }
}
