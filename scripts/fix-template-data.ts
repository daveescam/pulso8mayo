import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

/**
 * This script fixes template data by re-importing from JSON files
 * Problem: Templates were saved with title:"Untitled Step" instead of using the label field
 * Solution: Read JSON templates and update database with correct field mappings
 */

async function fixTemplateData() {
    console.log("🔧 Starting template data fix...");

    const templatesDir = path.join(process.cwd(), "templates");

    // Get all existing templates from database
    const existingTemplates = await db.query.workflowTemplates.findMany();
    console.log(`Found ${existingTemplates.length} templates in database`);

    let fixed = 0;
    let skipped = 0;

    for (const template of existingTemplates) {
        const steps = (template as any).steps || [];

        // Check if template needs fixing (has "Untitled Step" titles)
        const needsFix = steps.some((s: any) => s.title === "Untitled Step");

        if (!needsFix) {
            console.log(`✓ Skipping ${template.name} - already has correct data`);
            skipped++;
            continue;
        }

        console.log(`🔄 Fixing ${template.name}...`);

        // Map field names from JSON format to normalized format
        const fixedSteps = steps.map((step: any) => ({
            ...step,
            // Use label if available, otherwise keep title
            title: step.label || step.title,
            // Use fieldType if available, otherwise keep type  
            type: step.fieldType || step.type,
            // Merge config and extraAttributes
            config: { ...(step.config || {}), ...(step.extraAttributes || {}) },
            // Map static to readOnly
            readOnly: step.static ?? step.readOnly
        }));

        // Update template in database
        await db.update(workflowTemplates)
            .set({ steps: fixedSteps })
            .where(eq(workflowTemplates.id, template.id));

        console.log(`✅ Fixed ${template.name} - updated ${fixedSteps.length} steps`);
        fixed++;
    }

    console.log(`\n🎉 Fix complete!`);
    console.log(`   Fixed: ${fixed} templates`);
    console.log(`   Skipped: ${skipped} templates`);
}

fixTemplateData()
    .then(() => {
        console.log("✅ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
