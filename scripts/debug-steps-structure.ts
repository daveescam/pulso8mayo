import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";

/**
 * Debug script to check the structure of steps in the database
 */

async function checkStepsStructure() {
    console.log("🔍 Checking steps structure in database...\n");

    const templates = await db.query.workflowTemplates.findMany({
        limit: 3
    });

    for (const template of templates) {
        console.log(`\n📋 Template: ${template.name}`);
        console.log(`   ID: ${template.id}`);

        const steps = (template as any).steps || [];
        console.log(`   Steps count: ${steps.length}`);

        if (steps.length > 0) {
            console.log(`\n   First step structure:`);
            console.log(JSON.stringify(steps[0], null, 2));

            console.log(`\n   First step keys:`, Object.keys(steps[0]));

            console.log(`\n   Checking critical fields:`);
            console.log(`   - id: ${steps[0].id}`);
            console.log(`   - type: ${steps[0].type}`);
            console.log(`   - title: ${steps[0].title}`);
            console.log(`   - description: ${steps[0].description}`);
            console.log(`   - required: ${steps[0].required}`);
            console.log(`   - config: ${JSON.stringify(steps[0].config)}`);
            console.log(`   - aiVerification: ${JSON.stringify(steps[0].aiVerification)}`);
            console.log(`   - options: ${JSON.stringify(steps[0].options)}`);
        }

        console.log("\n" + "=".repeat(80));
    }
}

checkStepsStructure()
    .then(() => {
        console.log("\n✅ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
