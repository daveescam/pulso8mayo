import { NextRequest } from "next/server";
import { CompanyService } from "@/lib/services/company-service";
import { ApiHandler } from "@/lib/api/response";
import { createCompanySchema } from "@/lib/validations/company";
import { getCurrentTenant } from "@/lib/tenant-context"; // Actually we might not need tenant check for creation if it's onboarding
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        // Assuming onboarding flow: User is logged in but might not have a company yet.
        if (!session?.user) throw new Error("Unauthorized");

        const body = await req.json();
        const data = createCompanySchema.parse(body);

        const company = await CompanyService.createCompany(data, session.user.id);
        return ApiHandler.success(company, 201);
    } catch (error) {
        return ApiHandler.error(error);
    }
}
