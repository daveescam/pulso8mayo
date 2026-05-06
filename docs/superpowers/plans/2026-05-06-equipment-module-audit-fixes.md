# Equipment Module Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all security vulnerabilities, broken API connections, inconsistent patterns, and duplicate constants in the equipment module.

**Architecture:** Fix API routes to enforce tenant isolation via `requireTenant()`/`requireAuth()`. Align all routes to use `ApiHandler` + `equipmentService` pattern. Fix broken API path in `compliance-services-list.tsx`. Centralize duplicate constants into `lib/equipment-constants.ts`. Add a dedicated stats API endpoint.

**Tech Stack:** Next.js App Router, Drizzle ORM, TypeScript, Zod validation

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `app/api/equipment/providers/route.ts` | Add tenant filtering + auth, use tenant context for POST |
| Modify | `app/api/equipment/maintenance/upcoming/route.ts` | Add auth + tenant check, derive branchId from tenant |
| Modify | `app/api/equipment/maintenance/route.ts` | Refactor POST to use tenant context instead of body fields |
| Modify | `app/api/compliance-services/route.ts` | Align response format with `ApiHandler` pattern |
| Modify | `components/equipment/compliance-services-list.tsx` | Fix API path from `/api/branches/${branchId}/compliance-services` to `/api/compliance-services` |
| Modify | `lib/equipment-constants.ts` | Add shared compliance service types, frequencies, areas, maintenance types, provider types |
| Modify | `components/equipment/compliance-service-form.tsx` | Use shared constants from `lib/equipment-constants.ts` |
| Modify | `components/equipment/maintenance-form.tsx` | Use shared constants from `lib/equipment-constants.ts` |
| Modify | `components/equipment/service-provider-form.tsx` | Use shared constants from `lib/equipment-constants.ts` |
| Modify | `components/equipment/compliance-services-list.tsx` | Use shared constants from `lib/equipment-constants.ts` |
| Create | `app/api/equipment/stats/route.ts` | Dedicated stats endpoint using `equipmentService.getEquipmentStats()` |
| Modify | `components/equipment/equipment-stats.tsx` | Use new `/api/equipment/stats` endpoint |

---

### Task 1: Fix providers API — add tenant filtering and auth

**Files:**
- Modify: `app/api/equipment/providers/route.ts`

**Problem:** GET returns ALL providers without tenant filtering. POST accepts `companyId`/`createdBy` from client body instead of from tenant context (security issue).

- [ ] **Step 1: Rewrite GET handler with tenant filtering**

Replace the entire file content of `app/api/equipment/providers/route.ts` with:

