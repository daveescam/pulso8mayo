import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

/**
 * Update ALL duplicate templates with correct data from JSON files
 */

async function updateAllDuplicates() {
    console.log("🔄 Updating all duplicate templates...\n");

    const templatesDir = path.join(process.cwd(), "templates");

    // Read the Apertura template JSON
    const aperturaJson = JSON.parse(
        fs.readFileSync(
            path.join(templatesDir, "operaciones_diarias/apertura-restaurante-v1.json"),
            'utf-8'
        )
    );

    // Find ALL templates with "Apertura de Turno" in the name
    const allAperturaTemplates = await db.query.workflowTemplates.findMany({
        where: like(workflowTemplates.name, "%Apertura de Turno%")
    });

    console.log(`Found ${allAperturaTemplates.length} "Apertura de Turno" templates\n`);

    // Convert JSON steps to normalized format
    const normalizedSteps = (aperturaJson.pasos || []).map((paso: any) => ({
        id: paso.id,
        type: paso.fieldType || paso.type || 'TextField',
        title: paso.label || paso.titulo || paso.title || 'Untitled Step',
        description: paso.descripcion || paso.description || '',
        required: paso.required ?? false,
        config: paso.extraAttributes || paso.config || {},
        validation: paso.validation || paso.validacion,
        aiVerification: paso.aiVerification || paso.verificacionIA,
        logicRules: paso.logicRules || paso.reglasLogica,
        options: paso.options || paso.opciones,
        readOnly: paso.static ?? paso.readOnly,
        placeholder: paso.placeholder,
        defaultValue: paso.defaultValue || paso.valorPorDefecto,
        conditionalLogic: paso.conditionalLogic || paso.logicaCondicional,
    }));

    console.log(`Normalized ${normalizedSteps.length} steps from JSON\n`);

    // Update ALL templates
    for (const template of allAperturaTemplates) {
        console.log(`Updating: ${template.name} (${template.id})`);

        await db.update(workflowTemplates)
            .set({ steps: normalizedSteps })
            .where(eq(workflowTemplates.id, template.id));

        console.log(`✅ Updated\n`);
    }

    console.log(`\n🎉 All ${allAperturaTemplates.length} templates updated!`);
}

updateAllDuplicates()
    .then(() => {
        console.log("\n✅ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
