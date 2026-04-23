import { db } from "@/lib/db";
import { users, companies } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function checkEmployees() {
    console.log("🔍 Checking Database...\n");

    // Check companies
    const allCompanies = await db.select().from(companies);
    console.log(`📊 Companies found: ${allCompanies.length}`);
    allCompanies.forEach(c => {
        console.log(`  - ${c.name} (ID: ${c.id})`);
    });

    // Check all users
    const allUsers = await db.select().from(users);
    console.log(`\n👥 Total users: ${allUsers.length}`);

    // Group by company
    const usersWithCompany = allUsers.filter(u => u.companyId);
    const usersWithoutCompany = allUsers.filter(u => !u.companyId);
    const usersDeleted = allUsers.filter(u => u.deletedAt);

    console.log(`  - With companyId: ${usersWithCompany.length}`);
    console.log(`  - Without companyId: ${usersWithoutCompany.length}`);
    console.log(`  - Deleted (deletedAt set): ${usersDeleted.length}`);

    if (usersWithoutCompany.length > 0) {
        console.log("\n⚠️  Users WITHOUT companyId:");
        usersWithoutCompany.forEach(u => {
            console.log(`  - ${u.name} (${u.email}) - ID: ${u.id}`);
        });
    }

    if (usersDeleted.length > 0) {
        console.log("\n🗑️  Deleted users:");
        usersDeleted.forEach(u => {
            console.log(`  - ${u.name} (${u.email}) - Deleted: ${u.deletedAt}`);
        });
    }

    // Show users grouped by company
    if (allCompanies.length > 0) {
        console.log("\n📋 Users by company:");
        for (const company of allCompanies) {
            const companyUsers = allUsers.filter(u => u.companyId === company.id && !u.deletedAt);
            console.log(`\n  Company: ${company.name} (${company.id})`);
            console.log(`  Active users: ${companyUsers.length}`);
            companyUsers.forEach(u => {
                console.log(`    - ${u.name} (${u.email}) - Role: ${u.role}`);
            });
        }
    }

    console.log("\n✅ Check complete!");
}

checkEmployees().catch((err) => {
    console.error("Check Failed:", err);
    process.exit(1);
});
