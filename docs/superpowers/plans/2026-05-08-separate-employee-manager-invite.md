# Separate Employee vs Manager Invite Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate `managerInviteToken` to the `branches` table so that employee onboarding QRs assign `EMPLEADO` role and manager email invitations assign `GERENTE` role — role determined by which token was used, not user-editable.

**Architecture:** Add `managerInviteToken` column to `branches` table. The `/api/join` endpoint checks both token columns to determine role. The `/api/join/info` endpoint returns the role so the join page can display role-specific text. The invite-manager API uses the manager token instead of the employee token. No new tables or pages needed.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon Postgres, TypeScript, Resend (email)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/db/schema/core.ts` | Add `managerInviteToken` column + unique index |
| Create | `drizzle/0007_add_manager_invite_token.sql` | Migration SQL for new column |
| Modify | `app/api/join/route.ts` | Token-based role assignment (EMPLEADO vs GERENTE) |
| Modify | `app/api/join/info/route.ts` | Return role based on which token matched |
| Modify | `app/api/branches/invite-manager/route.ts` | Use `managerInviteToken` for invite URLs |
| Modify | `app/join/[token]/page.tsx` | Dynamic text based on role from `/api/join/info` |

---

### Task 1: Add `managerInviteToken` Column to Database Schema

**Files:**
- Modify: `lib/db/schema/core.ts:18-39`
- Create: `drizzle/0007_add_manager_invite_token.sql`

- [ ] **Step 1: Add `managerInviteToken` column to `branches` table in schema**

In `lib/db/schema/core.ts`, add the new column and unique index inside the `branches` table definition and its constraints callback:

```typescript
// In the branches table columns (after inviteToken, line ~28):
managerInviteToken: uuid("manager_invite_token").default(sql`gen_random_uuid()`),

// In the constraints callback (table) => { ... }, after branchesInviteTokenUnique:
branchesManagerInviteTokenUnique: uniqueIndex("branches_manager_invite_token_unique").on(table.managerInviteToken),
```

The full updated `branches` table should look like:

```typescript
export const branches = pgTable("branches", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  companyId: uuid("company_id"),
  name: text("name").notNull(),
  address: text("address"),
  timezone: text("timezone").default('America/Mexico_City'),
  operatingHours: jsonb("operating_hours"),
  location: jsonb("location"),
  managerId: text("manager_id"),
  inviteToken: uuid("invite_token").default(sql`gen_random_uuid()`),
  managerInviteToken: uuid("manager_invite_token").default(sql`gen_random_uuid()`),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    branchesInviteTokenUnique: uniqueIndex("branches_invite_token_unique").on(table.inviteToken),
    branchesManagerInviteTokenUnique: uniqueIndex("branches_manager_invite_token_unique").on(table.managerInviteToken),
    branchesManagerIdFk: foreignKey({
      columns: [table.managerId],
      foreignColumns: [users.id],
      name: "branches_manager_id_fkey"
    }),
  };
});
```

- [ ] **Step 2: Create the migration SQL file**

Create `drizzle/0007_add_manager_invite_token.sql`:

```sql
-- Add managerInviteToken column to branches table
ALTER TABLE "branches" ADD COLUMN "manager_invite_token" uuid DEFAULT gen_random_uuid();

-- Add unique index on managerInviteToken
CREATE UNIQUE INDEX IF NOT EXISTS "branches_manager_invite_token_unique" ON "branches" ("manager_invite_token");
```

- [ ] **Step 3: Run the migration**

Run: `pnpm db:migrate`

Expected: Migration applies successfully, no errors. If `pnpm db:migrate` doesn't pick up the manual SQL file, apply it directly via `psql $DATABASE_URL -f drizzle/0007_add_manager_invite_token.sql` or use `pnpm db:push` (caution: can drop tables — verify `.env` points to correct DB first).

- [ ] **Step 4: Verify the schema change**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors. The `managerInviteToken` field is now part of the `branches` type.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema/core.ts drizzle/0007_add_manager_invite_token.sql
git commit -m "feat: add managerInviteToken column to branches table"
```

---

### Task 2: Update `/api/join` to Assign Role Based on Token Type

**Files:**
- Modify: `app/api/join/route.ts`

- [ ] **Step 1: Update the join route to query both token columns and assign role accordingly**

Replace the token validation logic in `app/api/join/route.ts`. The key change: instead of always assigning `GERENTE`, check which token matched and assign the appropriate role.

Full updated file:

```typescript
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, branches } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ApiHandler } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, inviteToken } = body;

    if (!inviteToken || typeof inviteToken !== 'string') {
      throw ApiError.badRequest("Invalid or missing invite token");
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(inviteToken)) {
      throw ApiError.badRequest(`Invalid invite token format. Expected UUID, got: ${inviteToken}`);
    }

    // 1. Find branch by either token column
    const branchResults = await db.query.branches.findMany({
      where: or(
        eq(branches.inviteToken, inviteToken),
        eq(branches.managerInviteToken, inviteToken)
      ),
    });

    const branch = branchResults[0];

    if (!branch) throw ApiError.badRequest("Invalid invite link");

    // Determine role based on which token matched
    const isManagerInvite = branch.managerInviteToken === inviteToken;
    const role = isManagerInvite ? "GERENTE" : "EMPLEADO";

    // 2. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      await db.update(users).set({
        companyId: branch.companyId,
        branchId: branch.id,
        role: role,
        emailVerified: true,
        name: name || existingUser.name
      }).where(eq(users.id, existingUser.id));

      // Only set managerId if this is a manager invite
      if (isManagerInvite) {
        await db.update(branches).set({
          managerId: existingUser.id
        }).where(eq(branches.id, branch.id));
      }

      return ApiHandler.success({ userId: existingUser.id, existing: true, role });
    }

    // 3. Create new user via Auth
    const newUserRes = await auth.api.signUpEmail({
      body: { email, password, name },
      asResponse: false
    });

    if (!newUserRes?.user) throw new Error("Failed to create user");

    // 4. Update User with Role and Branch
    await db.update(users).set({
      companyId: branch.companyId,
      branchId: branch.id,
      role: role,
      emailVerified: true
    }).where(eq(users.id, newUserRes.user.id));

    // Only set managerId if this is a manager invite
    if (isManagerInvite) {
      await db.update(branches).set({
        managerId: newUserRes.user.id
      }).where(eq(branches.id, branch.id));
    }

    return ApiHandler.success({ userId: newUserRes.user.id, existing: false, role });

  } catch (error) {
    return ApiHandler.error(error);
  }
}
```

- [ ] **Step 2: Run build to verify**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors. The `or` import from `drizzle-orm` resolves correctly.

- [ ] **Step 3: Commit**

```bash
git add app/api/join/route.ts
git commit -m "feat: assign EMPLEADO or GERENTE role based on invite token type in /api/join"
```

---

### Task 3: Update `/api/join/info` to Return Role Based on Token Type

**Files:**
- Modify: `app/api/join/info/route.ts`

- [ ] **Step 1: Update the info route to search both token columns and return role**

Replace the query logic in `app/api/join/info/route.ts`. Search both `inviteToken` and `managerInviteToken`, and include the resolved role in the response.

Full updated file:

```typescript
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { branches, companies } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { ApiHandler } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) throw ApiError.badRequest("Token is required");

    const branchResults = await db.query.branches.findMany({
      where: or(
        eq(branches.inviteToken, token),
        eq(branches.managerInviteToken, token)
      ),
    });

    const branch = branchResults[0];

    if (!branch) throw ApiError.badRequest("Invalid invite link");

    const isManagerInvite = branch.managerInviteToken === token;
    const role = isManagerInvite ? "GERENTE" : "EMPLEADO";

    const company = await db.query.companies.findFirst({
      where: eq(companies.id, branch.companyId),
      columns: { id: true, name: true }
    });

    return ApiHandler.success({
      branchId: branch.id,
      branchName: branch.name,
      branchAddress: branch.address,
      companyName: company?.name,
      role,
    });
  } catch (error) {
    return ApiHandler.error(error);
  }
}
```

- [ ] **Step 2: Run build to verify**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/join/info/route.ts
git commit -m "feat: return role (EMPLEADO/GERENTE) in /api/join/info based on token type"
```

---

### Task 4: Update Join Page to Display Dynamic Text Based on Role

**Files:**
- Modify: `app/join/[token]/page.tsx`

- [ ] **Step 1: Update `branchInfo` state type and UI text**

In `app/join/[token]/page.tsx`, make three changes:

**Change 1** — Update the `branchInfo` state type to include `role` (line ~18):

```typescript
const [branchInfo, setBranchInfo] = useState<{ branchName: string; companyName: string; role: string } | null>(null);
```

**Change 2** — Update the CardTitle and CardDescription (lines ~144-149) to show role-specific text:

```tsx
<CardTitle>
  {branchInfo.role === "GERENTE"
    ? "Únete como Gerente"
    : "Únete al equipo"}
</CardTitle>
<CardDescription>
  {branchInfo.role === "GERENTE"
    ? <>Has sido invitado como gerente de{" "}<strong>{branchInfo.branchName}</strong>{branchInfo.companyName && ` en ${branchInfo.companyName}`}.
    </>
    : <>Has sido invitado a unirte al equipo de{" "}<strong>{branchInfo.branchName}</strong>{branchInfo.companyName && ` en ${branchInfo.companyName}`}.
    </>
  }
</CardDescription>
```

**Change 3** — Update the submit button text (line ~167):

```tsx
<Button className="w-full" onClick={handleJoin} disabled={loading}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {branchInfo.role === "GERENTE" ? "Registrarse como Gerente" : "Registrarse y Unirse"}
</Button>
```

- [ ] **Step 2: Run build to verify**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors. The page renders with role-specific text.

- [ ] **Step 3: Commit**

```bash
git add app/join/[token]/page.tsx
git commit -m "feat: show role-specific text on join page (EMPLEADO vs GERENTE)"
```

---

### Task 5: Update `/api/branches/invite-manager` to Use `managerInviteToken`

**Files:**
- Modify: `app/api/branches/invite-manager/route.ts`

- [ ] **Step 1: Replace `inviteToken` usage with `managerInviteToken`**

In `app/api/branches/invite-manager/route.ts`, change lines 35-46 to use `managerInviteToken` instead of `inviteToken`:

Replace:
```typescript
// Generate or get existing invite token
const inviteToken = branch.inviteToken || crypto.randomUUID();

