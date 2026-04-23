import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

/**
 * Reimport templates from JSON files
 * This script reads the original JSON template files and updates the database
 * with the correct field mappings (label → title, fieldType → type)
 */

interface JsonTemplate {
    id: string;
    nombre: string;
    pasos: any[];
    [key: string]: any;
}

async function reimportTemplates() {
    console.log("📥 Starting template reimport from JSON files...\n");

    const templatesDir = path.join(process.cwd(), "templates");
    const jsonFiles: string[] = [];

    // Recursively find all JSON files
    function findJsonFiles(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                findJsonFiles(fullPath);
            } else if (file.endsWith('.json')) {
                jsonFiles.push(fullPath);
            }
        }
    }

    findJsonFiles(templatesDir);
    console.log(`Found ${jsonFiles.length} JSON template files\n`);

    let updated = 0;
    let notFound = 0;

    for (const jsonFile of jsonFiles) {
        const content = fs.readFileSync(jsonFile, 'utf-8');
        const jsonTemplate: JsonTemplate = JSON.parse(content);

        console.log(`📄 Processing: ${jsonTemplate.nombre || jsonTemplate.id}`);

        // Find matching template in database by checking if name contains the template name
        const dbTemplates = await db.query.workflowTemplates.findMany();
        const matchingTemplate = dbTemplates.find(t =>
            t.name?.includes(jsonTemplate.nombre) ||
            t.name?.includes(jsonTemplate.id)
        );

        if (!matchingTemplate) {
            console.log(`   ⚠️  No matching template found in database`);
            notFound++;
            continue;
        }

        console.log(`   ✓ Found match: ${matchingTemplate.name} (${matchingTemplate.id})`);

        // Convert JSON template steps to normalized format
        const normalizedSteps = (jsonTemplate.pasos || []).map((paso: any) => ({
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

        // Update template in database
        await db.update(workflowTemplates)
            .set({ steps: normalizedSteps })
            .where(eq(workflowTemplates.id, matchingTemplate.id));

        console.log(`   ✅ Updated ${normalizedSteps.length} steps\n`);
        updated++;
    }

    console.log(`\n🎉 Reimport complete!`);
    console.log(`   Updated: ${updated} templates`);
    console.log(`   Not found: ${notFound} templates`);
}

reimportTemplates()
    .then(() => {
        console.log("\n✅ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
