import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { serviceProviders } from "@/lib/db/schema";
import { requireTenant, requireAuth } from "@/lib/tenant-context";
import { ApiHandler } from "@/lib/api/response";

export async function GET() {
  try {
    const tenant = await requireTenant();
    if (!tenant.id) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const providers = await db.query.serviceProviders.findMany({
      where: (providers, { eq, and }) => and(
        eq(providers.companyId, tenant.id!),
      ),
      orderBy: (providers, { asc }) => [asc(providers.name)],
    });

    return ApiHandler.success(providers);
  } catch (error) {
    return ApiHandler.error(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const tenant = await requireTenant();

    if (!tenant.id) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const body = await request.json();
    const { name, businessName, providerType, services, specializations, contactName, phone, email, address, certifications, isCertified, rating, notes } = body;

    if (!name || !providerType) {
      return ApiHandler.error(new Error("Missing required fields: name, providerType"), 400);
    }

    const newProvider = await db.insert(serviceProviders).values({
      name,
      businessName,
      companyId: tenant.id,
      createdBy: user.id,
      providerType,
      services: services || [],
      specializations: specializations || [],
      contactName,
      phone,
      email,
      address,
      certifications: certifications || [],
      isCertified: isCertified || false,
      rating,
      notes,
    }).returning();

    return ApiHandler.success(newProvider[0], 201);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
