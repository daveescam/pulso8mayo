import { db } from "@/lib/db";
import { employeeDocuments, users } from "@/lib/db/schema";
import { eq, and, or, lt, gte, lte, desc, inArray, ilike } from "drizzle-orm";
import { AuditService } from "./audit-service";
import { employeeOnboarding, onboardingSteps } from "@/lib/db/schema";

export type DocumentType = 
    | 'CONTRACT' 
    | 'ID' 
    | 'PROOF_OF_ADDRESS' 
    | 'TAX_ID' 
    | 'BANK_INFO'
    | 'CERTIFICATE' 
    | 'TRAINING' 
    | 'MEDICAL_EXAM' 
    | 'PERMIT' 
    | 'OTHER';

export type DocumentStatus = 'PENDING' | 'VALIDATED' | 'EXPIRED' | 'REJECTED';

export interface EmployeeDocument {
    id: string;
    userId: string;
    companyId: string;
    branchId: string | null;
    documentType: DocumentType;
    documentName: string;
    documentUrl: string;
    fileKey?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    uploadedBy: string;
    issueDate?: Date | null;
    expirationDate?: Date | null;
    isValid: boolean;
    status: DocumentStatus;
    validatedBy?: string | null;
    validatedAt?: Date | null;
    rejectionReason?: string | null;
    notes?: string | null;
    isRequired: boolean;
    complianceNotes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentUploadRequest {
    userId: string;
    companyId: string;
    branchId?: string;
    documentType: DocumentType;
    documentName: string;
    documentUrl: string;
    fileKey?: string;
    fileSize?: number;
    mimeType?: string;
    uploadedBy: string;
    issueDate?: Date;
    expirationDate?: Date;
    isRequired?: boolean;
    notes?: string;
}

export interface DocumentValidationRequest {
    status: DocumentStatus;
    validatedBy: string;
    rejectionReason?: string;
    notes?: string;
}

export interface DocumentComplianceReport {
    totalDocuments: number;
    validDocuments: number;
    expiredDocuments: number;
    pendingDocuments: number;
    rejectedDocuments: number;
    missingRequiredDocuments: Array<{
        userId: string;
        userName: string;
        documentType: DocumentType;
    }>;
    expiringSoonDocuments: Array<{
        id: string;
        userId: string;
        userName: string;
        documentType: DocumentType;
        expirationDate: Date;
        daysUntilExpiration: number;
    }>;
}

export class EmployeeDocumentService {
    /**
     * Upload a new employee document
     */
    static async uploadDocument(data: DocumentUploadRequest): Promise<EmployeeDocument> {
        const [document] = await db.insert(employeeDocuments).values({
            userId: data.userId,
            companyId: data.companyId,
            branchId: data.branchId,
            documentType: data.documentType,
            documentName: data.documentName,
            documentUrl: data.documentUrl,
            fileKey: data.fileKey,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            uploadedBy: data.uploadedBy,
            issueDate: data.issueDate,
            expirationDate: data.expirationDate,
            isValid: !data.expirationDate || data.expirationDate > new Date(),
            status: 'PENDING',
            isRequired: data.isRequired ?? false,
            notes: data.notes
        }).returning();


        if (document) {
            await AuditService.logEmployeeAction({
                userId: data.userId,
                performedBy: data.uploadedBy,
                action: 'CREATE',
                entityType: 'DOCUMENT',
                entityId: document.id,
                newValue: { 
                    type: data.documentType, 
                    name: data.documentName,
                    url: data.documentUrl 
                }
            });
        }

        return document as EmployeeDocument;
    }

    /**
     * Get documents for a specific employee
     */
    static async getEmployeeDocuments(userId: string, companyId: string): Promise<EmployeeDocument[]> {
        const documents = await db.query.employeeDocuments.findMany({
            where: and(
                eq(employeeDocuments.userId, userId),
                eq(employeeDocuments.companyId, companyId)
            ),
            orderBy: [desc(employeeDocuments.createdAt)]
        });

        return documents as EmployeeDocument[];
    }

    /**
     * Get a specific document by ID
     */
    static async getDocument(documentId: string, companyId: string): Promise<EmployeeDocument | null> {
        const document = await db.query.employeeDocuments.findFirst({
            where: and(
                eq(employeeDocuments.id, documentId),
                eq(employeeDocuments.companyId, companyId)
            )
        });

        return document as EmployeeDocument | null;
    }

