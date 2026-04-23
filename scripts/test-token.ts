import { db } from "@/lib/db";
import { branches, companies } from "@/lib/db/schema";

async function main() {
    const companyName = `Test Company ${Date.now()}`;
    const [company] = await db.insert(companies).values({
        name: companyName,
        plan: "FREE"
    }).returning();

    const branchName = `Test Branch ${Date.now()}`;
    const [branch] = await db.insert(branches).values({
        name: branchName,
        companyId: company.id,
        address: "123 Test St",
        timezone: "America/Mexico_City"
    }).returning();

    console.log("TOKEN_RESULT:" + branch.inviteToken);
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
