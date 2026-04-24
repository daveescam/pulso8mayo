import { pgTable, text, timestamp, boolean, uuid, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { companies, branches } from "./core";
import { users } from "./auth";

// Equipment status enum
export const equipmentStatusEnum = pgEnum("equipment_status", [
  'ACTIVE',
  'INACTIVE',
  'UNDER_MAINTENANCE',
  'OUT_OF_ORDER',
  'DISPOSED'
]);

// Equipment type enum
export const equipmentTypeEnum = pgEnum("equipment_type", [
  'REFRIGERATOR',
  'FREEZER',
  'OVEN',
  'STOVE',
  'GRILL',
  'FRYER',
  'DISHWASHER',
  'COFFEE_MACHINE',
  'BLENDER',
  'MIXER',
  'EXHAUST_HOOD',
  'AIR_CONDITIONER',
  'FIRE_SUPPRESSION',
  'SECURITY_CAMERA',
  'POS_SYSTEM',
  'OTHER'
]);

// Warranty status enum
export const warrantyStatusEnum = pgEnum("warranty_status", [
  'ACTIVE',
  'EXPIRED',
  'VOID',
  'CLAIMED'
]);

// Maintenance type enum
export const maintenanceTypeEnum = pgEnum("maintenance_type", [
  'PREVENTIVE',
  'CORRECTIVE',
  'INSPECTION',
  'CLEANING',
  'CALIBRATION',
  'EMERGENCY'
]);

// Maintenance status enum
export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE'
]);

// Service provider type enum
export const serviceProviderTypeEnum = pgEnum("service_provider_type", [
  'INTERNAL',
  'EXTERNAL',
  'CERTIFIED'
]);

// Compliance service type enum
export const complianceServiceTypeEnum = pgEnum("compliance_service_type", [
  'FUMIGATION',
  'FIRE_SYSTEM_CHECK',
  'ELECTRICAL_INSPECTION',
  'GAS_INSPECTION',
  'WATER_QUALITY',
  'AIR_QUALITY',
  'PEST_CONTROL',
  'HYGIENE_AUDIT',
  'SAFETY_INSPECTION',
  'OTHER'
]);

// Compliance service frequency enum
export const serviceFrequencyEnum = pgEnum("service_frequency", [
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'BIMONTHLY',
  'QUARTERLY',
  'SEMIANNUAL',
  'ANNUAL',
  'CUSTOM'
]);

// ============================================
// EQUIPMENT TABLES
// ============================================

