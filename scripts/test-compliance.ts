import { db } from "@/lib/db";
import { users, employeeDocuments } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// Simulate what the /api/documents/compliance endpoint returns
async function testComplianceAPI() {
    console.log("🔍 Testing Compliance API Logic...\n");

    // Your company ID
    const companyId = '67404361-cc3c-4733-84bd-26e4ecab6dcc';

    // Get all employees in the company
    const employees = await db.query.users.findMany({
        where: and(
            eq(users.companyId, companyId),
            eq(users.deletedAt, null)
        ),
        columns: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });

    console.log(`✅ Employees found: ${employees.length}`);
    employees.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.email}) - Role: ${emp.role}`);
    });

    // Get all documents for all employees
    const employeeIds = employees.map(e => e.id);

    let allDocuments: any[] = [];
    if (employeeIds.length > 0) {
        allDocuments = await db.query.employeeDocuments.findMany({
            where: and(
                eq(employeeDocuments.companyId, companyId),
                inArray(employeeDocuments.userId, employeeIds)
            )
        });
    }

    console.log(`\n📄 Documents found: ${allDocuments.length}`);

    // Build compliance status for each employee
    const requiredTypes = ['CONTRACT', 'ID', 'TAX_ID', 'BANK_INFO'];
    const employeeStatuses = employees.map(employee => {
        const empDocs = allDocuments.filter(d => d.userId === employee.id);

        const validDocuments = empDocs.filter(d => d.isValid && d.status === 'VALIDATED').length;
        const pendingDocuments = empDocs.filter(d => d.status === 'PENDING').length;
        const expiredDocuments = empDocs.filter(d => d.status === 'EXPIRED' || !d.isValid).length;

        const existingTypes = new Set(
            empDocs
                .filter(d => d.status === 'VALIDATED' && d.isValid)
                .map(d => d.documentType)
        );
        const missingRequired = requiredTypes.filter(type => !existingTypes.has(type));

        const totalRequired = requiredTypes.length;
        const completedRequired = requiredTypes.filter(type => existingTypes.has(type)).length;
        const compliancePercentage = Math.round((completedRequired / totalRequired) * 100);

        return {
            userId: employee.id,
            userName: employee.name || employee.email,
            userEmail: employee.email,
            userRole: employee.role || 'EMPLEADO',
            totalDocuments: empDocs.length,
            validDocuments,
            pendingDocuments,
            expiredDocuments,
            missingRequired,
            compliancePercentage,
            documents: empDocs.map(d => ({
                id: d.id,
                documentType: d.documentType,
                documentName: d.documentName,
                status: d.status,
                isValid: d.isValid,
                expirationDate: d.expirationDate
            }))
        };
    });

    console.log(`\n📊 Employee Compliance Status:`);
    employeeStatuses.forEach(emp => {
        console.log(`\n   Employee: ${emp.userName}`);
        console.log(`     Total Documents: ${emp.totalDocuments}`);
        console.log(`     Valid: ${emp.validDocuments}`);
        console.log(`     Pending: ${emp.pendingDocuments}`);
        console.log(`     Expired: ${emp.expiredDocuments}`);
        console.log(`     Missing Required: ${emp.missingRequired.join(', ') || 'None'}`);
        console.log(`     Compliance: ${emp.compliancePercentage}%`);
    });

    console.log(`\n✅ API would return ${employeeStatuses.length} employees`);
}

testComplianceAPI().catch((err) => {
    console.error("Test Failed:", err);
    process.exit(1);
});
