import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";

async function checkDeletedTemplates() {
    console.log("🔍 Checking remaining templates by company...\n");

    const templates = await db.query.workflowTemplates.findMany({
        orderBy: (templates, { asc }) => [asc(templates.companyId), asc(templates.name)]
    });

    console.log(`Total remaining templates: ${templates.length}\n`);

    // Group by companyId
    const byCompany = templates.reduce((acc, t) => {
        const companyId = t.companyId || 'NO_COMPANY';
        if (!acc[companyId]) acc[companyId] = [];
        acc[companyId].push(t);
        return acc;
    }, {} as Record<string, any[]>);

    console.log(`Companies found: ${Object.keys(byCompany).length}\n`);

    for (const [companyId, items] of Object.entries(byCompany)) {
        console.log(`\n📊 Company: ${companyId}`);
        console.log(`   Templates: ${items.length}`);

        // Group by name within company
        const byName = items.reduce((acc, t) => {
            const name = t.name || 'Unnamed';
            if (!acc[name]) acc[name] = 0;
            acc[name]++;
            return acc;
        }, {} as Record<string, number>);

        // Show duplicates within this company
        const duplicates = Object.entries(byName).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log(`   ⚠️  Duplicates within company:`);
            duplicates.forEach(([name, count]) => {
                console.log(`      - ${name}: ${count} copies`);
            });
        } else {
            console.log(`   ✅ No duplicates within company`);
        }
    }
}

checkDeletedTemplates()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
