import { db } from "../db";
import { 
    kpiDefinitions, 
    kpiHistory, 
    kpiAlerts,
    kpiMetricTypeEnum,
    kpiFrequencyEnum,
    kpiThresholdTypeEnum,
    kpiAlertStatusEnum
} from "../db/schema";
import { eq, and, desc, sql, gte, lte, isNull } from "drizzle-orm";

export interface CreateKpiInput {
    companyId: string;
    branchId?: string;
    name: string;
    description?: string;
    formula: string;
    metricType: typeof kpiMetricTypeEnum.enumValues[number];
    target?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
    thresholdType?: typeof kpiThresholdTypeEnum.enumValues[number];
    frequency?: typeof kpiFrequencyTypeEnum.enumValues[number];
    dataRetentionDays?: number;
    unit?: string;
    decimalPlaces?: number;
    category?: string;
    createdBy: string;
}

export interface UpdateKpiInput extends Partial<CreateKpiInput> {
    id: string;
    updatedBy: string;
}

export interface KpiValueResult {
    kpiId: string;
    value: number;
    formattedValue: string;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    target?: number;
    targetAchieved: boolean;
    metadata?: Record<string, unknown>;
}

export interface KpiDefinitionRow {
    id: string;
    companyId: string;
    branchId: string | null;
    name: string;
    description: string | null;
    formula: string;
    metricType: string;
    target: number | null;
    warningThreshold: number | null;
    criticalThreshold: number | null;
    thresholdType: string;
    frequency: string;
    dataRetentionDays: number;
    unit: string;
    decimalPlaces: number;
    category: string;
    active: boolean;
    isSystem: boolean;
    createdBy: string;
    updatedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * KPI Service - Manages KPI definitions, calculations, and alerts
 */
export class KpiService {
    
    /**
     * Create a new KPI definition
     */
    async createKpi(input: CreateKpiInput) {
        const [newKpi] = await db.insert(kpiDefinitions).values({
            ...input,
            branchId: input.branchId || null,
            thresholdType: input.thresholdType || 'TARGET',
            frequency: input.frequency || 'DAILY',
            dataRetentionDays: input.dataRetentionDays || 90,
            unit: input.unit || '',
            decimalPlaces: input.decimalPlaces || 2,
            category: input.category || 'OPERATIONS',
            active: true,
            isSystem: false,
        }).returning();
        
        return newKpi;
    }

    /**
     * Update an existing KPI definition
     */
    async updateKpi(input: UpdateKpiInput) {
        const { id, updatedBy, ...updates } = input;
        
        const [updatedKpi] = await db
            .update(kpiDefinitions)
            .set({
                ...updates,
                updatedBy,
                updatedAt: new Date(),
            })
            .where(eq(kpiDefinitions.id, id))
            .returning();
        
        return updatedKpi;
    }

    /**
     * Delete a KPI definition (only non-system KPIs)
     */
    async deleteKpi(kpiId: string, companyId: string) {
        // Check if KPI exists and is not a system KPI
        const [kpi] = await db
            .select()
            .from(kpiDefinitions)
            .where(
                and(
                    eq(kpiDefinitions.id, kpiId),
                    eq(kpiDefinitions.companyId, companyId),
                    eq(kpiDefinitions.isSystem, false)
                )
            )
            .limit(1);
        
        if (!kpi) {
            throw new Error('KPI not found or is a system KPI that cannot be deleted');
        }
        
        await db.delete(kpiDefinitions).where(eq(kpiDefinitions.id, kpiId));
        return true;
    }

    /**
     * Get KPI definition by ID
     */
    async getKpiById(kpiId: string, companyId: string) {
        const [kpi] = await db
            .select()
            .from(kpiDefinitions)
            .where(
                and(
                    eq(kpiDefinitions.id, kpiId),
                    eq(kpiDefinitions.companyId, companyId)
                )
            )
            .limit(1);
        
        return kpi;
    }

