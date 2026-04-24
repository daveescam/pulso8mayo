import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shiftApprovals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/overtime/requests/[id]/approve
 * Approve an overtime request
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { comment } = body;
        
        const requestId = (await params).id;

        // Update request to approved
        const [updated] = await db
            .update(shiftApprovals)
            .set({
                status: 'APPROVED',
                approvedBy: session.user.id,
                approvedAt: new Date(),
                rejectionReason: comment || null,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(shiftApprovals.id, requestId),
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
        console.error('Error approving overtime request:', error);
        return NextResponse.json(
            { error: 'Error al aprobar solicitud' },
            { status: 500 }
        );
    }
}
