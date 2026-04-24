CREATE TYPE "public"."compliance_alert_status" AS ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."compliance_alert_type" AS ENUM('LOW_SCORE', 'MISSED_DEADLINE', 'MISSING_WORKFLOW', 'EXPIRED_DOCUMENT', 'NON_COMPLIANCE');--> statement-breakpoint
CREATE TYPE "public"."psychosocial_risk_level" AS ENUM('MINIMO', 'BAJO', 'MEDIO', 'ALTO', 'MUY_ALTO');--> statement-breakpoint
CREATE TABLE "compliance_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"alert_type" "compliance_alert_type" NOT NULL,
	"severity" "incident_severity" NOT NULL,
	"status" "compliance_alert_status" DEFAULT 'ACTIVE' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"compliance_type" text,
	"workflow_template_id" uuid,
	"current_score" integer,
	"threshold" integer,
	"acknowledged_by" text,
	"acknowledged_at" timestamp,
	"resolved_by" text,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "psychosocial_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"entorno_organizacional" integer DEFAULT 0 NOT NULL,
	"cargas_trabajo" integer DEFAULT 0 NOT NULL,
	"liderazgo" integer DEFAULT 0 NOT NULL,
	"comunicacion" integer DEFAULT 0 NOT NULL,
	"desarrollo_profesional" integer DEFAULT 0 NOT NULL,
	"clima_laboral" integer DEFAULT 0 NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"risk_level" "psychosocial_risk_level" DEFAULT 'MINIMO' NOT NULL,
	"responses" jsonb DEFAULT '[]'::jsonb,
	"survey_version" text DEFAULT 'v1',
	"completed_at" timestamp,
	"is_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
