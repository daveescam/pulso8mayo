
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const userId = "jxCyTHqCSwN7Qwo9056nCBbxPOHlanaO";
    console.log(`Checking user: ${userId}`);

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (user) {
        console.log("✅ User Found:", user.name);
        console.log("🏢 Company ID:", user.companyId);
        console.log("🔑 Role:", user.role);
    } else {
        console.error("❌ User not found");
    }
    process.exit(0);
}

main();
