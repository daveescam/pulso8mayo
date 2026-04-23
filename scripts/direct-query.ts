import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// Direct SQL query to check users
async function directQuery() {
    console.log("🔍 Direct SQL Query...\n");

    try {
        // Get users with companyId using raw query
        const result = await db.execute(sql`
            SELECT id, name, email, role, company_id, deleted_at 
            FROM users 
            WHERE company_id IS NOT NULL 
            AND deleted_at IS NULL
            ORDER BY company_id, email
        `);

        const usersWithCompany = result.rows || [];
        
        console.log(`Total users with companyId (not deleted): ${usersWithCompany.length}\n`);

        // Group by company
        const companyMap = new Map();
        usersWithCompany.forEach((row: any) => {
            const companyId = row.company_id;
            if (!companyMap.has(companyId)) {
                companyMap.set(companyId, []);
            }
            companyMap.get(companyId).push(row);
        });

        console.log(`Users by company:`);
        for (const [companyId, users] of companyMap) {
            console.log(`\n  Company: ${companyId}`);
            console.log(`  User count: ${users.length}`);
            users.forEach((u: any, i: number) => {
                console.log(`    ${i + 1}. ${u.name} (${u.email}) - Role: ${u.role}`);
            });
        }

        // Specific company check
        const specificCompany = '67404361-cc3c-4733-84bd-26e4ecab6dcc';
        const specificResult = await db.execute(sql`
            SELECT id, name, email, role, company_id 
            FROM users 
            WHERE company_id = ${specificCompany}
            AND deleted_at IS NULL
        `);

        const specificUsers = specificResult.rows || [];

        console.log(`\n\n🎯 Specific Company Check (${specificCompany}):`);
        console.log(`Users found: ${specificUsers.length}`);
        specificUsers.forEach((u: any, i: number) => {
            console.log(`  ${i + 1}. ${u.name} (${u.email}) - ${u.role}`);
        });
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

directQuery().catch((err) => {
    console.error("Query Failed:", err);
    process.exit(1);
});
