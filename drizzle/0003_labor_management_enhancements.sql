-- Migration: Labor Management Enhancements
-- Date: March 22, 2026
-- Description: Add tables and fields for enhanced labor management including break compliance, employee documents, shift approvals, and overtime tracking

-- Add fields to break_logs table
ALTER TABLE break_logs 
    ADD COLUMN IF NOT EXISTS is_compliant BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS compliance_notes TEXT,
    ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMP;

-- Add fields to shift_sessions table
ALTER TABLE shift_sessions 
    ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS early_departure_minutes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS approved_by TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create employee_documents table (Expediente Laboral)
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    company_id UUID NOT NULL,
    branch_id UUID,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    file_key TEXT,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by TEXT NOT NULL,
    issue_date TIMESTAMP,
    expiration_date TIMESTAMP,
    is_valid BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    validated_by TEXT,
    validated_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    is_required BOOLEAN DEFAULT false,
    compliance_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create shift_approvals table
CREATE TABLE IF NOT EXISTS shift_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    approval_type TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    requested_for TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    reason TEXT,
    shift_session_id UUID,
    planned_shift_id UUID,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    overtime_minutes INTEGER,
    extra_data JSONB,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    approved_by TEXT,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    notified_at TIMESTAMP,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create break_compliance_rules table
CREATE TABLE IF NOT EXISTS break_compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    description TEXT,
    min_break_duration INTEGER DEFAULT 30,
    max_continuous_work INTEGER DEFAULT 300,
    meal_break_required BOOLEAN DEFAULT true,
    meal_break_min_duration INTEGER DEFAULT 30,
    max_daily_hours INTEGER DEFAULT 8,
    max_weekly_hours INTEGER DEFAULT 48,
    min_rest_between_shifts INTEGER DEFAULT 12,
    late_tolerance INTEGER DEFAULT 10,
    early_departure_tolerance INTEGER DEFAULT 10,
    enable_break_reminders BOOLEAN DEFAULT true,
    reminder_interval INTEGER DEFAULT 120,
    enable_overtime_alerts BOOLEAN DEFAULT true,
    overtime_alert_threshold INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create break_reminder_logs table
CREATE TABLE IF NOT EXISTS break_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    branch_id UUID NOT NULL,
    reminder_type TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT NOT NULL,
    triggered_at TIMESTAMP DEFAULT NOW() NOT NULL,
    sent_at TIMESTAMP,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_documents_user_id ON employee_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_company_id ON employee_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_status ON employee_documents(status);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiration ON employee_documents(expiration_date);

CREATE INDEX IF NOT EXISTS idx_shift_approvals_status ON shift_approvals(status);
CREATE INDEX IF NOT EXISTS idx_shift_approvals_requested_for ON shift_approvals(requested_for);
CREATE INDEX IF NOT EXISTS idx_shift_approvals_type ON shift_approvals(approval_type);

CREATE INDEX IF NOT EXISTS idx_break_compliance_rules_company ON break_compliance_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_break_reminder_logs_session ON break_reminder_logs(session_id);

-- Insert default break compliance rules for existing companies
INSERT INTO break_compliance_rules (company_id, rule_name, description)
SELECT 
    id,
    'Reglas Estándar NOM-035',
    'Configuración por defecto para cumplimiento de normativa laboral mexicana'
FROM companies
ON CONFLICT DO NOTHING;
