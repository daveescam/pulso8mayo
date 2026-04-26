import { db } from "@/lib/db";
import { branches, users } from "@/lib/db/schema";
import { eq, and, desc, isNull, or, sql, inArray } from "drizzle-orm";
import { CreateBranchInput, UpdateBranchInput } from "@/lib/validations/branch";
import { ApiError } from "@/lib/api/error";

export class BranchService {
    static async listBranches(companyId: string) {
        if (!companyId) throw ApiError.badRequest("Company ID required to list branches");

        const branchList = await db.query.branches.findMany({
            where: eq(branches.companyId, companyId),
            orderBy: desc(branches.createdAt)
        });

        // Get all manager IDs from branches
        const managerIds = branchList.map(b => b.managerId).filter((id): id is string => !!id);
        
        // Get all managers in one query
        let managers: any[] = [];
        if (managerIds.length > 0) {
            managers = await db.query.users.findMany({
                where: inArray(users.id, managerIds),
                columns: {
                    id: true,
                    name: true,
                    email: true
                }
            });
        }

        // Attach manager info to branches
        const managerMap = new Map(managers.map(m => [m.id, m]));
        return branchList.map(branch => ({
            ...branch,
            manager: managerMap.get(branch.managerId!) || null
        }));
    }

    static async createBranch(data: CreateBranchInput) {
        if (!data.companyId) throw ApiError.badRequest("Company ID required for branch creation");

        // Generate branch code if not provided
        const branchCode = data.code || `BR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const newBranch = await db.insert(branches).values({
            name: data.name,
            code: branchCode,
            companyId: data.companyId,
            address: data.address,
            timezone: data.timezone,
            operatingHours: data.operatingHours,
            location: data.location,
            managerId: data.managerId
        }).returning();

        return newBranch[0];
    }

    static async getBranch(id: string, companyId?: string) {
        const where = companyId
            ? and(eq(branches.id, id), eq(branches.companyId, companyId))
            : eq(branches.id, id);

        const branch = await db.query.branches.findFirst({
            where
        });

        if (!branch) throw ApiError.notFound("Branch not found");

        // Get manager info if exists
        let manager = null;
if (branch.managerId) {
  const managerUser = await db.query.users.findFirst({
    where: eq(users.id, branch.managerId),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  }) as { id: string; name: string; email: string; role: string } | undefined;
  manager = managerUser || null;
}

        return {
            ...branch,
            manager
        };
    }

    static async updateBranch(id: string, data: UpdateBranchInput, companyId?: string) {
        await db.update(branches).set({
            ...data
        }).where(eq(branches.id, id));

        return await this.getBranch(id, companyId);
    }

    static async deleteBranch(id: string) {
        await db.update(branches).set({ active: false }).where(eq(branches.id, id));
        return true;
    }

    static async getBranchManagers(companyId: string, branchId?: string) {
        // Get all users with GERENTE role or users who are managers of any branch
        const baseConditions = eq(users.companyId, companyId);
        const roleCondition = or(
            eq(users.role, "GERENTE"),
            eq(users.role, "ADMIN")
        );

        if (branchId) {
            // Also include users who are already managers of this branch
            const branchManager = await db.query.branches.findFirst({
                where: eq(branches.id, branchId),
                columns: { managerId: true }
            });
            
            if (branchManager?.managerId) {
                // Include current manager even if role changed
                return await db.query.users.findMany({
                    where: and(
                        baseConditions,
                        or(
                            roleCondition,
                            eq(users.id, branchManager.managerId)
                        )
                    ),
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        branchId: true
                    }
                });
            }
        }

        return await db.query.users.findMany({
            where: and(baseConditions, roleCondition),
            columns: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true
            }
        });
    }

    static async getBranchEmployees(branchId: string) {
        return await db.query.users.findMany({
            where: and(
                eq(users.branchId, branchId),
                eq(users.role, "EMPLEADO")
            ),
            columns: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: desc(users.createdAt)
        });
    }
}
