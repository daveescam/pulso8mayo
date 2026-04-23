-- Add workflow_template_id column to planned_shifts table
ALTER TABLE "planned_shifts" ADD COLUMN "workflow_template_id" text;

-- Add comment to document the column
COMMENT ON COLUMN "planned_shifts"."workflow_template_id" IS 'Workflow asociado al turno (FK a workflow_templates.id)';
