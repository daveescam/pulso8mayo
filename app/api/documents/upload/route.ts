import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { employeeDocuments } from '@/lib/db/schema';
import { handleDocumentUpload } from '@/lib/storage/upload-handler';
import { requireTenant } from '@/lib/tenant-context';

/**
 * POST /api/documents/upload
 * Upload document to R2 storage
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenant = await requireTenant();
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const documentType = formData.get('documentType') as string;
        const documentName = formData.get('documentName') as string;
        const userId = formData.get('userId') as string || session.user.id;
        const companyId = tenant.id;
        const branchId = formData.get('branchId') as string;
        const issueDate = formData.get('issueDate') as string;
        const expirationDate = formData.get('expirationDate') as string;
        const isRequired = formData.get('isRequired') === 'true';
        const notes = formData.get('notes') as string;

        // RBAC Check: Only ADMIN/GERENTE can upload for others
        if (userId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "GERENTE") {
            return NextResponse.json({ error: "No tienes permiso para subir documentos de otros empleados" }, { status: 403 });
        }

        // Validate required fields
        if (!file || !documentType || !documentName) {
            return NextResponse.json(
                { error: 'file, documentType, and documentName are required' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to R2
        const uploadResult = await handleDocumentUpload({
            companyId,
            userId,
            documentType,
            fileName: file.name,
            file: buffer,
            mimeType: file.type,
        });

        // Save document record
        const [document] = await db
            .insert(employeeDocuments)
            .values({
                userId,
                companyId,
                branchId: branchId || null,
                documentType: documentType as any,
                documentName,
                documentUrl: uploadResult.url,
                fileKey: uploadResult.fileKey,
                fileSize: uploadResult.fileSize,
                mimeType: uploadResult.mimeType,
                uploadedBy: session.user.id,
                issueDate: issueDate ? new Date(issueDate) : null,
                expirationDate: expirationDate ? new Date(expirationDate) : null,
                isRequired,
                status: 'PENDING',
                notes: notes || null,
            })
            .returning();

        return NextResponse.json({
            success: true,
            document,
            url: uploadResult.url,
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