```typescript
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { serviceProviders } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
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
```

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "providers" -Context 2`

Expected: No errors related to providers route.

---

### Task 2: Fix upcoming maintenance API — add auth and tenant check

**Files:**
- Modify: `app/api/equipment/maintenance/upcoming/route.ts`

**Problem:** No auth/tenant check at all. Any unauthenticated user can query by `branchId`.

- [ ] **Step 1: Rewrite with auth and tenant context**

Replace the entire file content of `app/api/equipment/maintenance/upcoming/route.ts` with:

```typescript
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  equipmentMaintenanceHistory,
  branchEquipments,
} from "@/lib/db/schema";
import { eq, and, gte, lte, or, asc } from "drizzle-orm";
import { addDays } from "date-fns";
import { requireTenant } from "@/lib/tenant-context";
import { ApiHandler } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenant();
    if (!tenant.id || !tenant.branchId) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam) : 60;

    const branchId = tenant.branchId;
    const today = new Date();
    const endDate = addDays(today, days);

    const maintenanceRecords = await db.query.equipmentMaintenanceHistory.findMany({
      where: and(
        eq(equipmentMaintenanceHistory.branchId, branchId),
        or(
          and(
            gte(equipmentMaintenanceHistory.scheduledDate, today),
            lte(equipmentMaintenanceHistory.scheduledDate, endDate)
          ),
          and(
            eq(equipmentMaintenanceHistory.status, "SCHEDULED"),
            gte(equipmentMaintenanceHistory.scheduledDate, new Date("1970-01-01")),
            lte(equipmentMaintenanceHistory.scheduledDate, today)
          )
        )
      ),
      orderBy: (history, { asc }) => [asc(history.scheduledDate)],
    });

    const overdueRecords = maintenanceRecords.filter(
      r => r.status === "SCHEDULED" && new Date(r.scheduledDate!) < today
    );

    const scheduledRecords = maintenanceRecords.filter(
      r => r.status === "SCHEDULED" && new Date(r.scheduledDate!) >= today
    );

    const allRecords = [...overdueRecords, ...scheduledRecords];

    const enriched = await Promise.all(
      allRecords.map(async (record) => {
        const equipment = await db.query.branchEquipments.findFirst({
          where: (equip, { eq }) => eq(equip.id, record.equipmentId),
        });
        return {
          maintenance: record,
          equipment: equipment || null,
        };
      })
    );

    return ApiHandler.success(enriched);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "upcoming" -Context 2`

Expected: No errors related to upcoming maintenance route.

---

### Task 3: Fix maintenance POST API — use tenant context

**Files:**
- Modify: `app/api/equipment/maintenance/route.ts`

**Problem:** POST handler accepts `companyId`, `branchId`, `createdBy` from client body instead of from tenant context (security issue). GET handler already uses `requireTenant()` properly.

- [ ] **Step 1: Update POST handler to use tenant context**

Replace the POST handler (lines 50-101) in `app/api/equipment/maintenance/route.ts` with:

```typescript
export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const tenant = await requireTenant();

    if (!tenant.id || !tenant.branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { equipmentId, maintenanceType, scheduledDate, description, workPerformed, tasksCompleted, partsUsed, partsCost, laborCost, totalCost, providerType, providerName, providerContact, technicianName, technicianLicense, findings, recommendations, nextMaintenanceDate, beforePhotos, afterPhotos, documents, signatureUrl, workflowInstanceId } = body;

    if (!equipmentId || !maintenanceType || !scheduledDate || !description) {
      return NextResponse.json(
        { error: "Missing required fields: equipmentId, maintenanceType, scheduledDate, description" },
        { status: 400 }
      );
    }

    const newMaintenance = await db.insert(equipmentMaintenanceHistory).values({
      equipmentId,
      companyId: tenant.id,
      branchId: tenant.branchId,
      maintenanceType,
      status: "SCHEDULED",
      scheduledDate: new Date(scheduledDate),
      description,
      workPerformed,
      tasksCompleted: tasksCompleted || [],
      partsUsed: partsUsed || [],
      partsCost,
      laborCost,
      totalCost,
      providerType: providerType || "INTERNAL",
      providerName,
      providerContact,
      technicianName,
      technicianLicense,
      findings,
      recommendations,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
      beforePhotos: beforePhotos || [],
      afterPhotos: afterPhotos || [],
      documents: documents || [],
      signatureUrl,
      workflowInstanceId,
      createdBy: user.id,
    }).returning();

    await db.update(branchEquipments)
      .set({ lastMaintenanceDate: new Date(), updatedAt: new Date() })
      .where(eq(branchEquipments.id, equipmentId));

    return NextResponse.json(newMaintenance[0], { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    return NextResponse.json({ error: "Error creating maintenance" }, { status: 500 });
  }
}
```

Also add `requireAuth` to the existing import on line 6:

```typescript
import { requireTenant, requireAuth } from "@/lib/tenant-context";
```

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "maintenance" -Context 2`

Expected: No errors related to maintenance route.

---

### Task 4: Fix compliance-services API — align response format

**Files:**
- Modify: `app/api/compliance-services/route.ts`

**Problem:** GET returns raw array (not wrapped in `{ success: true, data }`). POST returns raw object. Both should use `ApiHandler` for consistency.

- [ ] **Step 1: Rewrite using ApiHandler pattern**

Replace the entire file content of `app/api/compliance-services/route.ts` with:

```typescript
import { NextRequest } from "next/server";
import { equipmentService } from "@/lib/services/equipment-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant, requireAuth } from "@/lib/tenant-context";
import { z } from "zod";

const createComplianceServiceSchema = z.object({
  serviceType: z.string().min(1, "El tipo de servicio es requerido"),
  serviceName: z.string().min(1, "El nombre del servicio es requerido"),
  regulationReference: z.string().optional(),
  isMandatory: z.boolean().optional(),
  frequency: z.string().min(1, "La frecuencia es requerida"),
  customDays: z.number().optional(),
  providerId: z.string().optional(),
  providerName: z.string().optional(),
  providerContact: z.string().optional(),
  nextServiceDate: z.string().optional(),
  serviceAreas: z.array(z.string()).optional(),
  specialInstructions: z.string().optional(),
  workflowTemplateId: z.string().optional(),
});

export async function GET() {
  try {
    const tenant = await requireTenant();
    if (!tenant.id || !tenant.branchId) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const services = await equipmentService.getComplianceServicesByBranch(tenant.branchId);

    return ApiHandler.success(services);
  } catch (error) {
    return ApiHandler.error(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const tenant = await requireTenant();

    if (!tenant.id || !tenant.branchId) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const body = await request.json();
    const validatedData = createComplianceServiceSchema.parse(body);

    const service = await equipmentService.createComplianceService({
      companyId: tenant.id,
      branchId: tenant.branchId,
      serviceType: validatedData.serviceType,
      serviceName: validatedData.serviceName,
      regulationReference: validatedData.regulationReference,
      isMandatory: validatedData.isMandatory ?? true,
      frequency: validatedData.frequency,
      customDays: validatedData.customDays,
      providerId: validatedData.providerId,
      providerName: validatedData.providerName,
      providerContact: validatedData.providerContact,
      nextServiceDate: validatedData.nextServiceDate ? new Date(validatedData.nextServiceDate) : undefined,
      serviceAreas: validatedData.serviceAreas || [],
      specialInstructions: validatedData.specialInstructions,
      workflowTemplateId: validatedData.workflowTemplateId,
    }, user.id);

    return ApiHandler.success(service, 201);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "compliance-services" -Context 2`

Expected: No errors related to compliance-services route.

---

### Task 5: Fix compliance-services-list API path mismatch

**Files:**
- Modify: `components/equipment/compliance-services-list.tsx`

**Problem:** `fetchServices()` calls `/api/branches/${branchId}/compliance-services` which does NOT exist. The correct path is `/api/compliance-services`. `handleCreateService()` also POSTs to the wrong path.

Also, the response parsing `data.data?.map((s: any) => s.service) || []` must be updated to match the new `ApiHandler` response format `{ success: true, data: [...] }`.

- [ ] **Step 1: Fix fetchServices API path and response parsing**

Replace the `fetchServices` function (lines 105-122) with:

```typescript
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/compliance-services`);
      if (!response.ok) throw new Error("Failed to fetch services");

      const result = await response.json();
      const data = result.data || [];
      setServices(data.map((s: any) => s.service || s));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios de cumplimiento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 2: Fix handleCreateService API path and response parsing**

