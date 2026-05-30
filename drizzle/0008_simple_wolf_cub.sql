CREATE TABLE IF NOT EXISTS "cost_records" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "company_id" uuid NOT NULL,
    "branch_id" uuid,
    "category" text NOT NULL,
    "amount" integer NOT NULL,
    "description" text,
    "reference_id" text,
    "recorded_by" uuid,
    "period_start" timestamp,
    "period_end" timestamp,
    "recorded_at" timestamp DEFAULT now() NOT NULL,
    "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "temperature_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "branch_id" uuid NOT NULL,
    "equipment_id" uuid,
    "workflow_instance_id" uuid,
    "reading_value" integer NOT NULL,
    "unit" text DEFAULT 'C',
    "location" text,
    "is_compliant" boolean DEFAULT true,
    "min_threshold" integer,
    "max_threshold" integer,
    "captured_by" uuid,
    "capture_method" text DEFAULT 'MANUAL',
    "photo_url" text,
    "notes" text,
    "timestamp" timestamp DEFAULT now() NOT NULL,
    "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "workflow_templates" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "json_schema" jsonb;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "original_template_id" text;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "is_custom" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "duracion_estimada" text;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "ai_config" jsonb;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "compliance_config" jsonb;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "completion_actions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "manager_invite_token" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
CREATE UNIQUE INDEX "branches_manager_invite_token_unique" ON "branches" USING btree ("manager_invite_token");