if (!branch.inviteToken) {
  await db.update(branches)
    .set({ inviteToken })
    .where(eq(branches.id, branchId));
}

// Send email via Resend
const resend = new Resend(process.env.RESEND_KEY);
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const inviteUrl = `${baseUrl}/join/${inviteToken}?email=${encodeURIComponent(email)}`;
```

With:
```typescript
// Generate or get existing manager invite token
const managerInviteToken = branch.managerInviteToken || crypto.randomUUID();

if (!branch.managerInviteToken) {
  await db.update(branches)
    .set({ managerInviteToken })
    .where(eq(branches.id, branchId));
}

// Send email via Resend
const resend = new Resend(process.env.RESEND_KEY);
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const inviteUrl = `${baseUrl}/join/${managerInviteToken}?email=${encodeURIComponent(email)}`;
```

Also update the success response (line ~87) to return the correct field:

Replace:
```typescript
return ApiHandler.success({
  message: "Invitation sent successfully",
  inviteToken
});
```

With:
```typescript
return ApiHandler.success({
  message: "Invitation sent successfully",
  managerInviteToken
});
```

- [ ] **Step 2: Run build to verify**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/branches/invite-manager/route.ts
git commit -m "feat: use managerInviteToken in invite-manager API for manager invite URLs"
```

---

### Task 6: Update Branch Details Page Types for `managerInviteToken`

**Files:**
- Modify: `app/dashboard/company/branches/[id]/page.tsx`

- [ ] **Step 1: Add `managerInviteToken` to the Branch interface**

In `app/dashboard/company/branches/[id]/page.tsx`, update the `Branch` interface (line ~33) to include the new field:

```typescript
interface Branch {
  id: string;
  name: string;
  address: string | null;
  timezone: string;
  operatingHours: any;
  location: any;
  managerId: string | null;
  inviteToken: string;
  managerInviteToken: string;
  active: boolean;
  manager?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}
```

This is a type-only change — no behavioral changes needed in this file. The QR/Smartlink in the "Onboarding" tab already uses `inviteToken` (employee-only), and the "Invitar Gerente" button already calls `/api/branches/invite-manager` (which now uses `managerInviteToken`). The existing UI is already correctly separated by concern.

- [ ] **Step 2: Run build to verify**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/company/branches/[id]/page.tsx
git commit -m "feat: add managerInviteToken to Branch interface on branch details page"
```

---

### Task 7: Backfill `managerInviteToken` for Existing Branches

**Files:**
- Create: `scripts/backfill-manager-invite-token.ts`

- [ ] **Step 1: Create a one-time script to backfill existing branches**

Some existing branches will have `managerInviteToken` auto-generated by the `DEFAULT gen_random_uuid()`, but any branches that existed before the migration may need a backfill if the default didn't apply (e.g., if they were inserted with explicit column lists that excluded `manager_invite_token`). Create the script:

```typescript
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { isNull, sql } from "drizzle-orm";

async function backfillManagerInviteTokens() {
  console.log("Backfilling managerInviteToken for branches that lack one...");

  const result = await db
    .update(branches)
    .set({
      managerInviteToken: sql`gen_random_uuid()`,
    })
    .where(isNull(branches.managerInviteToken))
    .returning({ id: branches.id });

  console.log(`Updated ${result.length} branches with new managerInviteToken`);
}

backfillManagerInviteTokens()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
```

- [ ] **Step 2: Run the backfill script**

Run: `npx tsx scripts/backfill-manager-invite-token.ts`

Expected: Output shows "Updated N branches with new managerInviteToken" where N is the count of branches that had a null `managerInviteToken`. If all branches already have tokens (from the DEFAULT), N will be 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/backfill-manager-invite-token.ts
git commit -m "feat: add backfill script for managerInviteToken on existing branches"
```

---

### Task 8: Final Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `pnpm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`

Expected: No new lint errors introduced.

- [ ] **Step 3: Manual smoke test checklist**

Verify these flows work as expected:

1. **Employee onboarding**: Visit `/join/[employee-inviteToken]` → page shows "Únete al equipo" → registering assigns role `EMPLEADO`, does NOT set `branches.managerId`
2. **Manager invitation**: Click "Invitar Gerente" on branch details → email sent with URL containing `managerInviteToken` → visiting that URL shows "Únete como Gerente" → registering assigns role `GERENTE` and sets `branches.managerId`
3. **Existing user join**: An existing user who clicks a manager invite link gets their role updated to `GERENTE` and becomes the branch manager
4. **Invalid token**: Visiting `/join/[invalid-uuid]` shows "Enlace de invitación inválido" error
5. **QR code unchanged**: The QR code on the "Onboarding" tab still uses `inviteToken` (employee token), not `managerInviteToken`