    /**
     * Validate or reject a document
     */
    static async validateDocument(
        documentId: string,
        companyId: string,
        validationData: DocumentValidationRequest
    ): Promise<EmployeeDocument | null> {
        const updateData: any = {
            status: validationData.status,
            validatedBy: validationData.validatedBy,
            validatedAt: new Date(),
            rejectionReason: validationData.rejectionReason,
            notes: validationData.notes,
            isValid: validationData.status === 'VALIDATED'
        };

        if (validationData.status === 'EXPIRED') {
            updateData.isValid = false;
        }

        const [document] = await db.update(employeeDocuments).set(updateData)
            .where(and(
                eq(employeeDocuments.id, documentId),
                eq(employeeDocuments.companyId, companyId)
            ))
            .returning();

        if (document) {
            // 1. Audit Log
            await AuditService.logEmployeeAction({
                userId: document.userId,
                performedBy: validationData.validatedBy,
                action: 'UPDATE',
                entityType: 'DOCUMENT',
                entityId: document.id,
                fieldName: 'status',
                oldValue: 'PENDING',
                newValue: validationData.status,
                reason: validationData.rejectionReason || validationData.notes
            });

            // 2. Automate Onboarding Progress
            if (validationData.status === 'VALIDATED') {
                await this.syncOnboardingStatus(document.userId, document.documentType, validationData.validatedBy);
            }
        }

        return document as EmployeeDocument | null;
    }

    /**
     * Helper to sync onboarding status based on document validation
     */
    private static async syncOnboardingStatus(userId: string, docType: DocumentType, performedBy: string) {
        try {
            // Mapping document types to possible step names
            const typeToStepName: Record<string, string[]> = {
                'ID': ['Upload identification documents', 'Provide ID', 'Identificación Oficial'],
                'CONTRACT': ['Sign employment contract', 'Firmar contrato'],
                'TAX_ID': ['Complete tax forms', 'Upload RFC', 'RFC'],
                'BANK_INFO': ['Provide bank information', 'Datos Bancarios'],
                'PROOF_OF_ADDRESS': ['Provide proof of address', 'Comprobante de domicilio']
            };

            const possibleStepNames = typeToStepName[docType];
            if (!possibleStepNames) return;

            // Find an active onboarding for this user
            const onboarding = await db.query.employeeOnboarding.findFirst({
                where: and(
                    eq(employeeOnboarding.userId, userId),
                    eq(employeeOnboarding.status, 'IN_PROGRESS')
                )
            });

            if (!onboarding) return;

            // Look for a step matching the criteria
            for (const stepName of possibleStepNames) {
                const step = await db.query.onboardingSteps.findFirst({
                    where: and(
                        eq(onboardingSteps.onboardingId, onboarding.id),
                        ilike(onboardingSteps.stepName, `%${stepName}%`),
                        eq(onboardingSteps.status, 'PENDING')
                    )
                });

                if (step) {
                    console.log(`[Lifecycle] Automatically completing onboarding step: ${step.stepName} for user: ${userId}`);
                    
                    // Complete the step
                    await db.update(onboardingSteps).set({
                        status: 'COMPLETED',
                        completedDate: new Date(),
                        completedBy: performedBy,
                        updatedAt: new Date()
                    }).where(eq(onboardingSteps.id, step.id));

                    // Recalculate onboarding progress
                    const allSteps = await db.select().from(onboardingSteps).where(eq(onboardingSteps.onboardingId, onboarding.id));
                    const completedSteps = allSteps.filter(s => s.status === 'COMPLETED').length;
                    const progressPercentage = Math.round((completedSteps / allSteps.length) * 100);

                    await db.update(employeeOnboarding).set({
                        completedSteps,
                        progressPercentage,
                        status: progressPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
                        completedDate: progressPercentage === 100 ? new Date() : undefined,
                        updatedAt: new Date()
                    }).where(eq(employeeOnboarding.id, onboarding.id));

                    // Break after completing one step per document type validation
                    break;
                }
            }
        } catch (error) {
            console.error("[Lifecycle] Failed to sync onboarding status:", error);
        }
    }

    /**
     * Check document expiration and update status
     */
    static async checkDocumentExpiration(): Promise<void> {
        const now = new Date();

        // Mark expired documents
        await db.update(employeeDocuments).set({
            status: 'EXPIRED',
            isValid: false
        }).where(and(
            lt(employeeDocuments.expirationDate, now),
            eq(employeeDocuments.isValid, true)
        ));
    }

    /**
     * Get documents expiring soon
     */
    static async getExpiringDocuments(
        companyId: string,
        daysThreshold: number = 30
    ): Promise<EmployeeDocument[]> {
        const now = new Date();
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

        const documents = await db.query.employeeDocuments.findMany({
            where: and(
                eq(employeeDocuments.companyId, companyId),
                gte(employeeDocuments.expirationDate, now),
                lte(employeeDocuments.expirationDate, thresholdDate),
                eq(employeeDocuments.isValid, true)
            ),
            orderBy: [employeeDocuments.expirationDate]
        });

        return documents as EmployeeDocument[];
    }

