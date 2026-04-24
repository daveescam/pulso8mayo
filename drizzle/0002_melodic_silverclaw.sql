CREATE TYPE "public"."assignment_status" AS ENUM('PENDING', 'NOTIFIED', 'STARTED', 'COMPLETED', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."assignment_type" AS ENUM('ROLE', 'USER', 'AUTO', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT');--> statement-breakpoint
CREATE TYPE "public"."blood_type" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('DETERMINATE', 'INDETERMINATE', 'PROBATION', 'TRAINING', 'SEASONAL', 'PART_TIME');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('PENDING', 'VALIDATED', 'EXPIRED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('CONTRACT', 'ID', 'PROOF_OF_ADDRESS', 'TAX_ID', 'BANK_INFO', 'CERTIFICATE', 'TRAINING', 'MEDICAL_EXAM', 'PERMIT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('ONBOARDING', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RESIGNED');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."inventory_alert_status" AS ENUM('ACTIVE', 'VIEWED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."inventory_alert_type" AS ENUM('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."inventory_batch_status" AS ENUM('AVAILABLE', 'RESERVED', 'EXPIRED', 'QUARANTINED', 'DEPLETED');--> statement-breakpoint
CREATE TYPE "public"."inventory_transaction_type" AS ENUM('RECEIVING', 'USAGE', 'ADJUSTMENT', 'TRANSFER', 'WASTE', 'RETURN');--> statement-breakpoint
CREATE TYPE "public"."inventory_transfer_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."inventory_waste_reason" AS ENUM('EXPIRED', 'DAMAGED', 'QUALITY', 'SPILLAGE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."kpi_alert_status" AS ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE');--> statement-breakpoint
CREATE TYPE "public"."kpi_frequency" AS ENUM('REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."kpi_metric_type" AS ENUM('PERCENTAGE', 'COUNT', 'AVERAGE', 'SUM', 'TIME', 'RATIO');--> statement-breakpoint
CREATE TYPE "public"."kpi_threshold_type" AS ENUM('MIN', 'MAX', 'TARGET', 'RANGE');--> statement-breakpoint
CREATE TYPE "public"."leave_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."leave_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('VACATION', 'SICK_LEAVE', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'TRAINING', 'JURY_DUTY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'COMMON_LAW');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'warning', 'error', 'success');--> statement-breakpoint
CREATE TYPE "public"."offboarding_reason" AS ENUM('VOLUNTARY_RESIGNATION', 'TERMINATION_WITH_CAUSE', 'TERMINATION_WITHOUT_CAUSE', 'CONTRACT_EXPIRED', 'RETIREMENT', 'DEATH', 'MUTUAL_AGREEMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."onboarding_step_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('BANK_TRANSFER', 'CHECK', 'CASH', 'PAYROLL_CARD');--> statement-breakpoint
CREATE TYPE "public"."performance_category" AS ENUM('TECHNICAL', 'SOFT_SKILLS', 'LEADERSHIP', 'COMMUNICATION', 'PROBLEM_SOLVING', 'TEAMWORK');--> statement-breakpoint
CREATE TYPE "public"."performance_goal_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."performance_review_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED');--> statement-breakpoint
CREATE TYPE "public"."performance_review_type" AS ENUM('SELF', 'MANAGER', 'PEER', '360');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED');--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('SELF', 'MANAGER', 'PEER', '360');--> statement-breakpoint
CREATE TYPE "public"."schedule_frequency" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE');--> statement-breakpoint
CREATE TYPE "public"."shift_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."shift_approval_type" AS ENUM('OVERTIME', 'SCHEDULE_CHANGE', 'TIME_OFF', 'SHIFT_SWAP', 'EARLY_DEPARTURE');--> statement-breakpoint
CREATE TYPE "public"."shift_change_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."vacation_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_conversation_status" AS ENUM('ACTIVE', 'WAITING_EVIDENCE', 'COMPLETED', 'TIMEOUT', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_session_status" AS ENUM('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."work_regime" AS ENUM('DAILY', 'MIXED', 'NIGHT', 'SPLIT_SHIFT', 'ON_CALL');--> statement-breakpoint
CREATE TABLE "break_compliance_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"rule_name" text NOT NULL,
	"description" text,
	"min_break_duration" integer DEFAULT 30,
	"max_continuous_work" integer DEFAULT 300,
	"meal_break_required" boolean DEFAULT true,
	"meal_break_min_duration" integer DEFAULT 30,
	"max_daily_hours" integer DEFAULT 8,
	"max_weekly_hours" integer DEFAULT 48,
	"min_rest_between_shifts" integer DEFAULT 12,
	"late_tolerance" integer DEFAULT 10,
	"early_departure_tolerance" integer DEFAULT 10,
	"enable_break_reminders" boolean DEFAULT true,
	"reminder_interval" integer DEFAULT 120,
	"enable_overtime_alerts" boolean DEFAULT true,
	"overtime_alert_threshold" integer DEFAULT 30,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "break_reminder_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"reminder_type" text NOT NULL,
	"message" text NOT NULL,
	"channel" text NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"acknowledged" boolean DEFAULT false,
	"acknowledged_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "communication_read_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"communication_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"field_name" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"performed_by" text NOT NULL,
	"performed_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"reason" text,
	"is_sensitive" boolean DEFAULT false,
	"requires_approval" boolean DEFAULT false,
	"approved_by" text,
	"approved_at" timestamp,
	"retention_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"benefit_type" text NOT NULL,
	"provider" text,
	"policy_number" text,
	"coverage_amount" integer,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"employee_contribution" integer DEFAULT 0,
	"employer_contribution" integer DEFAULT 0,
	"beneficiaries" jsonb,
	"document_id" uuid,
	"notes" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"communication_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"target_type" text NOT NULL,
	"target_ids" jsonb,
	"target_roles" jsonb,
	"status" text DEFAULT 'DRAFT',
	"is_pinned" boolean DEFAULT false,
	"sent_at" timestamp,
	"delivered_via" jsonb,
	"read_count" integer DEFAULT 0,
	"total_recipients" integer DEFAULT 0,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"contract_number" text NOT NULL,
	"contract_type" "contract_type" DEFAULT 'INDETERMINATE' NOT NULL,
	"work_regime" "work_regime" DEFAULT 'DAILY' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"probation_period_days" integer,
	"signature_date" timestamp,
	"base_salary" integer NOT NULL,
	"monthly_salary" integer,
	"weekly_salary" integer,
	"currency" text DEFAULT 'MXN',
	"has_health_insurance" boolean DEFAULT false,
	"has_life_insurance" boolean DEFAULT false,
	"has_savings_fund" boolean DEFAULT false,
	"has_food_vouchers" boolean DEFAULT false,
	"has_transportation_bonus" boolean DEFAULT false,
	"benefits_notes" text,
	"work_start_time" text,
	"work_end_time" text,
	"work_days" integer[],
	"break_duration_minutes" integer DEFAULT 60,
	"status" text DEFAULT 'ACTIVE',
	"renewal_date" timestamp,
	"auto_renew" boolean DEFAULT false,
	"contract_document_id" uuid,
	"approved_by" text,
	"approved_at" timestamp,
	"terms" text,
	"notes" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"document_type" "document_type" NOT NULL,
	"document_name" text NOT NULL,
	"document_url" text NOT NULL,
	"file_key" text,
	"file_size" integer,
	"mime_type" text,
	"uploaded_by" text NOT NULL,
	"issue_date" timestamp,
	"expiration_date" timestamp,
	"is_valid" boolean DEFAULT true,
	"status" "document_status" DEFAULT 'PENDING' NOT NULL,
	"validated_by" text,
	"validated_at" timestamp,
	"rejection_reason" text,
	"notes" text,
	"is_required" boolean DEFAULT false,
	"compliance_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_offboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"reason" "offboarding_reason" NOT NULL,
	"reason_details" text,
	"resignation_date" timestamp,
	"last_working_day" timestamp NOT NULL,
	"final_pay_date" timestamp,
	"accrued_vacation_days" integer DEFAULT 0,
	"vacation_pay" integer DEFAULT 0,
	"seniority_bonus" integer DEFAULT 0,
	"severance_pay" integer DEFAULT 0,
	"final_pay_amount" integer DEFAULT 0,
	"deductions" integer DEFAULT 0,
	"currency" text DEFAULT 'MXN',
	"assets_to_return" jsonb,
	"assets_returned" boolean DEFAULT false,
	"assets_return_date" timestamp,
	"assets_notes" text,
	"exit_interview_completed" boolean DEFAULT false,
	"exit_interview_date" timestamp,
	"exit_interview_notes" text,
	"conducted_by" text,
	"benefits_settled" boolean DEFAULT false,
	"social_security_cancelled" boolean DEFAULT false,
	"documents_archived" boolean DEFAULT false,
	"access_revoked" boolean DEFAULT false,
	"access_revoked_date" timestamp,
	"status" text DEFAULT 'IN_PROGRESS',
	"completed_date" timestamp,
	"approved_by" text,
	"approved_at" timestamp,
	"hr_notes" text,
	"notes" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"status" text DEFAULT 'IN_PROGRESS',
	"start_date" timestamp NOT NULL,
	"target_end_date" timestamp,
	"completed_date" timestamp,
	"assigned_buddy_id" text,
	"assigned_mentor_id" text,
	"total_steps" integer DEFAULT 0,
	"completed_steps" integer DEFAULT 0,
	"progress_percentage" integer DEFAULT 0,
	"notes" text,
	"hr_notes" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date_of_birth" timestamp,
	"curp" text,
	"rfc" text,
	"nss" text,
	"gender" "gender",
	"marital_status" "marital_status",
	"blood_type" "blood_type",
	"nationality" text DEFAULT 'MEXICANA',
	"personal_email" text,
	"personal_phone" text,
	"address" jsonb,
	"city" text,
	"state" text,
	"zip_code" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_email" text,
	"emergency_contact_relationship" text,
	"bank_name" text,
	"clabe" text,
	"card_number" text,
	"payment_method" "payment_method" DEFAULT 'BANK_TRANSFER',
	"employee_number" text,
	"department" text,
	"position" text,
	"supervisor_id" text,
	"hire_date" timestamp,
	"seniority_date" timestamp,
	"probation_end_date" timestamp,
	"employee_status" "employee_status" DEFAULT 'ONBOARDING',
	"is_active" boolean DEFAULT false,
	"termination_date" timestamp,
	"termination_reason" "offboarding_reason",
	"rehire_eligible" boolean DEFAULT true,
	"default_shift_id" uuid,
	"standard_hours_per_week" integer DEFAULT 48,
	"languages" jsonb,
	"skills" jsonb,
	"notes" text,
	"profile_photo_url" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_training" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"training_name" text NOT NULL,
	"training_type" text NOT NULL,
	"provider" text,
	"instructor" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"completion_date" timestamp,
	"expiration_date" timestamp,
	"status" text DEFAULT 'IN_PROGRESS',
	"grade" text,
	"passed" boolean,
	"certification_number" text,
	"issuing_authority" text,
	"is_mandatory" boolean DEFAULT false,
	"certificate_document_id" uuid,
	"cost" integer DEFAULT 0,
	"company_paid" boolean DEFAULT true,
	"notes" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"event_name" text NOT NULL,
	"conditions" jsonb,
	"is_active" boolean DEFAULT true,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"type" "inventory_alert_type" NOT NULL,
	"severity" text NOT NULL,
	"status" "inventory_alert_status" DEFAULT 'ACTIVE' NOT NULL,
	"current_stock" integer NOT NULL,
	"min_level" integer NOT NULL,
	"batch_id" uuid,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"viewed_at" timestamp,
	"resolved_at" timestamp,
	"resolved_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"supplier_id" uuid,
	"lot_number" text,
	"production_date" timestamp,
	"expiration_date" timestamp,
	"received_at" timestamp DEFAULT now(),
	"initial_quantity" integer NOT NULL,
	"current_quantity" integer NOT NULL,
	"unit_cost" integer,
	"status" "inventory_batch_status" DEFAULT 'AVAILABLE',
	"supplier_batch_info" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"barcode" text,
	"category" text,
	"unit" text DEFAULT 'UNIT' NOT NULL,
	"min_level" integer DEFAULT 0,
	"max_level" integer,
	"storage_area" text,
	"allergen_info" text,
	"storage_requirements" text,
	"typical_shelf_life_days" integer,
	"active" boolean DEFAULT true,
	"supplier_id" uuid,
	"last_cost" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"batch_id" uuid,
	"type" "inventory_transaction_type" NOT NULL,
	"quantity_change" integer NOT NULL,
	"reason" text,
	"reference_id" text,
	"performed_by" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"previous_cost" integer,
	"new_cost" integer NOT NULL,
	"supplier_id" uuid,
	"changed_by" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transfer_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"batch_id" uuid,
	"requested_quantity" integer NOT NULL,
	"approved_quantity" integer,
	"shipped_quantity" integer,
	"received_quantity" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_number" text NOT NULL,
	"from_branch_id" uuid NOT NULL,
	"to_branch_id" uuid NOT NULL,
	"status" "inventory_transfer_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" text NOT NULL,
	"approved_by" text,
	"shipped_by" text,
	"received_by" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"cancelled_at" timestamp,
	"notes" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_transfers_transfer_number_unique" UNIQUE("transfer_number")
);
--> statement-breakpoint
CREATE TABLE "inventory_waste" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"batch_id" uuid,
	"item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text NOT NULL,
	"reason" "inventory_waste_reason" NOT NULL,
	"cost_per_unit" integer,
	"total_loss" integer,
	"recorded_by" text NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kpi_id" uuid NOT NULL,
	"branch_id" uuid,
	"alert_type" text NOT NULL,
	"status" "kpi_alert_status" DEFAULT 'ACTIVE' NOT NULL,
	"triggered_value" integer NOT NULL,
	"threshold" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"acknowledged_by" text,
	"acknowledged_at" timestamp,
	"resolution_notes" text,
	"resolved_by" text,
	"resolved_at" timestamp,
	"notified_users" jsonb,
	"notification_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"formula" text NOT NULL,
	"metric_type" "kpi_metric_type" NOT NULL,
	"target" integer,
	"warning_threshold" integer,
	"critical_threshold" integer,
	"threshold_type" "kpi_threshold_type" DEFAULT 'TARGET',
	"frequency" "kpi_frequency" DEFAULT 'DAILY' NOT NULL,
	"data_retention_days" integer DEFAULT 90,
	"unit" text DEFAULT '',
	"decimal_places" integer DEFAULT 2,
	"category" text DEFAULT 'OPERATIONS',
	"active" boolean DEFAULT true,
	"is_system" boolean DEFAULT false,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kpi_id" uuid NOT NULL,
	"branch_id" uuid,
	"value" integer NOT NULL,
	"raw_value" text,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"status" text DEFAULT 'NORMAL',
	"target" integer,
	"target_achieved" boolean,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"total_entitlement" integer NOT NULL,
	"used" integer DEFAULT 0,
	"pending" integer DEFAULT 0,
	"balance" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"leave_type_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_days" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "leave_request_status" DEFAULT 'PENDING' NOT NULL,
	"supporting_document_id" uuid,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"rejected_by" text,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_paid" boolean DEFAULT true,
	"requires_documentation" boolean DEFAULT false,
	"max_days_per_year" integer,
	"accrual_rate" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"communication_type" text NOT NULL,
	"variables" jsonb,
	"is_active" boolean DEFAULT true,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"whatsapp_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"workflow_assignments" boolean DEFAULT true NOT NULL,
	"workflow_due_soon" boolean DEFAULT true NOT NULL,
	"workflow_overdue" boolean DEFAULT true NOT NULL,
	"incidents" boolean DEFAULT true NOT NULL,
	"inventory_alerts" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"action_url" text,
	"action_label" text,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"onboarding_id" uuid NOT NULL,
	"step_name" text NOT NULL,
	"step_category" text NOT NULL,
	"description" text,
	"assigned_to" text,
	"status" "onboarding_step_status" DEFAULT 'PENDING',
	"due_date" timestamp,
	"completed_date" timestamp,
	"completed_by" text,
	"required_document_id" uuid,
	"notes" text,
	"depends_on_step_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"status" "performance_goal_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"target_date" timestamp,
	"completed_date" timestamp,
	"metrics" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_review_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "performance_category" NOT NULL,
	"weight" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_review_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"criteria_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"review_type" "performance_review_type" NOT NULL,
	"review_period" text NOT NULL,
	"review_date" timestamp DEFAULT now() NOT NULL,
	"status" "performance_review_status" DEFAULT 'DRAFT' NOT NULL,
	"overall_rating" integer,
	"strengths" text,
	"areas_for_improvement" text,
	"goals" jsonb,
	"achievements" jsonb,
	"development_plan" text,
	"comments" text,
	"submitted_at" timestamp,
	"completed_at" timestamp,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"shift_date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"template_id" uuid,
	"workflow_template_id" text,
	"role" text NOT NULL,
	"status" text DEFAULT 'DRAFT',
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_execution_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"company_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"data_source" text NOT NULL,
	"executed_by" text NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"filters" jsonb,
	"fields" jsonb,
	"status" text NOT NULL,
	"row_count" integer,
	"file_size" integer,
	"file_url" text,
	"file_key" text,
	"duration_ms" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"report_type" text NOT NULL,
	"data_source" text NOT NULL,
	"fields" jsonb NOT NULL,
	"filters" jsonb,
	"group_by" jsonb,
	"sort_by" jsonb,
	"schedule" jsonb,
	"next_run_at" timestamp,
	"last_run_at" timestamp,
	"last_run_status" text,
	"delivery_method" text,
	"delivery_emails" text[],
	"created_by" text NOT NULL,
	"is_public" boolean DEFAULT false,
	"shared_with" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"contract_id" uuid,
	"previous_salary" integer,
	"new_salary" integer NOT NULL,
	"percentage_change" integer,
	"change_type" text NOT NULL,
	"reason" text,
	"effective_date" timestamp NOT NULL,
	"approved_by" text NOT NULL,
	"approved_at" timestamp DEFAULT now() NOT NULL,
	"document_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"search_criteria" jsonb NOT NULL,
	"entity_type" text DEFAULT 'EMPLOYEE' NOT NULL,
	"is_shared" boolean DEFAULT false,
	"shared_with" text[],
	"usage_count" integer DEFAULT 0,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"approval_type" "shift_approval_type" NOT NULL,
	"requested_by" text NOT NULL,
	"requested_for" text NOT NULL,
	"shift_session_id" uuid,
	"planned_shift_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"reason" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"duration_minutes" integer,
	"overtime_minutes" integer,
	"extra_data" jsonb,
	"status" "shift_approval_status" DEFAULT 'PENDING' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"rejection_reason" text,
	"notified_at" timestamp,
	"reminder_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"requested_by" text NOT NULL,
	"requested_shift_id" uuid NOT NULL,
	"target_shift_id" uuid,
	"counterparty_id" text NOT NULL,
	"counterparty_shift_id" uuid,
	"reason" text NOT NULL,
	"notes" text,
	"status" "shift_change_request_status" DEFAULT 'PENDING' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"rejected_by" text,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"counterparty_accepted" boolean,
	"counterparty_response_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"role" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"days_of_week" integer[],
	"valid_from" text NOT NULL,
	"valid_until" text,
	"created_by" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"tax_id" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vacation_accruals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer,
	"days_accrued" integer NOT NULL,
	"days_taken" integer DEFAULT 0,
	"days_balance" integer NOT NULL,
	"years_of_service" integer NOT NULL,
	"applicable_law_days" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"is_processed" boolean DEFAULT false,
	"processed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_days" integer NOT NULL,
	"status" "vacation_status" DEFAULT 'PENDING' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"rejected_by" text,
	"rejected_at" timestamp,
	"cancelled_at" timestamp,
	"reason" text,
	"manager_comments" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversation_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_phone" text NOT NULL,
	"user_id" text,
	"workflow_instance_id" uuid,
	"current_step_id" uuid,
	"step_index" integer,
	"status" "whatsapp_conversation_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"context" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"message_type" text NOT NULL,
	"content" text,
	"media_url" text,
	"command" text,
	"processed" boolean DEFAULT false,
	"processing_error" text,
	"external_message_id" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"phone_number" text,
	"status" "whatsapp_session_status" DEFAULT 'DISCONNECTED' NOT NULL,
	"qr_code" text,
	"qr_code_expires_at" timestamp,
	"connected_at" timestamp,
	"last_activity_at" timestamp,
	"disconnected_at" timestamp,
	"webhook_url" text,
	"is_active" boolean DEFAULT true,
	"last_error" text,
	"error_count" integer DEFAULT 0,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"schedule_id" uuid,
	"assigned_to" text NOT NULL,
	"assigned_by" text,
	"assignment_type" "assignment_type" NOT NULL,
	"status" "assignment_status" DEFAULT 'PENDING',
	"notified_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"due_date" timestamp,
	"is_overdue" boolean DEFAULT false,
	"priority" "priority" DEFAULT 'MEDIUM',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_instance_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"step_id" text NOT NULL,
	"status" text DEFAULT 'PENDING',
	"value" jsonb,
	"ai_analysis" jsonb,
	"evidence_url" text,
	"comment" text,
	"completed_at" timestamp,
	"completed_by" text
);
--> statement-breakpoint
CREATE TABLE "workflow_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_template_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"assignee_id" text,
	"session_id" uuid,
	"schedule_id" uuid,
	"assignment_id" uuid,
	"status" text DEFAULT 'PENDING',
	"started_at" timestamp,
	"completed_at" timestamp,
	"due_date" timestamp,
	"priority" "priority" DEFAULT 'MEDIUM',
	"current_step_id" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"score" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"assignment_type" "assignment_type" DEFAULT 'AUTO' NOT NULL,
	"assigned_role" "role",
	"assigned_user_id" text,
	"frequency" "schedule_frequency" NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"time_of_day" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"title" text NOT NULL,
	"description" text,
	"priority" "priority" DEFAULT 'MEDIUM',
	"last_executed_at" timestamp,
	"next_execution_at" timestamp,
	"execution_count" integer DEFAULT 0,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "executions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "logic_rules" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schedule_configs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shifts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "executions" CASCADE;--> statement-breakpoint
DROP TABLE "logic_rules" CASCADE;--> statement-breakpoint
DROP TABLE "schedule_configs" CASCADE;--> statement-breakpoint
DROP TABLE "shifts" CASCADE;--> statement-breakpoint
ALTER TABLE "holidays" ALTER COLUMN "company_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "holidays" ALTER COLUMN "date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_sessions" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_templates" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "workflow_templates" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "workflow_templates" ALTER COLUMN "company_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_templates" ALTER COLUMN "category" SET DEFAULT 'GENERAL';--> statement-breakpoint
ALTER TABLE "workflow_templates" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "manager_id" text;--> statement-breakpoint
ALTER TABLE "break_logs" ADD COLUMN "is_compliant" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "break_logs" ADD COLUMN "compliance_notes" text;--> statement-breakpoint
ALTER TABLE "break_logs" ADD COLUMN "reminded_at" timestamp;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "billing_status" text DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "instance_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "branch_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "detected_by" text;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "escalation_chain" jsonb;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "resolution" text;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "resolved_by" text;--> statement-breakpoint
ALTER TABLE "magic_links" ADD COLUMN "instance_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "planned_shift_id" uuid;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "scheduled_start_time" text;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "scheduled_end_time" text;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "check_in_time" timestamp;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "check_out_time" timestamp;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "total_break_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "total_work_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "overtime_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "check_in_geolocation" jsonb;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "check_out_geolocation" jsonb;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "compliance_flags" jsonb;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "late_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "early_departure_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "requires_approval" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "break_reminder_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "started_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD COLUMN "ended_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_phone" text;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "compliance_type" text;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "regulation_section" text;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "required_frequency" text;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "is_critical" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "communication_read_receipts" ADD CONSTRAINT "communication_read_receipts_communication_id_employee_communications_id_fk" FOREIGN KEY ("communication_id") REFERENCES "public"."employee_communications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_read_receipts" ADD CONSTRAINT "communication_read_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_audit_logs" ADD CONSTRAINT "employee_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_communications" ADD CONSTRAINT "employee_communications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_communications" ADD CONSTRAINT "employee_communications_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_offboarding" ADD CONSTRAINT "employee_offboarding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_offboarding" ADD CONSTRAINT "employee_offboarding_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_offboarding" ADD CONSTRAINT "employee_offboarding_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_onboarding" ADD CONSTRAINT "employee_onboarding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_onboarding" ADD CONSTRAINT "employee_onboarding_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_onboarding" ADD CONSTRAINT "employee_onboarding_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_training" ADD CONSTRAINT "employee_training_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_training" ADD CONSTRAINT "employee_training_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_waste" ADD CONSTRAINT "inventory_waste_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_waste" ADD CONSTRAINT "inventory_waste_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_waste" ADD CONSTRAINT "inventory_waste_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_waste" ADD CONSTRAINT "inventory_waste_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_alerts" ADD CONSTRAINT "kpi_alerts_kpi_id_kpi_definitions_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpi_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_history" ADD CONSTRAINT "kpi_history_kpi_id_kpi_definitions_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpi_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_onboarding_id_employee_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."employee_onboarding"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_goals" ADD CONSTRAINT "performance_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_goals" ADD CONSTRAINT "performance_goals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_goals" ADD CONSTRAINT "performance_goals_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_review_criteria" ADD CONSTRAINT "performance_review_criteria_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_review_responses" ADD CONSTRAINT "performance_review_responses_review_id_performance_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."performance_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_review_responses" ADD CONSTRAINT "performance_review_responses_criteria_id_performance_review_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."performance_review_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_execution_history" ADD CONSTRAINT "report_execution_history_template_id_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_execution_history" ADD CONSTRAINT "report_execution_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_history" ADD CONSTRAINT "salary_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_history" ADD CONSTRAINT "salary_history_contract_id_employee_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."employee_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_accruals" ADD CONSTRAINT "vacation_accruals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_accruals" ADD CONSTRAINT "vacation_accruals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversation_states" ADD CONSTRAINT "whatsapp_conversation_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversation_states" ADD CONSTRAINT "whatsapp_conversation_states_workflow_instance_id_workflow_instances_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_session_id_whatsapp_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_shift" ON "planned_shifts" USING btree ("user_id","shift_date","start_time");--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" DROP COLUMN "affects_operation";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "execution_id";--> statement-breakpoint
ALTER TABLE "magic_links" DROP COLUMN "execution_id";--> statement-breakpoint
ALTER TABLE "shift_sessions" DROP COLUMN "shift_id";--> statement-breakpoint
ALTER TABLE "shift_sessions" DROP COLUMN "clock_in";--> statement-breakpoint
ALTER TABLE "shift_sessions" DROP COLUMN "clock_out";--> statement-breakpoint
ALTER TABLE "shift_sessions" DROP COLUMN "device_info";--> statement-breakpoint
ALTER TABLE "shift_sessions" DROP COLUMN "location_start";--> statement-breakpoint
ALTER TABLE "shift_sessions" DROP COLUMN "location_end";--> statement-breakpoint
ALTER TABLE "workflow_templates" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "workflow_templates" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "workflow_templates" DROP COLUMN "compliance_tags";--> statement-breakpoint
ALTER TABLE "workflow_templates" DROP COLUMN "recurrence";--> statement-breakpoint
ALTER TABLE "workflow_templates" DROP COLUMN "estimated_duration";--> statement-breakpoint
ALTER TABLE "workflow_templates" DROP COLUMN "requires_verification";--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_unique" UNIQUE("token");