import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import { like } from "drizzle-orm";

async function checkTemplate() {
    const templates = await db.query.workflowTemplates.findMany({
        where: like(workflowTemplates.name, "%Apertura de Turno%")
    });

    console.log(`Found ${templates.length} templates matching "Apertura de Turno"`);

    for (const template of templates) {
        console.log(`\n📋 Template: ${template.name}`);
        console.log(`   ID: ${template.id}`);
        const steps = (template as any).steps || [];
        console.log(`   Steps: ${steps.length}`);

        if (steps.length > 0) {
            console.log(`\n   First step:`);
            console.log(JSON.stringify(steps[0], null, 2));
        }
    }
}

checkTemplate()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
