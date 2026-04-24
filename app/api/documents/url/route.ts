import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { employeeDocuments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generatePresignedUrl } from "@/lib/storage/r2-client";

/**
 * GET /api/documents/url
 * Generate presigned URL for document viewing
 */
export async function GET(req: NextRequest) {
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

        // Get document
        const [document] = await db.select()
            .from(employeeDocuments)
            .where(
                and(
                    eq(employeeDocuments.id, documentId),
                    eq(employeeDocuments.companyId, tenant.id)
                )
            )
            .limit(1);

        if (!document) {
            return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
        }

        // If document has fileKey, generate presigned URL
        if (document.fileKey) {
            try {
                const presignedUrl = await generatePresignedUrl(document.fileKey, 3600); // 1 hour
                return NextResponse.json({ url: presignedUrl });
            } catch (error) {
                console.error("Error generating presigned URL:", error);
                // Fallback to direct URL
                return NextResponse.json({ url: document.documentUrl });
            }
        }

        // Return direct URL if no fileKey
        return NextResponse.json({ url: document.documentUrl });
    } catch (error) {
        console.error("Error generating document URL:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