// Equipment catalog - Master list of equipment types
export const equipmentCatalog = pgTable("equipment_catalog", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Equipment details
  name: text("name").notNull(),
  type: equipmentTypeEnum("type").notNull(),
  brand: text("brand"),
  model: text("model"),
  serialNumberFormat: text("serial_number_format"), // Format hint for serial numbers
  
  // Specifications
  specifications: jsonb("specifications"), // { power, voltage, dimensions, capacity, etc. }
  
  // Maintenance schedule defaults
  defaultMaintenanceFrequency: text("default_maintenance_frequency"), // 'WEEKLY', 'MONTHLY', etc.
  defaultMaintenanceTasks: jsonb("default_maintenance_tasks"), // Array of standard tasks
  
  // Documentation
  manualUrl: text("manual_url"),
  technicalSpecsUrl: text("technical_specs_url"),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Audit
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Branch equipments - Actual equipment instances per branch
export const branchEquipments = pgTable("branch_equipments", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  catalogId: uuid("catalog_id").references(() => equipmentCatalog.id),
  
  // Equipment identification
  name: text("name").notNull(),
  equipmentCode: text("equipment_code").notNull(), // Internal code like "REF-001"
  type: equipmentTypeEnum("type").notNull(),
  
  // Details
  brand: text("brand"),
  model: text("model"),
  serialNumber: text("serial_number"),
  assetTag: text("asset_tag"), // Asset tracking tag
  
  // Location within branch
  location: text("location"), // e.g., "Cocina Principal", "Área de Bebidas"
  area: text("area"), // e.g., "Back of House", "Front of House"
  
  // Specifications
  specifications: jsonb("specifications"), // Specific config for this instance
  
  // Purchase information
  purchaseDate: timestamp("purchase_date"),
  purchasePrice: integer("purchase_price"), // In cents
  vendor: text("vendor"),
  vendorContact: text("vendor_contact"),
  invoiceNumber: text("invoice_number"),
  
  // Status
  status: equipmentStatusEnum("status").default('ACTIVE').notNull(),
  statusReason: text("status_reason"), // Why it's inactive/disposed
  
  // Maintenance tracking
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  maintenanceFrequency: text("maintenance_frequency").default('MONTHLY'), // 'WEEKLY', 'MONTHLY', 'QUARTERLY'
  
  // Criticality
  isCritical: boolean("is_critical").default(false), // If equipment failure stops operations
  
  // Notes
  notes: text("notes"),
  
  // Audit
  createdBy: text("created_by").notNull().references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Equipment warranties
export const equipmentWarranties = pgTable("equipment_warranties", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  equipmentId: uuid("equipment_id").notNull().references(() => branchEquipments.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Warranty details
  warrantyNumber: text("warranty_number"),
  warrantyType: text("warranty_type").default('MANUFACTURER'), // MANUFACTURER, EXTENDED, THIRD_PARTY
  provider: text("provider").notNull(), // Company providing warranty
  providerContact: text("provider_contact"),
  providerPhone: text("provider_phone"),
  providerEmail: text("provider_email"),
  
  // Coverage
  coverageDescription: text("coverage_description"), // What's covered
  warrantyTerms: text("warranty_terms"), // Full terms text
  
  // Dates
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Status
  status: warrantyStatusEnum("status").default('ACTIVE').notNull(),
  
  // Claim tracking
  claimsMade: integer("claims_made").default(0),
  maxClaims: integer("max_claims"), // null = unlimited
  
  // Documentation
  warrantyDocumentUrl: text("warranty_document_url"),
  purchaseReceiptUrl: text("purchase_receipt_url"),
  
  // Alerts
  alertDaysBefore: integer("alert_days_before").default(30), // Days before expiration to alert
  alertSent: boolean("alert_sent").default(false),
  
  // Audit
  createdBy: text("created_by").notNull().references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Equipment maintenance history
export const equipmentMaintenanceHistory = pgTable("equipment_maintenance_history", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  equipmentId: uuid("equipment_id").notNull().references(() => branchEquipments.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  
  // Maintenance details
  maintenanceType: maintenanceTypeEnum("maintenance_type").notNull(),
  status: maintenanceStatusEnum("status").default('SCHEDULED').notNull(),
  
  // Scheduling
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  durationMinutes: integer("duration_minutes"), // How long it took
  
  // Work performed
  description: text("description").notNull(),
  workPerformed: text("work_performed"), // Detailed description of work done
  tasksCompleted: jsonb("tasks_completed"), // Array of { task, completed, notes }
  
  // Parts and materials
  partsUsed: jsonb("parts_used"), // [{ name, quantity, cost, partNumber }]
  partsCost: integer("parts_cost"), // Total cost of parts in cents
  laborCost: integer("labor_cost"), // Labor cost in cents
  totalCost: integer("total_cost"), // Total cost in cents
  
  // Provider
  providerType: serviceProviderTypeEnum("provider_type").default('INTERNAL').notNull(),
  providerName: text("provider_name"), // Company or technician name
  providerContact: text("provider_contact"),
  technicianName: text("technician_name"), // Specific technician
  technicianLicense: text("technician_license"), // License/certification number
  
  // Results
  findings: text("findings"), // What was found during maintenance
  recommendations: text("recommendations"), // Future recommendations
  nextMaintenanceDate: timestamp("next_maintenance_date"), // Calculated next date
  
  // Evidence
  beforePhotos: jsonb("before_photos"), // Array of photo URLs
  afterPhotos: jsonb("after_photos"), // Array of photo URLs
  documents: jsonb("documents"), // Array of document URLs (reports, invoices)
  signatureUrl: text("signature_url"), // Technician signature
  
  // Workflow link (if maintenance was done via workflow)
  workflowInstanceId: uuid("workflow_instance_id"),
  
  // Approval
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Audit
  createdBy: text("created_by").notNull().references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Equipment maintenance schedules (recurring)
export const equipmentMaintenanceSchedules = pgTable("equipment_maintenance_schedules", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  equipmentId: uuid("equipment_id").notNull().references(() => branchEquipments.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  
  // Schedule configuration
  maintenanceType: maintenanceTypeEnum("maintenance_type").notNull(),
  frequency: serviceFrequencyEnum("frequency").notNull(),
  customDays: integer("custom_days"), // For CUSTOM frequency
  
  // Tasks to perform
  tasks: jsonb("tasks").notNull(), // Array of task descriptions
  estimatedDurationMinutes: integer("estimated_duration_minutes"),
  
  // Timing
  preferredDayOfWeek: integer("preferred_day_of_week"), // 0=Sunday, 1=Monday, etc.
  preferredTimeOfDay: text("preferred_time_of_day"), // "08:00"
  
  // Next scheduled
  nextScheduledDate: timestamp("next_scheduled_date"),
  lastExecutedDate: timestamp("last_executed_date"),
  
  // Provider
  providerType: serviceProviderTypeEnum("provider_type").default('INTERNAL').notNull(),
  defaultProviderId: text("default_provider_id"), // External provider ID
  
  // Workflow template to use
  workflowTemplateId: text("workflow_template_id"),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Audit
  createdBy: text("created_by").notNull().references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// COMPLIANCE SERVICES TABLES
// ============================================

// Service providers (external companies that provide compliance services)
export const serviceProviders = pgTable("service_providers", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Provider details
  name: text("name").notNull(),
  businessName: text("business_name"),
  taxId: text("tax_id"), // RFC
  providerType: serviceProviderTypeEnum("provider_type").default('EXTERNAL').notNull(),
  
  // Services offered
  services: jsonb("services").notNull(), // Array of complianceServiceType
  specializations: jsonb("specializations"), // Array of specific specializations
  
  // Contact
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  
  // Certifications
  certifications: jsonb("certifications"), // [{ name, issuingAuthority, certificateNumber, expirationDate }]
  isCertified: boolean("is_certified").default(false),
  
  // Rating
  rating: integer("rating"), // 1-5
  notes: text("notes"),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Audit
  createdBy: text("created_by").notNull().references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Compliance services configuration per branch
export const branchComplianceServices = pgTable("branch_compliance_services", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  
  // Service configuration
  serviceType: complianceServiceTypeEnum("service_type").notNull(),
  serviceName: text("service_name").notNull(), // e.g., "Fumigación Mensual"
  
  // Regulatory information
  regulationReference: text("regulation_reference"), // e.g., "NOM-251-SSA1-2009"
  isMandatory: boolean("is_mandatory").default(true),
  
  // Schedule
  frequency: serviceFrequencyEnum("frequency").notNull(),
  customDays: integer("custom_days"), // For CUSTOM frequency
  
  // Provider
  providerId: uuid("provider_id").references(() => serviceProviders.id),
  providerName: text("provider_name"), // If no provider registered yet
  providerContact: text("provider_contact"),
  
  // Next service
  nextServiceDate: timestamp("next_service_date"),
  lastServiceDate: timestamp("last_service_date"),
  
  // Scope
  serviceAreas: jsonb("service_areas"), // Areas to be serviced ["Cocina", "Comedor", "Almacén"]
  specialInstructions: text("special_instructions"),
  
  // Workflow
  workflowTemplateId: text("workflow_template_id"), // Template to use for this service
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Audit
  createdBy: text("created_by").notNull().references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Compliance service history
export const complianceServiceHistory = pgTable("compliance_service_history", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  serviceConfigId: uuid("service_config_id").notNull().references(() => branchComplianceServices.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  
  // Service details
  serviceType: complianceServiceTypeEnum("service_type").notNull(),
  serviceName: text("service_name").notNull(),
  
  // Scheduling
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  
  // Provider
  providerId: uuid("provider_id").references(() => serviceProviders.id),
  providerName: text("provider_name"),
  technicianName: text("technician_name"),
  technicianLicense: text("technician_license"),
  
  // Work performed
  description: text("description"),
  workPerformed: text("work_performed"),
  areasServiced: jsonb("areas_serviced"), // Areas that were serviced
  
  // Results
  result: text("result").default('PASSED'), // PASSED, FAILED, CONDITIONAL, PENDING
  findings: text("findings"),
  recommendations: text("recommendations"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  
  // Cost
  cost: integer("cost"), // In cents
  invoiceNumber: text("invoice_number"),
  
  // Documentation
  certificateUrl: text("certificate_url"), // Compliance certificate
  reportUrl: text("report_url"), // Service report
  photos: jsonb("photos"), // Array of photo URLs
  documents: jsonb("documents"), // Additional documents
  signatureUrl: text("signature_url"),
  
  // Regulatory compliance
  complianceStatus: text("compliance_status").default('COMPLIANT'), // COMPLIANT, NON_COMPLIANT, PENDING
  nextDueDate: timestamp("next_due_date"), // When next service is due
  
  // Workflow link
  workflowInstanceId: uuid("workflow_instance_id"),
  
  // Approval
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Audit
  createdBy: text("created_by").notNull().references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Equipment alerts and notifications
export const equipmentAlerts = pgTable("equipment_alerts", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  equipmentId: uuid("equipment_id").references(() => branchEquipments.id),
  serviceConfigId: uuid("service_config_id").references(() => branchComplianceServices.id),
  
  // Alert details
  alertType: text("alert_type").notNull(), // MAINTENANCE_DUE, WARRANTY_EXPIRING, SERVICE_DUE, EQUIPMENT_FAILURE
  severity: text("severity").notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, CRITICAL
  title: text("title").notNull(),
  description: text("description"),
  
  // Due dates
  dueDate: timestamp("due_date"),
  
  // Status
  status: text("status").default('ACTIVE'), // ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED
  acknowledgedBy: text("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: text("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  // Notification tracking
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
