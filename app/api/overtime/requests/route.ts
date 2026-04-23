import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shiftApprovals, users, branches } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/overtime/requests
 * Get overtime requests
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const userId = searchParams.get('userId');
        const branchId = searchParams.get('branchId');

        // Build conditions
        const conditions = [
            eq(shiftApprovals.approvalType, 'OVERTIME'),
        ];

        // Filter by status
        if (status) {
            conditions.push(eq(shiftApprovals.status, status as any));
        }

        // Filter by user (employee sees their own, manager sees all in their branch)
        if (userId) {
            conditions.push(eq(shiftApprovals.requestedFor, userId));
        }

        // Filter by branch
        if (branchId) {
            conditions.push(eq(shiftApprovals.branchId, branchId));
        }

        // Get overtime requests
        const requests = await db
            .select({
                id: shiftApprovals.id,
                userId: shiftApprovals.requestedFor,
                userName: users.name,
                userEmail: users.email,
                branchId: shiftApprovals.branchId,
                branchName: branches.name,
                title: shiftApprovals.title,
                description: shiftApprovals.description,
                reason: shiftApprovals.reason,
                startTime: shiftApprovals.startTime,
                endTime: shiftApprovals.endTime,
                durationMinutes: shiftApprovals.durationMinutes,
                overtimeMinutes: shiftApprovals.overtimeMinutes,
                status: shiftApprovals.status,
                approvedBy: shiftApprovals.approvedBy,
                approvedAt: shiftApprovals.approvedAt,
                rejectionReason: shiftApprovals.rejectionReason,
                createdAt: shiftApprovals.createdAt,
            })
            .from(shiftApprovals)
            .leftJoin(users, eq(shiftApprovals.requestedFor, users.id))
            .leftJoin(branches, eq(shiftApprovals.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(desc(shiftApprovals.createdAt));

        return NextResponse.json({ requests });
    } catch (error) {
        console.error('Error fetching overtime requests:', error);
        return NextResponse.json(
            { error: 'Error interno' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/overtime/requests
 * Create overtime request
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();

        const {
            branchId,
            title,
            description,
            reason,
            startTime,
            endTime,
            durationMinutes,
            overtimeMinutes,
        } = body;

        // Validate required fields
        if (!branchId || !title || !reason || !startTime || !endTime) {
            return NextResponse.json(
                { error: 'Campos requeridos faltantes' },
                { status: 400 }
            );
        }

        // Create overtime request
        const [request] = await db
            .insert(shiftApprovals)
            .values({
                companyId: session.user.companyId,
                branchId,
                approvalType: 'OVERTIME',
                requestedBy: session.user.id,
                requestedFor: session.user.id,
                title,
                description,
                reason,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                durationMinutes,
                overtimeMinutes,
                status: 'PENDING',
                notifiedAt: new Date(),
            })
            .returning();

        return NextResponse.json({
            success: true,
            request,
        });
    } catch (error) {
        console.error('Error creating overtime request:', error);
        return NextResponse.json(
            { error: 'Error al crear solicitud' },
            { status: 500 }
        );
    }
}
