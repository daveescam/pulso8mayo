import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";

async function listAllTemplates() {
    const templates = await db.query.workflowTemplates.findMany({
        orderBy: (templates, { asc }) => [asc(templates.name)]
    });

    console.log(`\n📋 Total templates: ${templates.length}\n`);

    // Group by name to find duplicates
    const grouped = templates.reduce((acc, t) => {
        const name = t.name || 'Unnamed';
        if (!acc[name]) acc[name] = [];
        acc[name].push(t);
        return acc;
    }, {} as Record<string, any[]>);

    // Show duplicates
    console.log("🔍 Duplicate templates:\n");
    for (const [name, items] of Object.entries(grouped)) {
        if (items.length > 1) {
            console.log(`${name}: ${items.length} copies`);
            items.forEach((t, i) => {
                console.log(`  ${i + 1}. ID: ${t.id} | Created: ${t.createdAt?.toISOString().split('T')[0]}`);
            });
            console.log();
        }
    }

    // Show unique templates
    console.log("\n✅ Unique templates:\n");
    for (const [name, items] of Object.entries(grouped)) {
        if (items.length === 1) {
            console.log(`- ${name}`);
        }
    }
}

listAllTemplates()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
