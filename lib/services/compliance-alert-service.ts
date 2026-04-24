import { db } from '@/lib/db';
import {
    workflowTemplates,
    workflowInstances,
    complianceAlerts,
    branches,
    workflowSchedules,
} from '@/lib/db/schema';
import { eq, and, sql, gte, lte, inArray, desc } from 'drizzle-orm';

/**
 * Compliance Alert Service
 * Automatically evaluates compliance metrics and generates alerts
 * when scores fall below thresholds or deadlines are missed.
 */

// Configurable thresholds
const THRESHOLDS = {
    CRITICAL: 50,  // Score below 50 = CRITICAL alert
    WARNING: 70,   // Score below 70 = WARNING alert
    MISSING_DAYS: 7, // If a required daily workflow hasn't been executed in 7 days
};

interface CompanyBranch {
    companyId: string;
    branchId: string;
    branchName: string;
}

export class ComplianceAlertService {

    /**
     * Main entry point - evaluates all companies and generates alerts
     */
    async evaluateAndGenerateAlerts(): Promise<{
        alertsCreated: number;
        companiesChecked: number;
        errors: string[];
    }> {
        const errors: string[] = [];
        let alertsCreated = 0;
        let companiesChecked = 0;

        try {
            // Get all active branches with their companies
            const activeBranches = await db.query.branches.findMany({
                where: eq(branches.active, true),
                columns: { id: true, companyId: true, name: true }
            });

            // Group by company
            const companiesMap = new Map<string, CompanyBranch[]>();
            activeBranches.forEach(b => {
                if (!b.companyId) return;
                const existing = companiesMap.get(b.companyId) || [];
                existing.push({
                    companyId: b.companyId,
                    branchId: b.id,
                    branchName: b.name
                });
                companiesMap.set(b.companyId, existing);
            });

            for (const [companyId, companyBranches] of companiesMap) {
                try {
                    companiesChecked++;
                    const newAlerts = await this.evaluateCompany(companyId, companyBranches);
                    alertsCreated += newAlerts;
                } catch (err) {
                    errors.push(`Company ${companyId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            }

        } catch (err) {
            errors.push(`Global error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        return { alertsCreated, companiesChecked, errors };
    }

    /**
     * Evaluate a single company across all its branches
     */
    private async evaluateCompany(companyId: string, companyBranches: CompanyBranch[]): Promise<number> {
        let alertsCreated = 0;
        const branchIds = companyBranches.map(b => b.branchId);

        // 1. Check low compliance scores per branch
        alertsCreated += await this.checkLowScores(companyId, branchIds);

        // 2. Check missing required workflows
        alertsCreated += await this.checkMissingWorkflows(companyId, branchIds);

        // 3. Check missed schedule deadlines
        alertsCreated += await this.checkMissedDeadlines(companyId, branchIds);

        return alertsCreated;
    }

    /**
     * Check for branches with low compliance scores and generate alerts
     */
    private async checkLowScores(companyId: string, branchIds: string[]): Promise<number> {
        let created = 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get average scores per branch for the last 30 days
        const scoresByBranch = await db
            .select({
                branchId: workflowInstances.branchId,
                avgScore: sql<number>`AVG(${workflowInstances.score})`,
                totalCount: sql<number>`COUNT(*)`,
                complianceType: workflowTemplates.complianceType,
            })
            .from(workflowInstances)
            .innerJoin(
                workflowTemplates,
                eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`)
            )
            .where(
                and(
                    eq(workflowTemplates.companyId, companyId),
                    eq(workflowInstances.status, 'COMPLETED'),
                    gte(workflowInstances.completedAt, thirtyDaysAgo),
                    inArray(workflowInstances.branchId, branchIds)
                )
            )
            .groupBy(workflowInstances.branchId, workflowTemplates.complianceType);

        for (const row of scoresByBranch) {
            const avgScore = Math.round(Number(row.avgScore) || 0);
            const complianceType = row.complianceType || 'GENERAL';

            if (avgScore < THRESHOLDS.CRITICAL) {
                // Check for existing active alert for this branch/type
                const existing = await this.findExistingAlert(
                    companyId,
                    row.branchId,
                    'LOW_SCORE',
                    complianceType
                );

                if (!existing) {
                    await db.insert(complianceAlerts).values({
                        companyId,
                        branchId: row.branchId,
                        alertType: 'LOW_SCORE',
                        severity: 'CRITICAL',
                        title: `Compliance score crítico: ${avgScore}% (${complianceType})`,
                        description: `La tasa de cumplimiento para ${complianceType} está en ${avgScore}%, por debajo del umbral crítico de ${THRESHOLDS.CRITICAL}%. Se requiere atención inmediata.`,
                        complianceType,
                        currentScore: avgScore,
                        threshold: THRESHOLDS.CRITICAL,
                    });
                    created++;
                }
            } else if (avgScore < THRESHOLDS.WARNING) {
                const existing = await this.findExistingAlert(
                    companyId,
                    row.branchId,
                    'LOW_SCORE',
                    complianceType
                );

                if (!existing) {
                    await db.insert(complianceAlerts).values({
                        companyId,
                        branchId: row.branchId,
                        alertType: 'LOW_SCORE',
                        severity: 'WARNING',
                        title: `Compliance score bajo: ${avgScore}% (${complianceType})`,
                        description: `La tasa de cumplimiento para ${complianceType} está en ${avgScore}%, por debajo del umbral de advertencia de ${THRESHOLDS.WARNING}%.`,
                        complianceType,
                        currentScore: avgScore,
                        threshold: THRESHOLDS.WARNING,
                    });
                    created++;
                }
            }
        }

        return created;
    }

    /**
     * Check for required workflows that haven't been executed recently
     */
    private async checkMissingWorkflows(companyId: string, branchIds: string[]): Promise<number> {
        let created = 0;

        // Get all critical/required templates
        const criticalTemplates = await db.query.workflowTemplates.findMany({
            where: and(
                eq(workflowTemplates.companyId, companyId),
                eq(workflowTemplates.isCritical, true),
                eq(workflowTemplates.active, true)
            )
        });

        const missingDaysAgo = new Date();
        missingDaysAgo.setDate(missingDaysAgo.getDate() - THRESHOLDS.MISSING_DAYS);

        for (const template of criticalTemplates) {
            if (template.requiredFrequency === 'DAILY' || template.requiredFrequency === 'WEEKLY') {
                // Check if there are recent executions across any branch
                for (const branchId of branchIds) {
                    const recentExecution = await db
                        .select({ count: sql<number>`COUNT(*)` })
                        .from(workflowInstances)
                        .where(
                            and(
                                eq(workflowInstances.workflowTemplateId, template.id.toString()),
                                eq(workflowInstances.branchId, branchId),
                                gte(workflowInstances.createdAt, missingDaysAgo)
                            )
                        );

                    const count = Number(recentExecution[0]?.count || 0);
                    if (count === 0) {
                        const existing = await this.findExistingAlert(
                            companyId,
                            branchId,
                            'MISSING_WORKFLOW',
                            template.complianceType || undefined
                        );

                        if (!existing) {
                            await db.insert(complianceAlerts).values({
                                companyId,
                                branchId,
                                alertType: 'MISSING_WORKFLOW',
                                severity: 'WARNING',
                                title: `Workflow requerido sin ejecutar: ${template.name}`,
                                description: `El workflow "${template.name}" (${template.requiredFrequency}) no se ha ejecutado en los últimos ${THRESHOLDS.MISSING_DAYS} días. Frecuencia requerida: ${template.requiredFrequency}.`,
                                complianceType: template.complianceType,
                                workflowTemplateId: template.id,
                            });
                            created++;
                        }
                    }
                }
            }
        }

        return created;
    }

    /**
     * Check for missed scheduled deadlines
     */
    private async checkMissedDeadlines(companyId: string, branchIds: string[]): Promise<number> {
        let created = 0;

        // Find overdue schedules
        const now = new Date();
        const overdueSchedules = await db
            .select({
                id: workflowSchedules.id,
                title: workflowSchedules.title,
                branchId: workflowSchedules.branchId,
                nextExecutionAt: workflowSchedules.nextExecutionAt,
                templateId: workflowSchedules.templateId,
            })
            .from(workflowSchedules)
            .where(
                and(
                    eq(workflowSchedules.isActive, true),
                    lte(workflowSchedules.nextExecutionAt, now),
                    inArray(workflowSchedules.branchId, branchIds)
                )
            )
            .limit(50);

        for (const schedule of overdueSchedules) {
            const existing = await this.findExistingAlert(
                companyId,
                schedule.branchId,
                'MISSED_DEADLINE',
                undefined
            );

            if (!existing) {
                await db.insert(complianceAlerts).values({
                    companyId,
                    branchId: schedule.branchId,
                    alertType: 'MISSED_DEADLINE',
                    severity: 'WARNING',
                    title: `Deadline vencido: ${schedule.title}`,
                    description: `El workflow programado "${schedule.title}" tenía fecha de ejecución ${schedule.nextExecutionAt ? new Date(schedule.nextExecutionAt).toLocaleDateString() : 'N/A'} y no se ha completado.`,
                });
                created++;
            }
        }

        return created;
    }

    /**
     * Check if there's already an active alert for this combination
     */
    private async findExistingAlert(
        companyId: string,
        branchId: string,
        alertType: string,
        complianceType?: string
    ): Promise<boolean> {
        const conditions = [
            eq(complianceAlerts.companyId, companyId),
            eq(complianceAlerts.branchId, branchId),
            eq(complianceAlerts.alertType, alertType as any),
            eq(complianceAlerts.status, 'ACTIVE'),
        ];

        if (complianceType) {
            conditions.push(eq(complianceAlerts.complianceType, complianceType));
        }

        const existing = await db
            .select({ id: complianceAlerts.id })
            .from(complianceAlerts)
            .where(and(...conditions))
            .limit(1);

        return existing.length > 0;
    }

    /**
     * Auto-resolve alerts when compliance improves
     */
    async autoResolveAlerts(): Promise<number> {
        let resolved = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get all active LOW_SCORE alerts
        const activeAlerts = await db.query.complianceAlerts.findMany({
            where: and(
                eq(complianceAlerts.alertType, 'LOW_SCORE'),
                eq(complianceAlerts.status, 'ACTIVE')
            )
        });

        for (const alert of activeAlerts) {
            if (!alert.branchId || !alert.complianceType) continue;

            // Re-check score
            const currentScoreResult = await db
                .select({
                    avgScore: sql<number>`AVG(${workflowInstances.score})`,
                })
                .from(workflowInstances)
                .innerJoin(
                    workflowTemplates,
                    eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`)
                )
                .where(
                    and(
                        eq(workflowTemplates.companyId, alert.companyId),
                        eq(workflowInstances.branchId, alert.branchId),
                        eq(workflowTemplates.complianceType, alert.complianceType),
                        eq(workflowInstances.status, 'COMPLETED'),
                        gte(workflowInstances.completedAt, thirtyDaysAgo)
                    )
                );

            const currentScore = Math.round(Number(currentScoreResult[0]?.avgScore || 0));
            const threshold = alert.threshold || THRESHOLDS.WARNING;

            if (currentScore >= threshold) {
                await db
                    .update(complianceAlerts)
                    .set({
                        status: 'RESOLVED',
                        resolvedAt: new Date(),
                        resolutionNotes: `Auto-resolved: score improved to ${currentScore}%`,
                        updatedAt: new Date(),
                    })
                    .where(eq(complianceAlerts.id, alert.id));
                resolved++;
            }
        }

        return resolved;
    }
}

export const complianceAlertService = new ComplianceAlertService();
