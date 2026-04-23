import { db } from "@/lib/db";
import { holidays } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { ApiError } from "@/lib/api/error";

export class HolidayService {
    static async listHolidays(companyId: string, year?: number) {
        if (!companyId) throw ApiError.badRequest("Company ID required");

        let whereClause = eq(holidays.companyId, companyId);

        if (year) {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31, 23, 59, 59);
            whereClause = and(
                eq(holidays.companyId, companyId),
                gte(holidays.date, startOfYear),
                lte(holidays.date, endOfYear)
            );
        }

        return await db.query.holidays.findMany({
            where: whereClause,
            orderBy: desc(holidays.date)
        });
    }

    static async createHoliday(data: { name: string; date: Date | string; companyId: string; description?: string }) {
        if (!data.companyId) throw ApiError.badRequest("Company ID required");

        const newHoliday = await db.insert(holidays).values({
            name: data.name,
            date: new Date(data.date),
            companyId: data.companyId,
            description: data.description
        }).returning();

        return newHoliday[0];
    }

    static async deleteHoliday(id: string, companyId: string) {
        const deleted = await db.delete(holidays)
            .where(and(eq(holidays.id, id), eq(holidays.companyId, companyId)))
            .returning();

        if (!deleted.length) throw ApiError.notFound("Holiday not found");
        return true;
    }
}
