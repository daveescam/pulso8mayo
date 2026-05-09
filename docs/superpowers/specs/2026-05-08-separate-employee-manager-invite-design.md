# Separate Employee vs Manager Invite Tokens

## Problem
The current smartlink (`/join/[token]`) always assigns role `GERENTE` regardless of whether the user was invited via the QR onboarding link (meant for employees) or via the email invitation button (meant for managers). There is a single `inviteToken` per branch used for both flows.

## Solution
Add a separate `managerInviteToken` to the `branches` table. The existing `inviteToken` becomes employee-only. Manager invitations use the new token, ensuring role assignment is determined by which token the user used — not editable by the user.

## Changes

### 1. Database Schema (`lib/db/schema/core.ts`)
- Add `managerInviteToken: uuid("manager_invite_token").default(sql\`gen_random_uuid()\`)` to `branches` table
- Add `uniqueIndex("branches_manager_invite_token_unique").on(table.managerInviteToken)`

### 2. API `/api/join/route.ts`
- When a token is received, query branches by BOTH `inviteToken` and `managerInviteToken`
- If matches `inviteToken` → role = `EMPLEADO`, do NOT set `branches.managerId`
- If matches `managerInviteToken` → role = `GERENTE`, set `branches.managerId`

### 3. API `/api/join/info/route.ts`
- Accept token and search both `inviteToken` and `managerInviteToken`
- Return `role: "EMPLEADO" | "GERENTE"` in the response alongside branch info

### 4. Page `/join/[token]/page.tsx`
- Display dynamic text based on `role` from `/api/join/info`:
  - Empleado: "Únete al equipo de {branch}"
  - Gerente: "Únete como gerente de {branch}"

### 5. API `/api/branches/invite-manager/route.ts`
- Use `managerInviteToken` (not `inviteToken`) to build the invite URL in the email
- Generate `managerInviteToken` if the branch doesn't have one yet

### 6. Branch Details Page (`app/dashboard/company/branches/[id]/page.tsx`)
- QR/Smartlink in "Onboarding" tab continues using `inviteToken` (employees)
- "Invitar Gerente" button sends email with URL using `managerInviteToken`

## Security
- The manager token is only included in email invitations, never shown in the QR code
- Users cannot escalate to manager role by modifying the smartlink URL
- Both tokens are auto-generated UUIDs, non-guessable
