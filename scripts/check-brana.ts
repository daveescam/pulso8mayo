
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const email = "brana@prueba.com";
    console.log(`Checking user email: ${email}`);

    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (user) {
        console.log("✅ User Found:", user.id);
        console.log("🏢 Company ID:", user.companyId);
        console.log("🔑 Role:", user.role);
    } else {
        console.error("❌ User not found");
    }
    process.exit(0);
}

main();
