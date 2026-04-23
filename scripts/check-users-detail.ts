import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Check specific users
async function checkUsers() {
    console.log("🔍 Checking Specific Users...\n");

    // Check "el guero baynas" company users
    const companyId = '67404361-cc3c-4733-84bd-26e4ecab6dcc';
    
    const allUsers = await db.query.users.findMany({
        where: eq(users.companyId, companyId)
    });

    console.log(`Company: ${companyId}`);
    console.log(`Total users found: ${allUsers.length}\n`);

    allUsers.forEach((u, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  ID: ${u.id}`);
        console.log(`  Name: ${u.name}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  Role: ${u.role}`);
        console.log(`  CompanyId: ${u.companyId}`);
        console.log(`  DeletedAt: ${u.deletedAt}`);
        console.log('');
    });
}

checkUsers().catch((err) => {
    console.error("Check Failed:", err);
    process.exit(1);
});
