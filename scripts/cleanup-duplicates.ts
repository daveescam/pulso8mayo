import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Clean up duplicate templates
 * For each group of duplicates, keep only the most recent one
 */

async function cleanupDuplicates() {
    console.log("🧹 Starting duplicate template cleanup...\n");

    const templates = await db.query.workflowTemplates.findMany({
        orderBy: (templates, { desc }) => [desc(templates.createdAt)]
    });

    console.log(`Found ${templates.length} total templates\n`);

    // Group by name
    const grouped = templates.reduce((acc, t) => {
        const name = t.name || 'Unnamed';
        if (!acc[name]) acc[name] = [];
        acc[name].push(t);
        return acc;
    }, {} as Record<string, any[]>);

    let totalDeleted = 0;
    const toDelete: string[] = [];

    // For each group with duplicates, mark older ones for deletion
    for (const [name, items] of Object.entries(grouped)) {
        if (items.length > 1) {
            console.log(`\n📋 ${name}: ${items.length} copies`);

            // Keep the first one (most recent due to sorting)
            const [keep, ...remove] = items;
            console.log(`   ✅ Keeping: ${keep.id} (${keep.createdAt?.toISOString().split('T')[0]})`);

            // Mark the rest for deletion
            for (const template of remove) {
                console.log(`   ❌ Deleting: ${template.id} (${template.createdAt?.toISOString().split('T')[0]})`);
                toDelete.push(template.id);
            }

            totalDeleted += remove.length;
        }
    }

    if (toDelete.length === 0) {
        console.log("\n✅ No duplicates found!");
        return;
    }

    console.log(`\n\n⚠️  About to delete ${toDelete.length} duplicate templates`);
    console.log("Proceeding in 3 seconds...\n");

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete duplicates
    for (const id of toDelete) {
        await db.delete(workflowTemplates).where(eq(workflowTemplates.id, id));
    }

    console.log(`\n🎉 Cleanup complete!`);
    console.log(`   Deleted: ${totalDeleted} duplicate templates`);
    console.log(`   Remaining: ${templates.length - totalDeleted} unique templates`);
}

cleanupDuplicates()
    .then(() => {
        console.log("\n✅ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