    /**
     * Get missing required documents for all employees
     */
    static async getMissingRequiredDocuments(companyId: string, branchId?: string): Promise<
        Array<{
            userId: string;
            userName: string;
            documentType: DocumentType;
        }>
    > {
        // Get all required document types (this could be configurable per company)
        const requiredTypes: DocumentType[] = [
            'CONTRACT',
            'ID',
            'TAX_ID',
            'BANK_INFO'
        ];

        // Get all employees in the company
        const employees = await db.query.users.findMany({
            where: eq(users.companyId, companyId),
            columns: {
                id: true,
                name: true,
                email: true
            }
        });

        const missingDocuments: Array<{
            userId: string;
            userName: string;
            documentType: DocumentType;
        }> = [];

        for (const employee of employees) {
            // Get employee's validated documents
            const existingDocs = await db.query.employeeDocuments.findMany({
                where: and(
                    eq(employeeDocuments.userId, employee.id),
                    eq(employeeDocuments.companyId, companyId),
                    eq(employeeDocuments.status, 'VALIDATED'),
                    eq(employeeDocuments.isValid, true)
                ),
                columns: {
                    documentType: true
                }
            });

            const existingTypes = new Set(existingDocs.map(d => d.documentType));

            // Check which required documents are missing
            for (const docType of requiredTypes) {
                if (!existingTypes.has(docType)) {
                    missingDocuments.push({
                        userId: employee.id,
                        userName: employee.name || employee.email,
                        documentType: docType
                    });
                }
            }
        }

        return missingDocuments;
    }

    /**
     * Generate compliance report
     */
    static async generateComplianceReport(
        companyId: string,
        branchId?: string
    ): Promise<DocumentComplianceReport> {
        // Get all documents for the company
        const conditions = [eq(employeeDocuments.companyId, companyId)];
        if (branchId) {
            conditions.push(eq(employeeDocuments.branchId, branchId));
        }

        const documents = await db.query.employeeDocuments.findMany({
            where: and(...conditions)
        });

        // Calculate statistics
        const validDocuments = documents.filter(d => d.isValid && d.status === 'VALIDATED').length;
        const expiredDocuments = documents.filter(d => d.status === 'EXPIRED' || !d.isValid).length;
        const pendingDocuments = documents.filter(d => d.status === 'PENDING').length;
        const rejectedDocuments = documents.filter(d => d.status === 'REJECTED').length;

        // Get missing required documents
        const missingRequired = await this.getMissingRequiredDocuments(companyId, branchId);

        // Get expiring soon documents (next 30 days)
        const expiringDocs = await this.getExpiringDocuments(companyId, 30);
        
        const expiringSoon = expiringDocs.map(doc => {
            const daysUntilExpiration = Math.floor(
                (doc.expirationDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            
            return {
                id: doc.id,
                userId: doc.userId,
                userName: doc.userId, // Will be populated separately
                documentType: doc.documentType,
                expirationDate: doc.expirationDate!,
                daysUntilExpiration
            };
        });

        return {
            totalDocuments: documents.length,
            validDocuments,
            expiredDocuments,
            pendingDocuments,
            rejectedDocuments,
            missingRequiredDocuments: missingRequired,
            expiringSoonDocuments: expiringSoon
        };
    }

    /**
     * Delete a document
     */
    static async deleteDocument(documentId: string, companyId: string, performedBy?: string): Promise<void> {
        const doc = await this.getDocument(documentId, companyId);
        
        await db.delete(employeeDocuments)
            .where(and(
                eq(employeeDocuments.id, documentId),
                eq(employeeDocuments.companyId, companyId)
            ));

        if (doc && performedBy) {
            await AuditService.logEmployeeAction({
                userId: doc.userId,
                performedBy: performedBy,
                action: 'DELETE',
                entityType: 'DOCUMENT',
                entityId: documentId,
                oldValue: { type: doc.documentType, name: doc.documentName }
            });
        }
    }

    /**
     * Get documents by type
     */
    static async getDocumentsByType(
        companyId: string,
        documentType: DocumentType
    ): Promise<EmployeeDocument[]> {
        const documents = await db.query.employeeDocuments.findMany({
            where: and(
                eq(employeeDocuments.companyId, companyId),
                eq(employeeDocuments.documentType, documentType)
            ),
            orderBy: [desc(employeeDocuments.expirationDate)]
        });

        return documents as EmployeeDocument[];
    }

    /**
     * Mark document as required
     */
    static async markAsRequired(documentId: string, companyId: string): Promise<EmployeeDocument | null> {
        const [document] = await db.update(employeeDocuments).set({
            isRequired: true
        }).where(and(
            eq(employeeDocuments.id, documentId),
            eq(employeeDocuments.companyId, companyId)
        )).returning();

        return document as EmployeeDocument | null;
    }
}