Replace the `handleCreateService` function (lines 124-158) with:

```typescript
  const handleCreateService = async () => {
    try {
      const response = await fetch(`/api/compliance-services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newService,
          nextServiceDate: newService.nextServiceDate ? new Date(newService.nextServiceDate).toISOString() : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to create service");

      toast({
        title: "Éxito",
        description: "Servicio creado correctamente",
      });

      setIsAddDialogOpen(false);
      setNewService({
        serviceType: "",
        serviceName: "",
        frequency: "",
        providerName: "",
        nextServiceDate: "",
      });
      fetchServices();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el servicio",
        variant: "destructive",
      });
    }
  };
```

- [ ] **Step 3: Verify the component compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "compliance-services-list" -Context 2`

Expected: No errors related to the component.

---

### Task 6: Expand shared constants in equipment-constants.ts

**Files:**
- Modify: `lib/equipment-constants.ts`

**Problem:** `compliance-service-form.tsx`, `compliance-services-list.tsx`, `maintenance-form.tsx`, and `service-provider-form.tsx` all define their own local label arrays. These should be centralized.

- [ ] **Step 1: Add compliance service types, full frequencies, maintenance types, provider types, and service areas**

Replace the entire file content of `lib/equipment-constants.ts` with:

```typescript
export const equipmentTypes = [
  { value: "REFRIGERATOR", label: "Refrigerador" },
  { value: "FREEZER", label: "Congelador" },
  { value: "OVEN", label: "Horno" },
  { value: "STOVE", label: "Estufa" },
  { value: "GRILL", label: "Parrilla" },
  { value: "FRYER", label: "Freidora" },
  { value: "DISHWASHER", label: "Lavavajillas" },
  { value: "COFFEE_MACHINE", label: "Cafetera" },
  { value: "BLENDER", label: "Licuadora" },
  { value: "MIXER", label: "Batidora" },
  { value: "EXHAUST_HOOD", label: "Campana Extractora" },
  { value: "AIR_CONDITIONER", label: "Aire Acondicionado" },
  { value: "FIRE_SUPPRESSION", label: "Sistema Contra Incendios" },
  { value: "SECURITY_CAMERA", label: "Cámara de Seguridad" },
  { value: "POS_SYSTEM", label: "Sistema POS" },
  { value: "OTHER", label: "Otro" },
] as const;

export const maintenanceFrequencies = [
  { value: "DAILY", label: "Diario" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "BIMONTHLY", label: "Bimestral" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "ANNUAL", label: "Anual" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

export const equipmentAreas = [
  { value: "BACK_OF_HOUSE", label: "Back of House" },
  { value: "FRONT_OF_HOUSE", label: "Front of House" },
  { value: "STORAGE", label: "Almacén" },
  { value: "OFFICE", label: "Oficina" },
  { value: "OUTDOOR", label: "Exterior" },
] as const;

export const complianceServiceTypes = [
  { value: "FUMIGATION", label: "Fumigación" },
  { value: "FIRE_SYSTEM_CHECK", label: "Sistema Contra Incendios" },
  { value: "ELECTRICAL_INSPECTION", label: "Inspección Eléctrica" },
  { value: "GAS_INSPECTION", label: "Inspección de Gas" },
  { value: "WATER_QUALITY", label: "Calidad del Agua" },
  { value: "AIR_QUALITY", label: "Calidad del Aire" },
  { value: "PEST_CONTROL", label: "Control de Plagas" },
  { value: "HYGIENE_AUDIT", label: "Auditoría de Higiene" },
  { value: "SAFETY_INSPECTION", label: "Inspección de Seguridad" },
  { value: "OTHER", label: "Otro" },
] as const;

export const maintenanceTypes = [
  { value: "PREVENTIVE", label: "Preventivo" },
  { value: "CORRECTIVE", label: "Correctivo" },
  { value: "INSPECTION", label: "Inspección" },
  { value: "CLEANING", label: "Limpieza" },
  { value: "CALIBRATION", label: "Calibración" },
  { value: "EMERGENCY", label: "Emergencia" },
] as const;

export const providerTypes = [
  { value: "INTERNAL", label: "Interno" },
  { value: "EXTERNAL", label: "Externo" },
  { value: "CERTIFIED", label: "Certificado" },
] as const;

export const serviceProviderServiceTypes = [
  "Mantenimiento General",
  "Refrigeración",
  "Electricidad",
  "Plomería",
  "Carpintería",
  "Pintura",
  "Limpieza",
  "Jardinería",
  "Seguridad",
  "IT/Sistemas",
  "Fumigación",
  "Sistemas Contra Incendios",
  "Aire Acondicionado",
  "Equipos de Cocina",
  "Electrodomésticos",
] as const;

export const complianceServiceAreas = [
  "Cocina",
  "Área de Comedor",
  "Almacén",
  "Baños",
  "Oficinas",
  "Exterior",
  "Estacionamiento",
  "Área de Carga",
  "Sótano",
  "Azotea",
] as const;

export function getEquipmentTypeLabel(value: string): string {
  return equipmentTypes.find(t => t.value === value)?.label || value;
}

export function getMaintenanceFrequencyLabel(value: string): string {
  return maintenanceFrequencies.find(f => f.value === value)?.label || value;
}

export function getAreaLabel(value: string): string {
  return equipmentAreas.find(a => a.value === value)?.label || value;
}

export function getComplianceServiceTypeLabel(value: string): string {
  return complianceServiceTypes.find(t => t.value === value)?.label || value;
}

export function getMaintenanceTypeLabel(value: string): string {
  return maintenanceTypes.find(t => t.value === value)?.label || value;
}

export function getProviderTypeLabel(value: string): string {
  return providerTypes.find(t => t.value === value)?.label || value;
}
```

Key changes: added `BIMONTHLY` and `CUSTOM` to `maintenanceFrequencies`, added `complianceServiceTypes`, `maintenanceTypes`, `providerTypes`, `serviceProviderServiceTypes`, `complianceServiceAreas`, and corresponding label helper functions.

- [ ] **Step 2: Verify no import errors**

Run: `pnpm run build 2>&1 | Select-String -Pattern "equipment-constants" -Context 2`

Expected: No errors related to equipment-constants.

---

### Task 7: Update compliance-service-form.tsx to use shared constants

**Files:**
- Modify: `components/equipment/compliance-service-form.tsx`

**Problem:** Defines local `serviceTypes`, `frequencies`, and `serviceAreas` arrays instead of using shared constants.

- [ ] **Step 1: Replace local arrays with imports**

Replace lines 31-67 (the local `serviceTypes`, `frequencies`, and `serviceAreas` arrays) with:

```typescript
import { complianceServiceTypes, maintenanceFrequencies, complianceServiceAreas } from "@/lib/equipment-constants";
```

Add this import after the existing imports (after line 29).

Then remove the three local const declarations (`serviceTypes` on line 31, `frequencies` on line 44, `serviceAreas` on line 56).

- [ ] **Step 2: Update template references**

In the JSX, `serviceTypes` is used at line 232 — rename to `complianceServiceTypes`:
- Line 232: `{serviceTypes.map((type) =>` → `{complianceServiceTypes.map((type) =>`

