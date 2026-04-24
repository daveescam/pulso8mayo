import { db } from "@/lib/db";
import { employeeAuditLogs } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'IMPORT';

export interface AuditLogRequest {
    userId: string; // The employee affected
    action: AuditAction;
    entityType: string; // 'PROFILE', 'CONTRACT', 'SALARY', 'DOCUMENT', 'ONBOARDING', etc.
    entityId?: string;
    fieldName?: string;
    oldValue?: unknown;
    newValue?: unknown;
    performedBy: string; // The user who performed the action
    reason?: string;
    isSensitive?: boolean;
    requiresApproval?: boolean;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditService {
    /**
     * Records an audit log entry for an employee-related action
     */
    static async logEmployeeAction(data: AuditLogRequest) {
        try {
            const [log] = await db.insert(employeeAuditLogs).values({
                userId: data.userId,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                fieldName: data.fieldName,
                oldValue: data.oldValue,
                newValue: data.newValue,
                performedBy: data.performedBy,
                reason: data.reason,
                isSensitive: data.isSensitive ?? false,
                requiresApproval: data.requiresApproval ?? false,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                performedAt: new Date(),
            }).returning();

            return log;
        } catch (error) {
            console.error("[AuditService] Failed to record audit log:", error);
            // We don't throw here to avoid failing the main operation if audit logging fails
            // though in some high-compliance systems you might want to.
            return null;
        }
    }

    /**
     * Helper to log a field change specifically
     */
    static async logFieldChange(
        userId: string,
        performedBy: string,
        entityType: string,
        entityId: string,
        fieldName: string,
        oldValue: unknown,
        newValue: unknown,
        isSensitive: boolean = false
    ) {
        return this.logEmployeeAction({
            userId,
            performedBy,
            action: 'UPDATE',
            entityType,
            entityId,
            fieldName,
            oldValue,
            newValue,
            isSensitive
        });
    }
}
