import { NextRequest, NextResponse } from "next/server";
import { EmployeeDocumentService, DocumentUploadRequest } from "@/lib/services/employee-document-service";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";

/**
 * GET /api/documents
 * Get employee documents
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const userId = searchParams.get("userId");
        const documentId = searchParams.get("documentId");
        const documentType = searchParams.get("documentType");

        // Get specific document
        if (documentId) {
            const document = await EmployeeDocumentService.getDocument(documentId, tenant.id);
            if (!document) {
                return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
            }
            return NextResponse.json({ document });
        }

        // Get documents by type
        if (documentType) {
            const documents = await EmployeeDocumentService.getDocumentsByType(
                tenant.id,
                documentType as any
            );
            return NextResponse.json({ documents });
        }

        // Get employee documents (default to current user if no userId)
        const targetUserId = userId || session.user.id;
        const documents = await EmployeeDocumentService.getEmployeeDocuments(
            targetUserId,
            tenant.id
        );

        return NextResponse.json({ documents });
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

/**
 * POST /api/documents
 * Upload a new employee document
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const body = await req.json();
        const targetUserId = body.userId || session.user.id;

        // RBAC Check: Only ADMIN/GERENTE can upload for others
        if (targetUserId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "GERENTE") {
            return NextResponse.json({ error: "No tienes permiso para subir documentos de otros empleados" }, { status: 403 });
        }

        const uploadData: DocumentUploadRequest = {
            userId: targetUserId,
            companyId: tenant.id,
            branchId: body.branchId || session.user.branchId,
            documentType: body.documentType,
            documentName: body.documentName,
            documentUrl: body.documentUrl,
            fileKey: body.fileKey,
            fileSize: body.fileSize,
            mimeType: body.mimeType,
            uploadedBy: session.user.id,
            issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
            expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
            isRequired: body.isRequired,
            notes: body.notes
        };

        // Validate required fields
        if (!uploadData.documentType || !uploadData.documentName || !uploadData.documentUrl) {
            return NextResponse.json(
                { error: "documentType, documentName y documentUrl son requeridos" },
                { status: 400 }
            );
        }

        const document = await EmployeeDocumentService.uploadDocument(uploadData);
        return NextResponse.json({ success: true, document });
    } catch (error) {
        console.error("Error uploading document:", error);
        return NextResponse.json({ error: "Error al subir documento" }, { status: 500 });
    }
}

/**
 * DELETE /api/documents
 * Delete a document
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // RBAC Check: Only ADMIN/GERENTE can delete documents
        if (session.user.role !== "ADMIN" && session.user.role !== "GERENTE") {
            return NextResponse.json({ error: "No tienes permiso para eliminar documentos" }, { status: 403 });
        }

        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const documentId = searchParams.get("documentId");

        if (!documentId) {
            return NextResponse.json({ error: "documentId requerido" }, { status: 400 });
        }

        await EmployeeDocumentService.deleteDocument(documentId, tenant.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json({ error: "Error al eliminar documento" }, { status: 500 });
    }
}