    /**
     * Get all KPIs for a company/branch
     */
    async getKpis(companyId: string, branchId?: string) {
        if (branchId) {
            // Get company-wide KPIs + branch-specific KPIs
            return await db
                .select()
                .from(kpiDefinitions)
                .where(
                    and(
                        eq(kpiDefinitions.companyId, companyId),
                        eq(kpiDefinitions.active, true)
                    )
                )
                .orderBy(desc(kpiDefinitions.createdAt));
        } else {
            // Get only company-wide KPIs
            return await db
                .select()
                .from(kpiDefinitions)
                .where(
                    and(
                        eq(kpiDefinitions.companyId, companyId),
                        isNull(kpiDefinitions.branchId),
                        eq(kpiDefinitions.active, true)
                    )
                )
                .orderBy(desc(kpiDefinitions.createdAt));
        }
    }

    /**
     * Get system KPIs (predefined KPIs)
     */
    async getSystemKpis(companyId: string, branchId?: string) {
        if (branchId) {
            return await db
                .select()
                .from(kpiDefinitions)
                .where(
                    and(
                        eq(kpiDefinitions.companyId, companyId),
                        eq(kpiDefinitions.isSystem, true),
                        eq(kpiDefinitions.active, true)
                    )
                )
                .orderBy(desc(kpiDefinitions.createdAt));
        } else {
            return await db
                .select()
                .from(kpiDefinitions)
                .where(
                    and(
                        eq(kpiDefinitions.companyId, companyId),
                        isNull(kpiDefinitions.branchId),
                        eq(kpiDefinitions.isSystem, true),
                        eq(kpiDefinitions.active, true)
                    )
                )
                .orderBy(desc(kpiDefinitions.createdAt));
        }
    }

    /**
     * Record a KPI value in history
     */
    async recordKpiValue(
        kpiId: string,
        value: number,
        periodStart: Date,
        periodEnd: Date,
        metadata?: Record<string, any>,
        branchId?: string
    ) {
        const kpi = await this.getKpiById(kpiId, branchId || '');
        if (!kpi) {
            throw new Error('KPI not found');
        }

        // Determine status based on thresholds
        const status = this.determineStatus(value, kpi);
        const targetAchieved = this.checkTargetAchieved(value, kpi);

        const [record] = await db.insert(kpiHistory).values({
            kpiId,
            branchId,
            value: Math.round(value * 100), // Store as integer (2 decimal places)
            rawValue: metadata ? JSON.stringify(metadata) : null,
            periodStart,
            periodEnd,
            status,
            target: kpi.target || null,
            targetAchieved,
            metadata,
        }).returning();

        // Check if alert should be triggered
        if (status === 'WARNING' || status === 'CRITICAL') {
            await this.triggerAlert(kpiId, value, status, branchId);
        }

        return record;
    }

    /**
     * Get KPI history for a period
     */
    async getKpiHistory(
        kpiId: string,
        startDate: Date,
        endDate: Date,
        branchId?: string
    ) {
        const conditions = [
            eq(kpiHistory.kpiId, kpiId),
            gte(kpiHistory.periodStart, startDate),
            lte(kpiHistory.periodEnd, endDate),
        ];

        if (branchId) {
            conditions.push(eq(kpiHistory.branchId, branchId));
        }

        return await db
            .select()
            .from(kpiHistory)
            .where(and(...conditions))
            .orderBy(kpiHistory.periodStart);
    }

    /**
     * Calculate current KPI value based on formula
     * This is a simplified implementation - in production, you'd parse and execute the formula
     */
    async calculateKpiValue(kpi: KpiDefinitionRow, branchId?: string): Promise<KpiValueResult> {
        // This is a placeholder - actual implementation would parse the formula
        // and execute it against the database
        
        // For now, return a mock calculation
        const mockValue = Math.random() * 100;
        const status = this.determineStatus(mockValue, kpi);
        const targetAchieved = this.checkTargetAchieved(mockValue, kpi);

        return {
            kpiId: kpi.id,
            value: mockValue,
            formattedValue: this.formatValue(mockValue, kpi.metricType, kpi.unit, kpi.decimalPlaces),
            status,
            target: kpi.target || undefined,
            targetAchieved,
            metadata: {},
        };
    }

