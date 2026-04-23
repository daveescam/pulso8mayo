import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import { eq, or, like } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

/**
 * Comprehensive reimport of ALL templates from JSON files
 * This script finds all JSON template files and updates matching database templates
 */

interface JsonTemplate {
    id: string;
    nombre: string;
    pasos: any[];
    [key: string]: any;
}

async function comprehensiveReimport() {
    console.log("📥 Starting comprehensive template reimport...\n");

    const templatesDir = path.join(process.cwd(), "templates");
    const jsonFiles: { path: string; template: JsonTemplate }[] = [];

    // Recursively find all JSON files
    function findJsonFiles(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                findJsonFiles(fullPath);
            } else if (file.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const template: JsonTemplate = JSON.parse(content);
                    jsonFiles.push({ path: fullPath, template });
                } catch (err) {
                    console.log(`⚠️  Skipping invalid JSON: ${file}`);
                }
            }
        }
    }

    findJsonFiles(templatesDir);
    console.log(`Found ${jsonFiles.length} JSON template files\n`);

    // Get all database templates
    const dbTemplates = await db.query.workflowTemplates.findMany();
    console.log(`Found ${dbTemplates.length} templates in database\n`);

    let updated = 0;
    let notFound = 0;

    for (const { path: jsonPath, template: jsonTemplate } of jsonFiles) {
        const fileName = path.basename(jsonPath);
        console.log(`\n📄 Processing: ${jsonTemplate.nombre || fileName}`);

        // Try to find matching template in database
        // Match by name containing the template name (case insensitive)
        const searchName = jsonTemplate.nombre.toLowerCase();
        const matchingTemplate = dbTemplates.find(t =>
            t.name?.toLowerCase().includes(searchName) ||
            t.name?.toLowerCase().includes(jsonTemplate.id.toLowerCase())
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

        console.log(`   ✅ Updated ${normalizedSteps.length} steps`);
        updated++;
    }

    console.log(`\n\n🎉 Reimport complete!`);
    console.log(`   Updated: ${updated} templates`);
    console.log(`   Not found: ${notFound} templates`);
    console.log(`   Remaining: ${dbTemplates.length - updated} templates without JSON files`);
}

comprehensiveReimport()
    .then(() => {
        console.log("\n✅ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
