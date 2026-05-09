import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { isNull, sql } from "drizzle-orm";

async function backfillManagerInviteTokens() {
  console.log("Backfilling managerInviteToken for branches that lack one...");

  const result = await db
    .update(branches)
    .set({
      managerInviteToken: sql`gen_random_uuid()`,
    })
    .where(isNull(branches.managerInviteToken))
    .returning({ id: branches.id });

  console.log(`Updated ${result.length} branches with new managerInviteToken`);
}

backfillManagerInviteTokens()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });