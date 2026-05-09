-- Add managerInviteToken column to branches table
ALTER TABLE "branches" ADD COLUMN "manager_invite_token" uuid DEFAULT gen_random_uuid();

-- Add unique index on managerInviteToken
CREATE UNIQUE INDEX IF NOT EXISTS "branches_manager_invite_token_unique" ON "branches" ("manager_invite_token");