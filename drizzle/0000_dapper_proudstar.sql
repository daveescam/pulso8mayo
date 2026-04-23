CREATE TYPE "public"."day_of_week" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('CRITICAL', 'WARNING', 'FATAL');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('DETECTED', 'IN_REMEDIATION', 'RESOLVED', 'ESCALATED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'EMPLEADO', 'READONLY');--> statement-breakpoint
CREATE TYPE "public"."shift_type" AS ENUM('MATUTINO', 'VESPERTINO', 'NOCTURNO', 'MIXTO');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"name" text NOT NULL,
	"address" text,
	"timezone" text DEFAULT 'America/Mexico_City',
	"operating_hours" jsonb,
	"location" jsonb,
	"invite_token" uuid DEFAULT gen_random_uuid(),
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "break_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"duration_minutes" integer,
	"type" text DEFAULT 'STANDARD'
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tax_id" text,
	"plan" text DEFAULT 'FREE',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"template_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"assignee_id" text,
	"status" text DEFAULT 'PENDING',
	"current_step_index" integer DEFAULT 0,
	"total_steps" integer NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"score" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"date" text NOT NULL,
	"name" text NOT NULL,
	"affects_operation" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"step_id" text NOT NULL,
	"severity" "incident_severity" NOT NULL,
	"status" "incident_status" DEFAULT 'DETECTED',
	"title" text NOT NULL,
	"description" text,
	"initial_value" jsonb,
	"target_value" jsonb,
	"photo_url" text,
	"remediation_protocol" jsonb,
	"current_attempt" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 1,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logic_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" text NOT NULL,
	"trigger_step_id" text NOT NULL,
	"condition" jsonb NOT NULL,
	"action" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "magic_links" (
	"token" text PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"execution_id" uuid NOT NULL,
	"workflow_template_id" text NOT NULL,
	"status" text DEFAULT 'PENDING',
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"template_id" text NOT NULL,
	"recurrence_rule" jsonb,
	"assignee_role" "role",
	"assignee_id" text,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"shift_id" uuid,
	"clock_in" timestamp DEFAULT now() NOT NULL,
	"clock_out" timestamp,
	"status" text DEFAULT 'ACTIVE',
	"device_info" jsonb,
	"location_start" jsonb,
	"location_end" jsonb
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"name" text NOT NULL,
	"type" "shift_type",
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"break_minutes" integer DEFAULT 30,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"role" "role" DEFAULT 'EMPLEADO',
	"company_id" uuid,
	"branch_id" uuid,
	"phone" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category" text NOT NULL,
	"version" integer DEFAULT 1,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"compliance_tags" jsonb,
	"recurrence" jsonb,
	"estimated_duration" integer,
	"requires_verification" boolean DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX "branches_invite_token_unique" ON "branches" USING btree ("invite_token");