    /**
     * Determine status based on thresholds
     */
    private determineStatus(value: number, kpi: KpiDefinitionRow): 'NORMAL' | 'WARNING' | 'CRITICAL' {
        const { thresholdType, warningThreshold, criticalThreshold, target } = kpi;

        if (thresholdType === 'MIN') {
            if (criticalThreshold && value < criticalThreshold) return 'CRITICAL';
            if (warningThreshold && value < warningThreshold) return 'WARNING';
        } else if (thresholdType === 'MAX') {
            if (criticalThreshold && value > criticalThreshold) return 'CRITICAL';
            if (warningThreshold && value > warningThreshold) return 'WARNING';
        } else if (thresholdType === 'TARGET' && target) {
            const warningRange = warningThreshold || (target * 0.1); // 10% by default
            const criticalRange = criticalThreshold || (target * 0.2); // 20% by default
            
            if (value < target - criticalRange || value > target + criticalRange) return 'CRITICAL';
            if (value < target - warningRange || value > target + warningRange) return 'WARNING';
        }

        return 'NORMAL';
    }

    /**
     * Check if target is achieved
     */
    private checkTargetAchieved(value: number, kpi: KpiDefinitionRow): boolean {
        if (!kpi.target) return true;
        
        const { thresholdType, warningThreshold } = kpi;
        
        if (thresholdType === 'MIN') {
            return value >= kpi.target;
        } else if (thresholdType === 'MAX') {
            return value <= kpi.target;
        } else {
            const tolerance = warningThreshold || (kpi.target * 0.05); // 5% tolerance
            return Math.abs(value - kpi.target) <= tolerance;
        }
    }

    /**
     * Format KPI value for display
     */
    private formatValue(value: number, metricType: string, unit: string, decimalPlaces: number): string {
        const formatted = value.toFixed(decimalPlaces);
        
        if (metricType === 'PERCENTAGE') {
            return `${formatted}%`;
        } else if (metricType === 'TIME') {
            return `${formatted} ${unit || 'hrs'}`;
        } else if (metricType === 'COUNT' || metricType === 'SUM') {
            return `${formatted} ${unit || 'units'}`;
        }
        
        return `${formatted} ${unit || ''}`;
    }

    /**
     * Trigger an alert for a KPI
     */
    private async triggerAlert(kpiId: string, value: number, status: 'WARNING' | 'CRITICAL', branchId?: string) {
        const kpi = await this.getKpiById(kpiId, branchId || '');
        if (!kpi) return;

        const threshold = status === 'CRITICAL' ? kpi.criticalThreshold : kpi.warningThreshold;
        
        await db.insert(kpiAlerts).values({
            kpiId,
            branchId,
            alertType: status,
            status: 'ACTIVE',
            triggeredValue: Math.round(value * 100),
            threshold: threshold || 0,
            title: `${kpi.name} - ${status} Alert`,
            message: `${kpi.name} has reached ${status} status with value ${value.toFixed(2)}. Threshold: ${threshold}`,
            notificationSent: false,
        });
    }

    /**
     * Get active alerts
     */
    async getActiveAlerts(companyId: string, branchId?: string) {
        // This would need a join with kpiDefinitions to filter by companyId
        // For now, return all active alerts
        const conditions = [eq(kpiAlerts.status, 'ACTIVE')];
        
        if (branchId) {
            conditions.push(eq(kpiAlerts.branchId, branchId));
        }

        return await db
            .select()
            .from(kpiAlerts)
            .where(and(...conditions))
            .orderBy(desc(kpiAlerts.createdAt));
    }

    /**
     * Acknowledge an alert
     */
    async acknowledgeAlert(alertId: string, userId: string) {
        const [updated] = await db
            .update(kpiAlerts)
            .set({
                status: 'ACKNOWLEDGED',
                acknowledgedBy: userId,
                acknowledgedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(kpiAlerts.id, alertId))
            .returning();
        
        return updated;
    }

    /**
     * Resolve an alert
     */
    async resolveAlert(alertId: string, userId: string, resolutionNotes: string) {
        const [updated] = await db
            .update(kpiAlerts)
            .set({
                status: 'RESOLVED',
                resolvedBy: userId,
                resolvedAt: new Date(),
                resolutionNotes,
                updatedAt: new Date(),
            })
            .where(eq(kpiAlerts.id, alertId))
            .returning();
        
        return updated;
    }
}

export const kpiService = new KpiService();
