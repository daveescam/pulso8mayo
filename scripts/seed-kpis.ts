/**
 * Seed script for predefined HORECA KPIs
 * Run with: pnpm tsx scripts/seed-kpis.ts
 */

import { db } from "../lib/db/db";
import { kpiDefinitions } from "../lib/db/schema";
import { sql } from "drizzle-orm";

// System user ID for seeding (should be replaced with actual system user)
const SYSTEM_USER_ID = "system";

// Predefined KPIs for HORECA industry
const predefinedKpis = [
    // Compliance KPIs
    {
        name: "Compliance Rate",
        description: "Percentage of workflows completed with full compliance",
        formula: "(completed_workflows / total_workflows) * 100",
        metricType: "PERCENTAGE" as const,
        category: "COMPLIANCE" as const,
        target: 95,
        warningThreshold: 90,
        criticalThreshold: 80,
        thresholdType: "MIN" as const,
        frequency: "DAILY" as const,
        unit: "%",
        decimalPlaces: 2,
        isSystem: true,
    },
    {
        name: "NOM-251 Compliance",
        description: "Compliance rate for NOM-251 hygiene and food safety standards",
        formula: "(nom251_completed / nom251_total) * 100",
        metricType: "PERCENTAGE" as const,
        category: "COMPLIANCE" as const,
        target: 100,
        warningThreshold: 95,
        criticalThreshold: 90,
        thresholdType: "MIN" as const,
        frequency: "WEEKLY" as const,
        unit: "%",
        decimalPlaces: 2,
        isSystem: true,
    },
    {
        name: "NOM-035 Compliance",
        description: "Compliance rate for NOM-035 psychosocial risk prevention",
        formula: "(nom035_completed / nom035_total) * 100",
        metricType: "PERCENTAGE" as const,
        category: "COMPLIANCE" as const,
        target: 100,
        warningThreshold: 95,
        criticalThreshold: 85,
        thresholdType: "MIN" as const,
        frequency: "MONTHLY" as const,
        unit: "%",
        decimalPlaces: 2,
        isSystem: true,
    },
    
    // Operations KPIs
    {
        name: "Average Workflow Completion Time",
        description: "Average time taken to complete workflows",
        formula: "SUM(completion_time) / COUNT(completed_workflows)",
        metricType: "TIME" as const,
        category: "OPERATIONS" as const,
        target: 30,
        warningThreshold: 40,
        criticalThreshold: 60,
        thresholdType: "MAX" as const,
        frequency: "DAILY" as const,
        unit: "min",
        decimalPlaces: 1,
        isSystem: true,
    },
    {
        name: "Workflow Completion Rate",
        description: "Percentage of workflows completed on time",
        formula: "(on_time_workflows / total_workflows) * 100",
        metricType: "PERCENTAGE" as const,
        category: "OPERATIONS" as const,
        target: 90,
        warningThreshold: 80,
        criticalThreshold: 70,
        thresholdType: "MIN" as const,
        frequency: "DAILY" as const,
        unit: "%",
        decimalPlaces: 2,
        isSystem: true,
    },
    {
        name: "Overdue Workflows",
        description: "Number of workflows past due date",
        formula: "COUNT(overdue_workflows)",
        metricType: "COUNT" as const,
        category: "OPERATIONS" as const,
        target: 0,
        warningThreshold: 5,
        criticalThreshold: 10,
        thresholdType: "MAX" as const,
        frequency: "REALTIME" as const,
        unit: "workflows",
        decimalPlaces: 0,
        isSystem: true,
    },
    
    // Inventory KPIs
    {
        name: "Stock Out Rate",
        description: "Percentage of items out of stock",
        formula: "(out_of_stock_items / total_items) * 100",
        metricType: "PERCENTAGE" as const,
        category: "INVENTORY" as const,
        target: 0,
        warningThreshold: 5,
        criticalThreshold: 10,
        thresholdType: "MAX" as const,
        frequency: "DAILY" as const,
        unit: "%",
        decimalPlaces: 2,
        isSystem: true,
    },
    {
        name: "Inventory Accuracy",
        description: "Accuracy of inventory records vs physical count",
        formula: "(accurate_items / total_items) * 100",
        metricType: "PERCENTAGE" as const,
        category: "INVENTORY" as const,
        target: 98,
        warningThreshold: 95,
        criticalThreshold: 90,
        thresholdType: "MIN" as const,
        frequency: "WEEKLY" as const,
        unit: "%",
        decimalPlaces: 2,
        isSystem: true,
    },
    {
        name: "Expired Items Rate",
        description: "Percentage of items expired before use",
        formula: "(expired_items / total_items_used) * 100",
        metricType: "PERCENTAGE" as const,
        category: "INVENTORY" as const,
        target: 0,
        warningThreshold: 2,
        criticalThreshold: 5,
        thresholdType: "MAX" as const,
        frequency: "WEEKLY" as const,
        unit: "%",
        decimalPlaces: 2,
        isSystem: true,
    },
    
    // Labor KPIs
    {
        name: "Attendance Rate",
        description: "Percentage of scheduled shifts attended",
        formula: "(attended_shifts / scheduled_shifts) * 100",
        metricType: "PERCENTAGE" as const,
        category: "LABOR" as const,
        target: 95,
        warningThreshold: 90,
        criticalThreshold: 85,
        thresholdType: "MIN" as const,
        frequency: "WEEKLY" as const,
        unit: "%",
        decimalPlaces: 2,
        isSystem: true,
    },
    {
        name: "Overtime Hours",
        description: "Total overtime hours worked",
        formula: "SUM(overtime_hours)",
        metricType: "TIME" as const,
        category: "LABOR" as const,
        target: 10,
        warningThreshold: 20,
        criticalThreshold: 40,
        thresholdType: "MAX" as const,
        frequency: "WEEKLY" as const,
        unit: "hrs",
        decimalPlaces: 1,
        isSystem: true,
    },
    {
        name: "Break Compliance Rate",
        description: "Percentage of employees taking required breaks",
        formula: "(compliant_breaks / total_breaks) * 100",
        metricType: "PERCENTAGE" as const,
        category: "LABOR" as const,
        target: 100,
        warningThreshold: 95,
        criticalThreshold: 85,
        thresholdType: "MIN" as const,
        frequency: "DAILY" as const,
        unit: "%",
        decimalPlaces: 2,
        isSystem: true,
    },
];

async function seedKpis() {
    try {
        console.log("🌱 Seeding KPI definitions...");

        // Clear existing system KPIs (optional - for re-seeding)
        // await db.delete(kpiDefinitions).where(sql`is_system = true`);

        // Insert predefined KPIs
        const kpisToInsert = predefinedKpis.map((kpi) => ({
            ...kpi,
            companyId: sql`(SELECT id FROM companies LIMIT 1)`, // Use first company
            branchId: null, // Company-wide KPIs
            createdBy: SYSTEM_USER_ID,
            updatedBy: SYSTEM_USER_ID,
            active: true,
        }));

        const inserted = await db.insert(kpiDefinitions).values(kpisToInsert).returning();

        console.log(`✅ Successfully seeded ${inserted.length} KPIs:`);
        inserted.forEach((kpi) => {
            console.log(`  - ${kpi.name} (${kpi.category})`);
        });

        console.log("\n🎉 KPI seeding completed!");
    } catch (error) {
        console.error("❌ Error seeding KPIs:", error);
        process.exit(1);
    }
}

// Only run if executed directly
if (require.main === module) {
    seedKpis().finally(() => process.exit(0));
}

export { seedKpis };
