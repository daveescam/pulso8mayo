
import { db } from "@/lib/db";
import { companies, branches, users, plannedShifts, magicLinks } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🌱 Starting Seed...");

    // 1. Create Company
    const [company] = await db.insert(companies).values({
        name: "Restaurante El Sabor Mx",
        plan: "PRO",
        taxId: "GME123456789"
    }).returning();
    console.log(`✅ Company Created: ${company.name}`);

    // 2. Create Branches
    const [branch1] = await db.insert(branches).values({
        companyId: company.id,
        name: "Sucursal Centro",
        address: "Av. Reforma 123, CDMX",
        timezone: "America/Mexico_City",
        active: true
    }).returning();

    const [branch2] = await db.insert(branches).values({
        companyId: company.id,
        name: "Sucursal Norte",
        address: "Plaza Satelite, Local 45",
        timezone: "America/Mexico_City",
        active: true
    }).returning();
    console.log(`✅ Branches Created: ${branch1.name}, ${branch2.name}`);

    // 3. Create Users (Employees)
    // We map 'role' (permission) and 'jobTitle' (shift role)
    const employees = [
        { name: "Carlos Dueño", email: "carlos@elsabor.mx", role: "ADMIN", branchId: branch1.id },
        { name: "Ana Gerente", email: "ana@elsabor.mx", role: "GERENTE", branchId: branch1.id },
        { name: "Luis Cocinero", email: "luis@elsabor.mx", role: "EMPLEADO", jobTitle: "COCINERO", branchId: branch1.id },
        { name: "Maria Mesera", email: "maria@elsabor.mx", role: "EMPLEADO", jobTitle: "MESERO", branchId: branch1.id },
        { name: "Pedro Cajero", email: "pedro@elsabor.mx", role: "EMPLEADO", jobTitle: "CAJERO", branchId: branch1.id },
        { name: "Sofia Repartidora", email: "sofia@elsabor.mx", role: "EMPLEADO", jobTitle: "REPARTIDOR", branchId: branch2.id },
    ];

    const createdUsers = [];
    for (const emp of employees) {
        const [user] = await db.insert(users).values({
            id: crypto.randomUUID(),
            name: emp.name,
            email: emp.email,
            emailVerified: true,
            role: emp.role as any, // Cast to avoid strict enum check during seed
            companyId: company.id,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();
        createdUsers.push({ ...user, jobTitle: (emp as any).jobTitle, targetBranch: emp.branchId });
    }
    console.log(`✅ Users Created: ${createdUsers.length}`);

    // 4. Create Shifts for Current Week
    const today = new Date();
    // Start of current week (Monday)
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setTime(monday.getTime() + 12 * 60 * 60 * 1000); // Noon

    const shiftData = [];

    // Assign shifts to employees with a jobTitle
    const targetEmployees = createdUsers.filter(u => u.jobTitle);

    for (let i = 0; i < 5; i++) { // Mon-Fri
        const currentDay = new Date(monday);
        currentDay.setDate(monday.getDate() + i);

        for (const emp of targetEmployees) {
            // Shift 9 AM - 5 PM
            const start = new Date(currentDay);
            start.setHours(9, 0, 0);
            const end = new Date(currentDay);
            end.setHours(17, 0, 0);

            shiftData.push({
                branchId: emp.targetBranch,
                userId: emp.id,
                role: emp.jobTitle as any,
                startTime: start,
                endTime: end,
                status: 'PUBLISHED'
            });
        }
    }

    if (shiftData.length > 0) {
        await db.insert(plannedShifts).values(shiftData);
    }
    console.log(`✅ Shifts Created: ${shiftData.length}`);
    console.log("🌱 Seed Complete!");
}

main().catch((err) => {
    console.error("Seed Failed:", err);
    const fs = require('fs');
    fs.writeFileSync('scripts/seed-error.log', JSON.stringify(err, null, 2) + '\\n' + (err.message || '') + '\\n' + (err.stack || ''));
    process.exit(1);
});
