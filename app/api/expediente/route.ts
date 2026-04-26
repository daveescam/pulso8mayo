import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { users, employeeProfiles, branches, employeeDocuments } from "@/lib/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

export interface EmployeeDocument {
    id: string;
    userId: string;
    documentType: string;
    documentName: string;
    status: string;
    expirationDate: string | null;
    isValid: boolean;
}

export interface ExpedienteEmployee {
    userId: string;
    name: string;
    email: string;
    employeeNumber: string | null;
    department: string | null;
    position: string | null;
    hireDate: string | null;
    rfc: string | null;
    curp: string | null;
    nss: string | null;
    branchName: string | null;
    totalDocuments: number;
    missingDocuments: string[];
    expiredDocuments: string[];
    compliancePercentage: number;
    documents: EmployeeDocument[];
}

const REQUIRED_DOCS = [
    { type: "CONTRACT", name: "Contrato de Trabajo" },
    { type: "ID", name: "Identificación (INE)" },
    { type: "TAX_ID", name: "RFC" },
    { type: "BANK_INFO", name: "Datos Bancarios" },
    { type: "PROOF_OF_ADDRESS", name: "Comprobante de Domicilio" },
    { type: "CERTIFICATE", name: "Certificado Médico" },
];

/**
 * GET /api/expediente
 * Get employee documents (expediente laboral) for compliance
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const branchId = searchParams.get("branchId");

        // Get all employees
        const conditions = [
            eq(users.companyId, tenant.id as string),
            isNull(users.deletedAt),
        ];

        if (branchId) {
            conditions.push(eq(users.branchId, branchId));
        }

        const employees = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                branchId: users.branchId,
                department: employeeProfiles.department,
                position: employeeProfiles.position,
                hireDate: employeeProfiles.hireDate,
                rfc: employeeProfiles.rfc,
                curp: employeeProfiles.curp,
                nss: employeeProfiles.nss,
                employeeNumber: employeeProfiles.employeeNumber,
            })
            .from(users)
            .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
            .where(and(...conditions));

        // Get all documents
        const userIds = employees.map(e => e.id);
        let allDocuments: any[] = [];
        if (userIds.length > 0) {
    allDocuments = await db.query.employeeDocuments.findMany({
      where: and(
        eq(employeeDocuments.companyId, tenant.id as string),
        inArray(employeeDocuments.userId, userIds)
      )
    });
        }

        // Get branch info
        const branchesAll = await db.query.branches.findMany({
            columns: { id: true, name: true }
        });
        const branchMap: Record<string, string> = Object.fromEntries(
            branchesAll.map(b => [b.id, b.name])
        );

        // Build compliance for each employee
        const employeeData = employees.map(emp => {
            const docs = allDocuments.filter(d => d.userId === emp.id);
            const existingTypes = new Set(docs.filter(d => d.isValid && d.status === "VALIDATED").map(d => d.documentType));

            const expired = docs
                .filter(d => d.status === "EXPIRED" || (d.expirationDate && new Date(d.expirationDate) < new Date()))
                .map(d => d.documentType);

            const missing = REQUIRED_DOCS
                .filter(r => !existingTypes.has(r.type))
                .map(r => r.name);

            const compliancePercentage = Math.round(
                (existingTypes.size / REQUIRED_DOCS.length) * 100
            );

            return {
                userId: emp.id,
                name: emp.name || emp.email,
                email: emp.email,
                employeeNumber: (emp as any).employeeNumber || null,
                department: (emp as any).department || null,
                position: (emp as any).position || null,
                hireDate: (emp as any).hireDate
                    ? new Date((emp as any).hireDate).toISOString()
                    : null,
                rfc: (emp as any).rfc || null,
                curp: (emp as any).curp || null,
                nss: (emp as any).nss || null,
                branchName: emp.branchId ? (branchMap[emp.branchId] || null) : null,
                totalDocuments: docs.length,
                missingDocuments: missing,
                expiredDocuments: expired,
                compliancePercentage,
                documents: docs.map(d => ({
                    id: d.id,
                    userId: d.userId,
                    documentType: d.documentType,
                    documentName: d.documentName,
                    status: d.status,
                    expirationDate: d.expirationDate
                        ? new Date(d.expirationDate).toISOString()
                        : null,
                    isValid: d.isValid,
                })),
            };
        });

        // Calculate summary
        const avgCompliance = employeeData.length > 0
            ? Math.round(employeeData.reduce((sum, e) => sum + e.compliancePercentage, 0) / employeeData.length)
            : 0;

        const totalMissing = employeeData.reduce((sum, e) => sum + e.missingDocuments.length, 0);
        const totalExpired = employeeData.reduce((sum, e) => sum + e.expiredDocuments.length, 0);

        return NextResponse.json({
            employees: userId
                ? employeeData.filter(e => e.userId === userId)
                : employeeData,
            summary: {
                totalEmployees: employees.length,
                avgCompliance,
                totalMissing,
                totalExpired,
            },
            requiredDocuments: REQUIRED_DOCS,
            branches: branchesAll,
        });
    } catch (error) {
        console.error("Error fetching expediente:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}