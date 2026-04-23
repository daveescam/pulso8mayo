import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// Test different null handling
async function testNullHandling() {
    console.log("🔍 Testing Null Handling...\n");

    const companyId = '67404361-cc3c-4733-84bd-26e4ecab6dcc';

    // Test 1: Using eq with null (original - doesn't work)
    console.log("Test 1: eq(users.deletedAt, null)");
    const test1 = await db.query.users.findMany({
        where: and(
            eq(users.companyId, companyId),
            eq(users.deletedAt, null)
        ),
        columns: { id: true, name: true, email: true }
    });
    console.log(`Result: ${test1.length}\n`);

    // Test 2: Using isNull
    console.log("Test 2: isNull(users.deletedAt)");
    const test2 = await db.query.users.findMany({
        where: and(
            eq(users.companyId, companyId),
            isNull(users.deletedAt)
        ),
        columns: { id: true, name: true, email: true }
    });
    console.log(`Result: ${test2.length}\n`);

    // Test 3: Without deletedAt filter
    console.log("Test 3: Without deletedAt filter");
    const test3 = await db.query.users.findMany({
        where: eq(users.companyId, companyId),
        columns: { id: true, name: true, email: true, deletedAt: true }
    });
    console.log(`Result: ${test3.length}`);
    console.log(`Users:`, test3);

    // Test 4: Check if any users have deletedAt set
    console.log("\nTest 4: Check deletedAt values");
    const test4 = await db.query.users.findMany({
        where: eq(users.companyId, companyId),
        columns: { id: true, name: true, email: true, deletedAt: true }
    });
    test4.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.name} - deletedAt: ${u.deletedAt}`);
    });
}

testNullHandling().catch((err) => {
    console.error("Test Failed:", err);
    process.exit(1);
});
