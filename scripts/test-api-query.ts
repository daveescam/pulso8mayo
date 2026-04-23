import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// Test exact query from API
async function testAPIQuery() {
    console.log("🔍 Testing Exact API Query...\n");

    const companyId = '67404361-cc3c-4733-84bd-26e4ecab6dcc';

    // Exact query from the API
    const employees = await db.query.users.findMany({
        where: and(
            eq(users.companyId, companyId),
            isNull(users.deletedAt)
        ),
        columns: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });

    console.log(`Query Result:`);
    console.log(`Employees found: ${employees.length}`);
    employees.forEach((emp, i) => {
        console.log(`  ${i + 1}. ${emp.name} (${emp.email}) - ${emp.role}`);
    });
}

testAPIQuery().catch((err) => {
    console.error("Test Failed:", err);
    process.exit(1);
});
