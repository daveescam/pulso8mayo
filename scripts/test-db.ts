
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Testing DB Connection...");
    try {
        const result = await db.execute(sql`SELECT 1 as res`);
        console.log("✅ DB Connection Successful:", result);
    } catch (e) {
        console.error("❌ DB Connection Failed:", e);
    }
    process.exit(0);
}

main();
