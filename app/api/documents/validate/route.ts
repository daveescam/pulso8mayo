import { NextRequest, NextResponse } from "next/server";
import { EmployeeDocumentService } from "@/lib/services/employee-document-service";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";

/**
 * PATCH /api/documents/validate
 * Validate or reject a document
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const documentId = searchParams.get("documentId");

        if (!documentId) {
            return NextResponse.json({ error: "documentId requerido" }, { status: 400 });
        }

        const body = await req.json();
        const { status, rejectionReason, notes } = body;

        if (!status || !['VALIDATED', 'REJECTED', 'EXPIRED'].includes(status)) {
            return NextResponse.json(
                { error: "Status debe ser VALIDATED, REJECTED o EXPIRED" },
                { status: 400 }
            );
        }

        const document = await EmployeeDocumentService.validateDocument(
            documentId,
            tenant.companyId,
            {
                status,
                validatedBy: session.user.id,
                rejectionReason,
                notes
            }
        );

        if (!document) {
            return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ success: true, document });
    } catch (error) {
        console.error("Error validating document:", error);
        return NextResponse.json({ error: "Error al validar documento" }, { status: 500 });
    }
}

/**
 * GET /api/documents/compliance
 * Get document compliance report
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const branchId = searchParams.get("branchId");

        const report = await EmployeeDocumentService.generateComplianceReport(
            tenant.companyId,
            branchId || undefined
        );

        return NextResponse.json(report);
    } catch (error) {
        console.error("Error fetching compliance report:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
