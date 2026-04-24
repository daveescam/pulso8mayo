CREATE TYPE "public"."compliance_service_type" AS ENUM('FUMIGATION', 'FIRE_SYSTEM_CHECK', 'ELECTRICAL_INSPECTION', 'GAS_INSPECTION', 'WATER_QUALITY', 'AIR_QUALITY', 'PEST_CONTROL', 'HYGIENE_AUDIT', 'SAFETY_INSPECTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."equipment_status" AS ENUM('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_ORDER', 'DISPOSED');--> statement-breakpoint
CREATE TYPE "public"."equipment_type" AS ENUM('REFRIGERATOR', 'FREEZER', 'OVEN', 'STOVE', 'GRILL', 'FRYER', 'DISHWASHER', 'COFFEE_MACHINE', 'BLENDER', 'MIXER', 'EXHAUST_HOOD', 'AIR_CONDITIONER', 'FIRE_SUPPRESSION', 'SECURITY_CAMERA', 'POS_SYSTEM', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'CLEANING', 'CALIBRATION', 'EMERGENCY');--> statement-breakpoint
CREATE TYPE "public"."service_frequency" AS ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."service_provider_type" AS ENUM('INTERNAL', 'EXTERNAL', 'CERTIFIED');--> statement-breakpoint
CREATE TYPE "public"."warranty_status" AS ENUM('ACTIVE', 'EXPIRED', 'VOID', 'CLAIMED');--> statement-breakpoint
CREATE TABLE "branch_compliance_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"service_type" "compliance_service_type" NOT NULL,
	"service_name" text NOT NULL,
	"regulation_reference" text,
	"is_mandatory" boolean DEFAULT true,
	"frequency" "service_frequency" NOT NULL,
	"custom_days" integer,
	"provider_id" uuid,
	"provider_name" text,
	"provider_contact" text,
	"next_service_date" timestamp,
	"last_service_date" timestamp,
	"service_areas" jsonb,
	"special_instructions" text,
	"workflow_template_id" text,
	"is_active" boolean DEFAULT true,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch_equipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"catalog_id" uuid,
	"name" text NOT NULL,
	"equipment_code" text NOT NULL,
	"type" "equipment_type" NOT NULL,
	"brand" text,
	"model" text,
	"serial_number" text,
	"asset_tag" text,
	"location" text,
	"area" text,
	"specifications" jsonb,
	"purchase_date" timestamp,
	"purchase_price" integer,
	"vendor" text,
	"vendor_contact" text,
	"invoice_number" text,
	"status" "equipment_status" DEFAULT 'ACTIVE' NOT NULL,
	"status_reason" text,
	"last_maintenance_date" timestamp,
	"next_maintenance_date" timestamp,
	"maintenance_frequency" text DEFAULT 'MONTHLY',
	"is_critical" boolean DEFAULT false,
	"notes" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_service_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_config_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"service_type" "compliance_service_type" NOT NULL,
	"service_name" text NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"provider_id" uuid,
	"provider_name" text,
	"technician_name" text,
	"technician_license" text,
	"description" text,
	"work_performed" text,
	"areas_serviced" jsonb,
	"result" text DEFAULT 'PASSED',
	"findings" text,
	"recommendations" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"cost" integer,
	"invoice_number" text,
	"certificate_url" text,
	"report_url" text,
	"photos" jsonb,
	"documents" jsonb,
	"signature_url" text,
	"compliance_status" text DEFAULT 'COMPLIANT',
	"next_due_date" timestamp,
	"workflow_instance_id" uuid,
	"approved_by" text,
	"approved_at" timestamp,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"equipment_id" uuid,
	"service_config_id" uuid,
	"alert_type" text NOT NULL,
	"severity" text DEFAULT 'MEDIUM' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"status" text DEFAULT 'ACTIVE',
	"acknowledged_by" text,
	"acknowledged_at" timestamp,
	"resolved_by" text,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"notification_sent" boolean DEFAULT false,
	"notification_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "equipment_type" NOT NULL,
	"brand" text,
	"model" text,
	"serial_number_format" text,
	"specifications" jsonb,
	"default_maintenance_frequency" text,
	"default_maintenance_tasks" jsonb,
	"manual_url" text,
	"technical_specs_url" text,
	"is_active" boolean DEFAULT true,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"maintenance_type" "maintenance_type" NOT NULL,
	"status" "maintenance_status" DEFAULT 'SCHEDULED' NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"duration_minutes" integer,
	"description" text NOT NULL,
	"work_performed" text,
	"tasks_completed" jsonb,
	"parts_used" jsonb,
	"parts_cost" integer,
	"labor_cost" integer,
	"total_cost" integer,
	"provider_type" "service_provider_type" DEFAULT 'INTERNAL' NOT NULL,
	"provider_name" text,
	"provider_contact" text,
	"technician_name" text,
	"technician_license" text,
	"findings" text,
	"recommendations" text,
	"next_maintenance_date" timestamp,
	"before_photos" jsonb,
	"after_photos" jsonb,
	"documents" jsonb,
	"signature_url" text,
	"workflow_instance_id" uuid,
	"approved_by" text,
	"approved_at" timestamp,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"maintenance_type" "maintenance_type" NOT NULL,
	"frequency" "service_frequency" NOT NULL,
	"custom_days" integer,
	"tasks" jsonb NOT NULL,
	"estimated_duration_minutes" integer,
	"preferred_day_of_week" integer,
	"preferred_time_of_day" text,
	"next_scheduled_date" timestamp,
	"last_executed_date" timestamp,
	"provider_type" "service_provider_type" DEFAULT 'INTERNAL' NOT NULL,
	"default_provider_id" text,
	"workflow_template_id" text,
	"is_active" boolean DEFAULT true,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_warranties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"warranty_number" text,
	"warranty_type" text DEFAULT 'MANUFACTURER',
	"provider" text NOT NULL,
	"provider_contact" text,
	"provider_phone" text,
	"provider_email" text,
	"coverage_description" text,
	"warranty_terms" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" "warranty_status" DEFAULT 'ACTIVE' NOT NULL,
	"claims_made" integer DEFAULT 0,
	"max_claims" integer,
	"warranty_document_url" text,
	"purchase_receipt_url" text,
	"alert_days_before" integer DEFAULT 30,
	"alert_sent" boolean DEFAULT false,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"business_name" text,
	"tax_id" text,
	"provider_type" "service_provider_type" DEFAULT 'EXTERNAL' NOT NULL,
	"services" jsonb NOT NULL,
	"specializations" jsonb,
	"contact_name" text,
	"phone" text,
	"email" text,
	"address" text,
	"certifications" jsonb,
	"is_certified" boolean DEFAULT false,
	"rating" integer,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branch_compliance_services" ADD CONSTRAINT "branch_compliance_services_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_compliance_services" ADD CONSTRAINT "branch_compliance_services_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_compliance_services" ADD CONSTRAINT "branch_compliance_services_provider_id_service_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_compliance_services" ADD CONSTRAINT "branch_compliance_services_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_compliance_services" ADD CONSTRAINT "branch_compliance_services_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_equipments" ADD CONSTRAINT "branch_equipments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_equipments" ADD CONSTRAINT "branch_equipments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_equipments" ADD CONSTRAINT "branch_equipments_catalog_id_equipment_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."equipment_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_equipments" ADD CONSTRAINT "branch_equipments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_equipments" ADD CONSTRAINT "branch_equipments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_service_history" ADD CONSTRAINT "compliance_service_history_service_config_id_branch_compliance_services_id_fk" FOREIGN KEY ("service_config_id") REFERENCES "public"."branch_compliance_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_service_history" ADD CONSTRAINT "compliance_service_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_service_history" ADD CONSTRAINT "compliance_service_history_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_service_history" ADD CONSTRAINT "compliance_service_history_provider_id_service_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_service_history" ADD CONSTRAINT "compliance_service_history_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_service_history" ADD CONSTRAINT "compliance_service_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_service_history" ADD CONSTRAINT "compliance_service_history_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_alerts" ADD CONSTRAINT "equipment_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_alerts" ADD CONSTRAINT "equipment_alerts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_alerts" ADD CONSTRAINT "equipment_alerts_equipment_id_branch_equipments_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."branch_equipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_alerts" ADD CONSTRAINT "equipment_alerts_service_config_id_branch_compliance_services_id_fk" FOREIGN KEY ("service_config_id") REFERENCES "public"."branch_compliance_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_alerts" ADD CONSTRAINT "equipment_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_alerts" ADD CONSTRAINT "equipment_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_catalog" ADD CONSTRAINT "equipment_catalog_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_catalog" ADD CONSTRAINT "equipment_catalog_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_history" ADD CONSTRAINT "equipment_maintenance_history_equipment_id_branch_equipments_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."branch_equipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_history" ADD CONSTRAINT "equipment_maintenance_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_history" ADD CONSTRAINT "equipment_maintenance_history_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_history" ADD CONSTRAINT "equipment_maintenance_history_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_history" ADD CONSTRAINT "equipment_maintenance_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_history" ADD CONSTRAINT "equipment_maintenance_history_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_schedules" ADD CONSTRAINT "equipment_maintenance_schedules_equipment_id_branch_equipments_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."branch_equipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_schedules" ADD CONSTRAINT "equipment_maintenance_schedules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_schedules" ADD CONSTRAINT "equipment_maintenance_schedules_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_schedules" ADD CONSTRAINT "equipment_maintenance_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_schedules" ADD CONSTRAINT "equipment_maintenance_schedules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_warranties" ADD CONSTRAINT "equipment_warranties_equipment_id_branch_equipments_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."branch_equipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_warranties" ADD CONSTRAINT "equipment_warranties_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_warranties" ADD CONSTRAINT "equipment_warranties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_warranties" ADD CONSTRAINT "equipment_warranties_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;