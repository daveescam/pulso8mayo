import { NextRequest, NextResponse } from "next/server";
import { EmployeeDocumentService } from "@/lib/services/employee-document-service";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { users, employeeDocuments, branches } from "@/lib/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";

export interface EmployeeDocumentStatus {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    branchId: string | null;
    branchName: string | null;
    totalDocuments: number;
    validDocuments: number;
    pendingDocuments: number;
    expiredDocuments: number;
    missingRequired: string[];
    compliancePercentage: number;
    documents: Array<{
        id: string;
        documentType: string;
        documentName: string;
        status: string;
        isValid: boolean;
        expirationDate?: Date | null;
    }>;
}

/**
 * GET /api/documents/compliance
 * Get document compliance status for all employees in the company
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
        const branchId = searchParams.get("branchId");

        // If userId is provided, return compliance for that specific employee
        if (userId) {
            const documents = await EmployeeDocumentService.getEmployeeDocuments(userId, tenant.companyId);

            const validDocuments = documents.filter(d => d.isValid && d.status === 'VALIDATED').length;
            const pendingDocuments = documents.filter(d => d.status === 'PENDING').length;
            const expiredDocuments = documents.filter(d => d.status === 'EXPIRED' || !d.isValid).length;

            const requiredTypes = ['CONTRACT', 'ID', 'TAX_ID', 'BANK_INFO'];
            const existingTypes = new Set(
                documents
                    .filter(d => d.status === 'VALIDATED' && d.isValid)
                    .map(d => d.documentType)
            );
            const missingRequired = requiredTypes.filter(type => !existingTypes.has(type));

            const compliancePercentage = documents.length > 0
                ? Math.round((validDocuments / documents.length) * 100)
                : 0;

            return NextResponse.json({
                employee: {
                    userId,
                    totalDocuments: documents.length,
                    validDocuments,
                    pendingDocuments,
                    expiredDocuments,
                    missingRequired,
                    compliancePercentage,
                    documents: documents.map(d => ({
                        id: d.id,
                        documentType: d.documentType,
                        documentName: d.documentName,
                        status: d.status,
                        isValid: d.isValid,
                        expirationDate: d.expirationDate
                    }))
                }
            });
        }

        // Get all employees in the company, optionally filtered by branch
        const employeeConditions = [
            eq(users.companyId, tenant.companyId),
            isNull(users.deletedAt)
        ];

        if (branchId) {
            employeeConditions.push(eq(users.branchId, branchId));
        }

        const employees = await db.query.users.findMany({
            where: and(...employeeConditions),
            columns: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true
            }
        });

        // Get all documents for all employees
        const employeeIds = employees.map(e => e.id);

        let allDocuments: any[] = [];
        if (employeeIds.length > 0) {
            allDocuments = await db.query.employeeDocuments.findMany({
                where: and(
                    eq(employeeDocuments.companyId, tenant.companyId),
                    inArray(employeeDocuments.userId, employeeIds)
                )
            });
        }

        // Get branch info for employees
        const branchIds = [...new Set(employees.map(e => e.branchId).filter(Boolean))];
        let branchMap: Record<string, string> = {};
        if (branchIds.length > 0) {
            const branchList = await db.query.branches.findMany({
                where: inArray(branches.id, branchIds as string[]),
                columns: {
                    id: true,
                    name: true
                }
            });
            branchMap = Object.fromEntries(branchList.map(b => [b.id, b.name]));
        }

        // Build compliance status for each employee
        const requiredTypes = ['CONTRACT', 'ID', 'TAX_ID', 'BANK_INFO'];
        const employeeStatuses: EmployeeDocumentStatus[] = employees.map(employee => {
            const empDocs = allDocuments.filter(d => d.userId === employee.id);

            const validDocuments = empDocs.filter(d => d.isValid && d.status === 'VALIDATED').length;
            const pendingDocuments = empDocs.filter(d => d.status === 'PENDING').length;
            const expiredDocuments = empDocs.filter(d => d.status === 'EXPIRED' || !d.isValid).length;

            const existingTypes = new Set(
                empDocs
                    .filter(d => d.status === 'VALIDATED' && d.isValid)
                    .map(d => d.documentType)
            );
            const missingRequired = requiredTypes.filter(type => !existingTypes.has(type));

            const totalRequired = requiredTypes.length;
            const completedRequired = requiredTypes.filter(type => existingTypes.has(type)).length;
            const compliancePercentage = Math.round((completedRequired / totalRequired) * 100);

            return {
                userId: employee.id,
                userName: employee.name || employee.email,
                userEmail: employee.email,
                userRole: employee.role || 'EMPLEADO',
                branchId: employee.branchId || null,
                branchName: employee.branchId ? (branchMap[employee.branchId] || null) : null,
                totalDocuments: empDocs.length,
                validDocuments,
                pendingDocuments,
                expiredDocuments,
                missingRequired,
                compliancePercentage,
                documents: empDocs.map(d => ({
                    id: d.id,
                    documentType: d.documentType,
                    documentName: d.documentName,
                    status: d.status,
                    isValid: d.isValid,
                    expirationDate: d.expirationDate
                }))
            };
        });

        // Calculate overall stats
        const totalDocuments = allDocuments.length;
        const validDocuments = allDocuments.filter(d => d.isValid && d.status === 'VALIDATED').length;
        const pendingDocuments = allDocuments.filter(d => d.status === 'PENDING').length;
        const expiredDocuments = allDocuments.filter(d => d.status === 'EXPIRED' || !d.isValid).length;

        // Find all missing required documents across all employees
        const allMissingRequired: Array<{ userId: string; userName: string; documentType: string }> = [];
        for (const emp of employeeStatuses) {
            for (const docType of emp.missingRequired) {
                allMissingRequired.push({
                    userId: emp.userId,
                    userName: emp.userName,
                    documentType: docType
                });
            }
        }

        return NextResponse.json({
            employees: employeeStatuses,
            branches: Object.entries(branchMap).map(([id, name]) => ({ id, name })),
            summary: {
                totalEmployees: employees.length,
                totalDocuments,
                validDocuments,
                pendingDocuments,
                expiredDocuments,
                missingRequiredCount: allMissingRequired.length,
                overallCompliance: employeeStatuses.length > 0
                    ? Math.round(employeeStatuses.reduce((sum, emp) => sum + emp.compliancePercentage, 0) / employeeStatuses.length)
                    : 0
            }
        });
    } catch (error) {
        console.error("Error fetching document compliance:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
