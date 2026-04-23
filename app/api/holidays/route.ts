import { NextRequest } from "next/server";
import { HolidayService } from "@/lib/services/holiday-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const { searchParams } = new URL(req.url);
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

        const result = await HolidayService.listHolidays(tenant.id, year);
        return ApiHandler.success(result);
    } catch (error) {
        return ApiHandler.error(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const body = await req.json();

        const newHoliday = await HolidayService.createHoliday({
            ...body,
            companyId: tenant.id
        });
        return ApiHandler.success(newHoliday, 201);
    } catch (error) {
        return ApiHandler.error(error);
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return ApiHandler.error(new Error('Holiday ID is required'), { status: 400 });
        }

        await HolidayService.deleteHoliday(id, tenant.id);
        return ApiHandler.success({ success: true });
    } catch (error) {
        return ApiHandler.error(error);
    }
}
