import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serviceProviders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const providers = await db.query.serviceProviders.findMany({
      orderBy: (providers, { asc }) => [asc(providers.name)],
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json({ error: "Error fetching providers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, businessName, companyId, createdBy, providerType, services, specializations, contactName, phone, email, address, certifications, isCertified, rating, notes } = body;

    if (!name || !companyId || !createdBy || !providerType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newProvider = await db.insert(serviceProviders).values({
      name,
      businessName,
      companyId,
      createdBy,
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

    return NextResponse.json(newProvider[0], { status: 201 });
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json({ error: "Error creating provider" }, { status: 500 });
  }
}