In the JSX, `frequencies` is used at line 317 — rename to `maintenanceFrequencies`:
- Line 317: `{frequencies.map((freq) =>` → `{maintenanceFrequencies.map((freq) =>`

In the JSX, `serviceAreas` is used at line 458 — rename to `complianceServiceAreas`:
- Line 458: `{serviceAreas` → `{complianceServiceAreas`

- [ ] **Step 3: Verify the component compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "compliance-service-form" -Context 2`

Expected: No errors.

---

### Task 8: Update maintenance-form.tsx to use shared constants

**Files:**
- Modify: `components/equipment/maintenance-form.tsx`

**Problem:** Defines local `maintenanceTypes` and `providerTypes` arrays instead of using shared constants.

- [ ] **Step 1: Replace local arrays with imports**

Add after line 28 (existing imports):

```typescript
import { maintenanceTypes, providerTypes } from "@/lib/equipment-constants";
```

Then remove the local const declarations on lines 30-37 (`maintenanceTypes`) and lines 39-43 (`providerTypes`).

- [ ] **Step 2: Verify the component compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "maintenance-form" -Context 2`

Expected: No errors.

---

### Task 9: Update service-provider-form.tsx to use shared constants

**Files:**
- Modify: `components/equipment/service-provider-form.tsx`

**Problem:** Defines local `providerTypes` and `serviceTypes` arrays instead of using shared constants.

- [ ] **Step 1: Replace local arrays with imports**

Add after line 29 (existing imports):

```typescript
import { providerTypes, serviceProviderServiceTypes } from "@/lib/equipment-constants";
```

Then remove the local const declarations on lines 31-35 (`providerTypes`) and lines 37-53 (`serviceTypes`).

- [ ] **Step 2: Update template references**

In the JSX, `serviceTypes` is used at line 367 — rename to `serviceProviderServiceTypes`:
- Line 367: `{serviceTypes` → `{serviceProviderServiceTypes`

- [ ] **Step 3: Verify the component compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "service-provider-form" -Context 2`

Expected: No errors.

---

### Task 10: Update compliance-services-list.tsx to use shared constants

**Files:**
- Modify: `components/equipment/compliance-services-list.tsx`

**Problem:** Defines local `serviceTypeLabels` and `frequencyLabels` records instead of using shared constants + helpers.

- [ ] **Step 1: Replace local label records with imports**

Add after line 42 (existing imports):

```typescript
import { complianceServiceTypes, maintenanceFrequencies } from "@/lib/equipment-constants";
```

Then remove the local const declarations on lines 58-69 (`serviceTypeLabels`) and lines 71-81 (`frequencyLabels`).

- [ ] **Step 2: Create inline lookup helpers from imported arrays**

Add these helper functions right after the imports section (before the `ComplianceServicesList` component):

```typescript
const serviceTypeLabels: Record<string, string> = Object.fromEntries(
  complianceServiceTypes.map(t => [t.value, t.label])
);

const frequencyLabels: Record<string, string> = Object.fromEntries(
  maintenanceFrequencies.map(f => [f.value, f.label])
);
```

This preserves the `Record<string, string>` interface used throughout the component (for lookups like `serviceTypeLabels[service.serviceType]`) while sourcing data from the shared constants.

- [ ] **Step 3: Verify the component compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "compliance-services-list" -Context 2`

