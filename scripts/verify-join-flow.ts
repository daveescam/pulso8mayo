import { db } from "@/lib/db";
import { branches, companies, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Starting Join Flow Verification...");

    // 1. Cleanup previous test data (optional, but good for idempotency)
    // Skipped for safety, assume new random data.

    // 2. Create Company
    const companyName = `Test Company ${Date.now()}`;
    const [company] = await db.insert(companies).values({
        name: companyName,
        plan: "FREE"
    }).returning();
    console.log("Created Company:", company.id);

    // 3. Create Branch (Should generate inviteToken)
    const branchName = `Test Branch ${Date.now()}`;
    const [branch] = await db.insert(branches).values({
        name: branchName,
        companyId: company.id,
        address: "123 Test St",
        timezone: "America/Mexico_City"
    }).returning();

    console.log("Created Branch:", branch.id);
    console.log("Invite Token:", branch.inviteToken);

    if (!branch.inviteToken) {
        console.error("FAILED: Invite token was not generated!");
        process.exit(1);
    }

    // 4. Simulate Join API Call
    // We will call the API endpoint via fetch to test the full route handler
    const joinEmail = `join-test-${Date.now()}@example.com`;
    const joinPayload = {
        name: "Joining Employee",
        email: joinEmail,
        password: "password123",
        inviteToken: branch.inviteToken
    };

    console.log("Attempting to join with payload:", joinPayload);

    try {
        const response = await fetch("http://localhost:3000/api/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(joinPayload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error: ${response.status} ${text}`);
        }

        const data = await response.json();
        console.log("Join Success:", data);

        // 5. Verify User in DB
        const user = await db.query.users.findFirst({
            where: eq(users.email, joinEmail)
        });

        if (!user) throw new Error("User not found in DB");
        if (user.companyId !== company.id) throw new Error("User companyId mismatch");
        if (user.branchId !== branch.id) throw new Error("User branchId mismatch");
        if (user.role !== "EMPLEADO") throw new Error("User role mismatch");

        console.log("VERIFICATION PASSED: User correctly assigned to branch/company via token.");

    } catch (error: any) {
        console.error("VERIFICATION FAILED:", error);
        const fs = require('fs');
        fs.writeFileSync('scripts/error.log', JSON.stringify(error, Object.getOwnPropertyNames(error)) + '\n' + (error.message || '') + '\n' + (error.stack || ''));
        process.exit(1);
    }
}

main().catch(console.error);
