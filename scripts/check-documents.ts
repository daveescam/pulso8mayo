import { db } from "@/lib/db";
import { users, employeeDocuments } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// Check documents for all companies
async function checkDocuments() {
    console.log("🔍 Checking Employee Documents...\n");

    const allDocs = await db.select().from(employeeDocuments);
    console.log(`📄 Total documents: ${allDocs.length}`);

    // Group by company
    const docsByCompany = new Map<string, any[]>();
    allDocs.forEach(doc => {
        const companyId = doc.companyId;
        if (!docsByCompany.has(companyId)) {
            docsByCompany.set(companyId, []);
        }
        docsByCompany.get(companyId)!.push(doc);
    });

    console.log(`\n📊 Documents by company:`);
    for (const [companyId, docs] of docsByCompany) {
        console.log(`  Company ${companyId}: ${docs.length} documents`);
    }

    // Check specific companies with users
    const companiesToCheck = [
        '5f50d24a-1f75-4848-b92d-8e73d1888337', // One of the seeded companies
        '3cbb87d8-4469-4d9f-a17e-860df62bf6fc', // los ruchois with david
        '35562b9f-9409-4ff1-90a0-2e00623cffae', // los jarochos
        '67404361-cc3c-4733-84bd-26e4ecab6dcc', // el guero baynas
        '4e9265ee-d50c-4ca8-bd8b-8b916ba1a1d1', // los jokos
    ];

    for (const companyId of companiesToCheck) {
        const companyUsers = await db.query.users.findMany({
            where: and(
                eq(users.companyId, companyId),
                eq(users.deletedAt, null)
            )
        });

        const companyDocs = allDocs.filter(d => d.companyId === companyId);

        console.log(`\n🏢 Company: ${companyId}`);
        console.log(`  Users: ${companyUsers.length}`);
        console.log(`  Documents: ${companyDocs.length}`);

        if (companyUsers.length > 0) {
            console.log(`  Users list:`);
            companyUsers.forEach(u => {
                const userDocs = companyDocs.filter(d => d.userId === u.id);
                console.log(`    - ${u.name} (${u.email}) - ${userDocs.length} docs`);
            });
        }
    }

    console.log("\n✅ Check complete!");
}

checkDocuments().catch((err) => {
    console.error("Check Failed:", err);
    process.exit(1);
});
