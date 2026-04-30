ALTER TABLE "whatsapp_messages" ADD COLUMN "status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "workflow_assignments" ADD COLUMN "reminders_sent" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "reminder_intervals" jsonb DEFAULT '[1440, 60, 30]'::jsonb;