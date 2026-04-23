import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import * as fs from "fs";
import * as path from "path";

/**
 * Clean database and reimport ONLY the templates from JSON files
 * This ensures the platform has exactly the templates the user wants
 */

interface JsonTemplate {
    id: string;
    nombre: string;
    descripcion?: string;
    categoria?: string;
    tipo?: string;
    pasos: any[];
    complianceConfig?: any;
    [key: string]: any;
}

async function cleanAndReimport() {
    console.log("🔍 Step 1: Getting company ID for system templates...\n");

    // Get the first company ID (system templates need a companyId)
    const companies = await db.query.companies.findMany({ limit: 1 });
    if (companies.length === 0) {
        console.error("❌ No companies found in database. Please create a company first.");
        process.exit(1);
    }
    const systemCompanyId = companies[0].id;
    console.log(`✅ Using company: ${companies[0].name} (${systemCompanyId})\n`);

    console.log("🗑️  Step 2: Deleting all existing templates from database...\n");

    // Delete all templates
    const deleted = await db.delete(workflowTemplates);
    console.log(`✅ Deleted all existing templates\n`);

    console.log("📥 Step 3: Importing templates from JSON files...\n");

    const templatesDir = path.join(process.cwd(), "templates");
    const jsonFiles: { path: string; category: string; template: JsonTemplate }[] = [];

    // Recursively find all JSON files
    function findJsonFiles(dir: string, category: string = '') {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                // Use directory name as category
                findJsonFiles(fullPath, file);
            } else if (file.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const template: JsonTemplate = JSON.parse(content);
                    jsonFiles.push({ path: fullPath, category, template });
                } catch (err) {
                    console.log(`⚠️  Skipping invalid JSON: ${file}`);
                }
            }
        }
    }

    findJsonFiles(templatesDir);
    console.log(`Found ${jsonFiles.length} JSON template files\n`);

    // Category mapping to Spanish
    const categoryMap: Record<string, string> = {
        'atencion_cliente': 'Atención al Cliente',
        'compliance': 'Cumplimiento Normativo',
        'control_calidad': 'Control de Calidad',
        'mantenimiento': 'Mantenimiento',
        'operaciones': 'Operaciones',
        'operaciones_diarias': 'Operaciones Diarias',
        'recursos_humanos': 'Recursos Humanos',
        'seguridad': 'Seguridad'
    };

    let imported = 0;

    for (const { path: jsonPath, category, template: jsonTemplate } of jsonFiles) {
        const fileName = path.basename(jsonPath);
        console.log(`📄 Importing: ${jsonTemplate.nombre || fileName}`);

        // Convert JSON template steps to normalized format
        const normalizedSteps = (jsonTemplate.pasos || []).map((paso: any) => ({
            id: paso.id,
            type: paso.type || paso.fieldType || 'TextField',
            title: paso.title || paso.label || paso.titulo || 'Untitled Step',
            description: paso.description || paso.descripcion || '',
            required: paso.required ?? false,
            config: paso.config || paso.extraAttributes || {},
            validation: paso.validation || paso.validacion,
            aiVerification: paso.aiVerification || paso.verificacionIA,
            logicRules: paso.logicRules || paso.reglasLogica,
            options: paso.options || paso.opciones,
            readOnly: paso.readOnly ?? paso.static,
            placeholder: paso.placeholder,
            defaultValue: paso.defaultValue || paso.valorPorDefecto,
            conditionalLogic: paso.conditionalLogic || paso.logicaCondicional,
            branches: paso.branches,
        }));

        // Create new template in database
        // Using first company ID for system templates (they'll be available to all companies)
        await db.insert(workflowTemplates).values({
            id: crypto.randomUUID(),
            name: jsonTemplate.nombre,
            description: jsonTemplate.descripcion || '',
            category: categoryMap[category] || category || 'General',
            steps: normalizedSteps,
            complianceType: jsonTemplate.complianceConfig?.complianceType,
            regulationSection: jsonTemplate.complianceConfig?.regulationSection,
            requiredFrequency: jsonTemplate.complianceConfig?.requiredFrequency,
            isCritical: jsonTemplate.complianceConfig?.criticalForCompliance ?? false,
            active: jsonTemplate.activo ?? true,
            companyId: systemCompanyId, // Use first company ID
            branchId: null,  // Available to all branches
        });

        console.log(`   ✅ Imported with ${normalizedSteps.length} steps`);
        imported++;
    }

    console.log(`\n\n🎉 Import complete!`);
    console.log(`   Imported: ${imported} templates`);
    console.log(`   Categories: ${Object.keys(categoryMap).length}`);
}

cleanAndReimport()
    .then(() => {
        console.log("\n✅ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