Expected: No errors.

---

### Task 11: Create dedicated stats API endpoint

**Files:**
- Create: `app/api/equipment/stats/route.ts`

**Problem:** `equipment-stats.tsx` calculates stats client-side by fetching the full equipment list and filtering in JavaScript. The `equipmentService.getEquipmentStats()` method already exists but has no API endpoint.

- [ ] **Step 1: Create the stats endpoint**

Create file `app/api/equipment/stats/route.ts` with:

```typescript
import { equipmentService } from "@/lib/services/equipment-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";

export async function GET() {
  try {
    const tenant = await requireTenant();
    if (!tenant.id || !tenant.branchId) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const stats = await equipmentService.getEquipmentStats(tenant.branchId);

    return ApiHandler.success(stats);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
```

- [ ] **Step 2: Verify the endpoint compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "stats" -Context 2`

Expected: No errors related to stats route.

---

### Task 12: Update equipment-stats.tsx to use dedicated stats endpoint

**Files:**
- Modify: `components/equipment/equipment-stats.tsx`

**Problem:** Fetches full equipment list and calculates stats client-side. Should use the new `/api/equipment/stats` endpoint.

- [ ] **Step 1: Replace fetchStats with dedicated endpoint call**

Replace the `fetchStats` function (lines 47-80) with:

```typescript
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/equipment/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");

      const result = await response.json();
      const data = result.data;

      setStats({
        total: data.total,
        active: data.active,
        underMaintenance: data.underMaintenance,
        outOfOrder: data.outOfOrder,
        critical: data.critical,
        byType: data.byType,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 2: Remove unused `branchId` dependency from useEffect**

The useEffect currently depends on `branchId` (line 42-45). Since the API now derives branchId from the session, we no longer need to gate on it. Replace:

```typescript
  useEffect(() => {
    if (branchId) {
      fetchStats();
    }
  }, [branchId]);
```

With:

```typescript
  useEffect(() => {
    fetchStats();
  }, []);
```

Note: We keep the `useTenant` import and `branchId` variable since they may be used elsewhere in the component, but they're no longer needed for the fetch. If they're truly unused after this change, they can be removed in a cleanup pass.

- [ ] **Step 3: Remove the local `equipmentTypeLabels` record**

Lines 119-136 define a local `equipmentTypeLabels` record. Replace it with the shared helper:

Add import at top:
```typescript
import { getEquipmentTypeLabel } from "@/lib/equipment-constants";
```

Then remove the local `equipmentTypeLabels` const (lines 119-136).

Update line 182 from:
```typescript
{equipmentTypeLabels[type] || type}: {count}
```
to:
```typescript
{getEquipmentTypeLabel(type)}: {count}
```

- [ ] **Step 4: Verify the component compiles**

Run: `pnpm run build 2>&1 | Select-String -Pattern "equipment-stats" -Context 2`

Expected: No errors.

---

### Task 13: Final build verification

- [ ] **Step 1: Run full build**

Run: `pnpm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`

Expected: No lint errors (or only pre-existing ones unrelated to this change).

- [ ] **Step 3: Commit all changes**

```bash
git add app/api/equipment/providers/route.ts app/api/equipment/maintenance/upcoming/route.ts app/api/equipment/maintenance/route.ts app/api/compliance-services/route.ts components/equipment/compliance-services-list.tsx lib/equipment-constants.ts components/equipment/compliance-service-form.tsx components/equipment/maintenance-form.tsx components/equipment/service-provider-form.tsx app/api/equipment/stats/route.ts components/equipment/equipment-stats.tsx
git commit -m "fix: equipment module security, broken API paths, and constant deduplication

- Fix providers API: add tenant filtering on GET, use tenant context for POST
- Fix upcoming maintenance API: add auth/tenant check, derive branchId from session
- Fix maintenance POST: use tenant context instead of client-provided companyId/branchId
- Fix compliance-services API: use ApiHandler + equipmentService pattern
- Fix compliance-services-list: correct API path from /api/branches/${branchId}/... to /api/compliance-services
- Expand shared constants: add compliance service types, maintenance types, provider types, service areas
- Deduplicate constants in compliance-service-form, maintenance-form, service-provider-form, compliance-services-list
- Add dedicated /api/equipment/stats endpoint
- Update equipment-stats.tsx to use stats endpoint instead of client-side calculation"
```
