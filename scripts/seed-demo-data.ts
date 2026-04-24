import { db } from "@/lib/db";
import {
    companies, branches, users, workflowTemplates, workflowInstances,
    inventoryItems, inventoryBatches, kpiDefinitions, kpiHistory,
    employeeDocuments, plannedShifts, shiftSessions
} from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { subDays, addHours, startOfDay } from "date-fns";

async function main() {
    console.log("🚀 Iniciando Gran Seed de Demo Data MVP...");

    // 1. Empresa y Sucursales
    const [company] = await db.insert(companies).values({
        name: "Demo Global HORECA",
        plan: "ENTERPRISE",
        taxId: "DEMO123456789"
    }).returning();

    const [branch1, branch2] = await db.insert(branches).values([{
        companyId: company.id, name: "Sucursal Condesa", address: "Av. Michoacán 123", timezone: "America/Mexico_City", active: true
    }, {
        companyId: company.id, name: "Sucursal Polanco", address: "Masaryk 45", timezone: "America/Mexico_City", active: true
    }]).returning();
    console.log(`✅ Base y Sucursales Establecidas`);

    // 2. Usuarios del MVP
    const employeesData = [
        { name: "Admin Global", email: "admin@demo.mx", role: "ADMIN", branchId: branch1.id },
        { name: "Gerente Condesa", email: "gerente1@demo.mx", role: "GERENTE", branchId: branch1.id },
        { name: "Carlos Cocina", email: "carlos@demo.mx", role: "EMPLEADO", branchId: branch1.id },
        { name: "Ana Mesera", email: "ana@demo.mx", role: "EMPLEADO", branchId: branch1.id }
    ];

    const usersList = [];
    for (const emp of employeesData) {
        const [user] = await db.insert(users).values({
            id: crypto.randomUUID(),
            name: emp.name, email: emp.email, emailVerified: true,
            role: emp.role as any, companyId: company.id, branchId: emp.branchId,
            createdAt: new Date(), updatedAt: new Date()
        }).returning();
        usersList.push(user);
    }
    console.log(`✅ Empleados RH Registrados`);

    // 3. Documentos (Expediente Laboral HR)
    const docs = [];
    for (const u of usersList) {
        docs.push({
            userId: u.id, companyId: company.id, branchId: u.branchId,
            documentType: "ID", documentName: `INE_${u.name}`, documentUrl: "https://r2.cloudflare.com/ine_placeholder.pdf",
            status: "VALIDATED", uploadedBy: u.id, issueDate: subDays(new Date(), 100)
        });
        docs.push({
            userId: u.id, companyId: company.id, branchId: u.branchId,
            documentType: "CONTRACT", documentName: `Contrato_Base_${u.name}`, documentUrl: "https://r2.cloudflare.com/contrato.pdf",
            status: "VALIDATED", uploadedBy: u.id, issueDate: subDays(new Date(), 50)
        });
    }
    await db.insert(employeeDocuments).values(docs as any);
    console.log(`✅ Expediente (Documentos Compliance) listos`);

    // 4. Labor: Asistencia, Turnos y Horas Extras (Últimos 7 días)
    const shiftsAndSessions = [];
    for (let i = 1; i <= 7; i++) {
        const day = subDays(new Date(), i);
        // Turno Carlos (Cocina) 8:00 a 16:00
        const carlosShift = await db.insert(plannedShifts).values({
            userId: usersList[2].id, branchId: branch1.id, role: "COCINERO",
            shiftDate: day.toISOString().split('T')[0], startTime: "08:00", endTime: "16:00", status: "PUBLISHED"
        }).returning();
        
        // Simular The Check In / Out
        const checkIn = addHours(startOfDay(day), 8); // 8:00
        const checkOut = addHours(startOfDay(day), 17); // 17:00 (1 hora de overtime!)

        await db.insert(shiftSessions).values({
            plannedShiftId: carlosShift[0].id, userId: usersList[2].id, branchId: branch1.id,
            status: "COMPLETED", scheduledStartTime: "08:00", scheduledEndTime: "16:00",
            checkInTime: checkIn, checkOutTime: checkOut, totalWorkMinutes: 540, overtimeMinutes: 60, // 9 hours work = 1 hr extra
            checkInGeolocation: { latitude: 19.414, longitude: -99.171 }, // Dentro del radio Condesa
            complianceFlags: { lateCheckIn: false, earlyCheckOut: false, missedBreak: false }, startedAt: checkIn, endedAt: checkOut
        });
    }
    console.log(`✅ Asistencias, Shifts Semanales y Overtime (Labor) cargados`);

    // 5. Inventario, Mermas y Caducidad
    const [meat] = await db.insert(inventoryItems).values({
        companyId: company.id, name: "Carne Premium", sku: "MEAT-01", unit: "kg", minLevel: 20
    }).returning();
    await db.insert(inventoryBatches).values({
        itemId: meat.id, branchId: branch1.id, lotNumber: "L-CRIT", initialQuantity: 50, currentQuantity: 5, // Baja
        status: "AVAILABLE", expirationDate: subDays(new Date(), -1) // Un Dia de Expiracion
    });

    // 6. Template Loader & Workflows Hx (NOM y Operación)
    const { getAllTemplates } = await import("@/templates");
    const templates = getAllTemplates();
    const mapTemp = new Map();
    for (const t of templates) {
        const [insertedT] = await db.insert(workflowTemplates).values({
            companyId: company.id, name: t.title, description: t.description, complianceType: t.id?.includes("nom-035") ? "NOM-035" : "NOM-251", steps: t.steps || []
        }).returning();
        mapTemp.set(t.id, insertedT);
    }
    
    // Simular un mes completo de Aperturas diarias y Cierres (NOM-251)
    const workflowHist = [];
    const openTemp = templates.find(t => t.id.includes('apertura'));
    const closeTemp = templates.find(t => t.id.includes('cierre'));
    const nom035 = templates.find(t => t.id.includes('nom-035'));

    if(openTemp && closeTemp) {
        for (let i = 1; i <= 30; i++) {
            workflowHist.push({ workflowTemplateId: openTemp.id, branchId: branch1.id, status: "COMPLETED", createdAt: subDays(new Date(), i), completedAt: subDays(new Date(), i), assigneeId: usersList[2].id, score: 95 });
            workflowHist.push({ workflowTemplateId: closeTemp.id, branchId: branch1.id, status: "COMPLETED", createdAt: subDays(new Date(), i), completedAt: subDays(new Date(), i), assigneeId: usersList[1].id, score: 100 });
        }
    }
    
    if(nom035) { // Un par de encuestas para RH
        workflowHist.push({ workflowTemplateId: nom035.id, branchId: branch1.id, status: "COMPLETED", createdAt: subDays(new Date(), 5), completedAt: subDays(new Date(), 5), assigneeId: usersList[2].id, score: 65 });
    }

    if(workflowHist.length > 0) await db.insert(workflowInstances).values(workflowHist as any);
    console.log(`✅ Evaluaciones NOM, Cierres y Workflows Diarios Sembrados`);

    // 7. KPIs Corporativos Custom
    const [kpi1] = await db.insert(kpiDefinitions).values({ name: "Cumplimiento Operativo", type: "OPERATIONAL", calculationType: "FORMULA", formula: "puntos", companyId: company.id, isActive: true}).returning();
    const [kpi2] = await db.insert(kpiDefinitions).values({ name: "Costo de Labor% (Sales)", type: "LABOR", calculationType: "FORMULA", formula: "cost/sales", companyId: company.id, isActive: true}).returning();
    
    await db.insert(kpiThresholds).values([{ kpiId: kpi1.id, branchId: branch1.id, targetValue: "90", warningValue: "80", criticalValue: "70" }, { kpiId: kpi2.id, branchId: branch1.id, targetValue: "18", warningValue: "20", criticalValue: "25" }]);

    const kLog = [];
    for(let i = 1; i<=30; i++) {
        kLog.push({ kpiId: kpi1.id, branchId: branch1.id, value: (Math.random() * 15 + 85).toFixed(2), createdAt: subDays(new Date(), i) }); // Random ~90+
        kLog.push({ kpiId: kpi2.id, branchId: branch1.id, value: (Math.random() * 4 + 16).toFixed(2), createdAt: subDays(new Date(), i) }); 
    }
    await db.insert(kpiHistory).values(kLog);
    console.log(`✅ KPIs Custom Globales inyectados`);
    
    console.log("🎉 Seed Demo Data Total MVP Finalizado 🎉");
}

main().catch((err) => {
    console.error("Demo Seed Failed:", err);
    process.exit(1);
});
