import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check, boolean, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./user";

// Main companies table - stores organization profiles with Turkish business identifiers and lifecycle data 
export const company = pgTable('companies', {
  /* Core identifier */
  id: text('id').primaryKey(),

  /* Basic company information */
  name: varchar('name', { length: 255 }).notNull(),
  fullName: text('full_name'),
  companyLogoUrl: text('company_logo_url'),
  companyType: varchar('company_type', { length: 100 }),

  /* ERP status & categorisation */
  status: varchar('status', { length: 50 }).default('active').notNull(),
  industry: varchar('industry', { length: 100 }),

  /* Contact information */
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),

  /* Address */
  address: text('address'),
  district: varchar('district', { length: 100 }),
  city: varchar('city', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),

  /* Financial & legal – Türkiye specific */
  taxOffice: varchar('tax_office', { length: 100 }),
  taxNumber: varchar('tax_number', { length: 50 }),
  mersisNumber: varchar('mersis_number', { length: 50 }),

  /* Financial – general */
  defaultCurrency: varchar('default_currency', { length: 3 }).default('TRY').notNull(),

  /* Relationships & metadata */
  parentCompanyId: text('parent_company_id'),
  notes: text('notes'),
  metadata: jsonb('metadata'),

  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  // Uniqueness constraints for identifiers
  unique('companies_tax_number_unique').on(table.taxNumber),
  unique('companies_mersis_number_unique').on(table.mersisNumber),

  // Performance indexes for frequently queried columns
  index('companies_name_idx').on(table.name),
  index('companies_email_idx').on(table.email),
  index('companies_status_idx').on(table.status),
  index('companies_parent_idx').on(table.parentCompanyId),
  index('companies_industry_idx').on(table.industry),
  index('companies_city_idx').on(table.city),
  index('companies_company_type_idx').on(table.companyType),
  index('companies_created_at_idx').on(table.createdAt),
  index('companies_updated_at_idx').on(table.updatedAt),
  // Composite indexes for common query patterns
  index('companies_status_created_idx').on(table.status, table.createdAt),
  index('companies_industry_status_idx').on(table.industry, table.status),
  
  // Enhanced data validation constraints
  check('companies_email_check', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('companies_phone_check', sql`phone IS NULL OR phone ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('companies_currency_check', sql`default_currency ~* '^[A-Z]{3}$'`),
  // Temporarily removed tax number constraint due to existing data
  // check('companies_tax_number_check', sql`tax_number IS NULL OR tax_number ~* '^[0-9]{10,11}$'`),
  // check('companies_mersis_number_check', sql`mersis_number IS NULL OR mersis_number ~* '^[0-9]{16}$'`),
  // check('companies_postal_code_check', sql`postal_code IS NULL OR postal_code ~* '^[0-9]{5}$'`),
  // check('companies_website_check', sql`website IS NULL OR website ~* '^https?://.*\\..*'`),
  // check('companies_phone_format_check', sql`phone IS NULL OR length(phone) >= 10`),
]);

// Departments table - organizational divisions within companies with goals and responsibilities 
export const department = pgTable('departments', { 
  id: text('id').primaryKey(), 
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(), 

  // Hierarchical structure: allows nested departments
  parentDepartmentId: text('parent_department_id'),

  // Optional short code for integrations and reporting
  code: varchar('code', { length: 20 }),

  name: varchar('name', { length: 255 }).notNull(), 
  description: text('description'), 
  responsibilityArea: text('responsibility_area'), 
  
  /* Goals - changed to jsonb for structured storage */
  goals: jsonb('goals').default({ shortTerm: null, mediumTerm: null, longTerm: null }).notNull(),

  // Link to the user managing the department
  managerId: text('manager_id').references(() => user.id),

  // Optional assignment of department to a company location
  locationId: text('location_id').references(() => companyLocation.id),

  mailAddress: varchar('mail_address', { length: 255 }), 
  notes: text('notes'), 
  createdAt: timestamp('created_at').defaultNow().notNull(), 
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), 
}, (table) => [
  index('departments_company_idx').on(table.companyId),
  index('departments_parent_idx').on(table.parentDepartmentId),
  index('departments_code_idx').on(table.code),
  index('departments_name_idx').on(table.name),
  index('departments_manager_idx').on(table.managerId),
  index('departments_location_idx').on(table.locationId),

  unique('departments_company_name_unique').on(table.companyId, table.name),
  unique('departments_company_code_unique').on(table.companyId, table.code),
]); 

// Units table - sub-organizational units within departments for detailed structure management 
export const unit = pgTable('units', { 
  id: text('id').primaryKey(), 
  departmentId: text('department_id').references(() => department.id, { onDelete: 'cascade' }).notNull(), 

  name: varchar('name', { length: 255 }).notNull(), 
  description: text('description'), 
  // Optional short code for integrations and reporting within a department
  code: varchar('code', { length: 20 }),
  staffCount: integer('staff_count').default(0).notNull(),

  // Link to the user leading the unit
  leadId: text('lead_id').references(() => user.id),

  createdAt: timestamp('created_at').defaultNow().notNull(), 
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), 
}, (table) => [
  index('units_department_idx').on(table.departmentId),
  index('units_name_idx').on(table.name),
  index('units_code_idx').on(table.code),
  index('units_lead_idx').on(table.leadId),
  // Unique constraint for unit name within department
  unique('units_department_name_unique').on(table.departmentId, table.name),
  // Unique constraint for unit code within department (if provided)
  unique('units_department_code_unique').on(table.departmentId, table.code),
]);

// Company locations table - physical offices/branches for a company
export const companyLocation = pgTable('company_locations', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),

  // Optional short code for branch/office
  code: varchar('code', { length: 50 }),

  // Human friendly name for the location (e.g., Headquarters, Maslak Office)
  name: varchar('name', { length: 255 }).notNull(),

  // Optional categorisation (e.g., office, warehouse, factory)
  locationType: varchar('location_type', { length: 50 }),

  // Contact & address
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  district: varchar('district', { length: 100 }),
  city: varchar('city', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),
  country: varchar('country', { length: 100 }).default('Türkiye').notNull(),

  // Flags & metadata
  isHeadquarters: boolean('is_headquarters').default(false).notNull(),
  notes: text('notes'),
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('company_locations_company_idx').on(table.companyId),
  index('company_locations_city_idx').on(table.city),
  index('company_locations_hq_idx').on(table.isHeadquarters),
  unique('company_locations_company_name_unique').on(table.companyId, table.name),
  unique('company_locations_company_code_unique').on(table.companyId, table.code),
  check('company_locations_email_check', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('company_locations_phone_check', sql`phone IS NULL OR phone ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('company_locations_postal_code_check', sql`postal_code IS NULL OR postal_code ~* '^[0-9]{5}$'`),
  check('company_locations_country_check', sql`country IS NOT NULL AND length(country) > 0`),
]);

// Company files table - metadata for files stored in Vercel Blob and associated with a company
export const companyFile = pgTable('company_files', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),
  uploadedBy: text('uploaded_by').references(() => user.id),
  // Explicit versioning/audit fields
  code: varchar('code', { length: 100 }),
  version: varchar('version', { length: 50 }),
  updatedBy: text('updated_by').references(() => user.id),
  name: varchar('name', { length: 255 }).notNull(),
  blobUrl: text('blob_url').notNull(),
  blobPath: text('blob_path'),
  contentType: varchar('content_type', { length: 255 }),
  size: integer('size').default(0).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('company_files_company_idx').on(table.companyId),
  index('company_files_created_idx').on(table.createdAt),
  index('company_files_code_idx').on(table.code),
]);

// New normalized file template/version/attachment tables
export const companyFileTemplate = pgTable('company_file_templates', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  description: text('description'),
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('cft_company_idx').on(table.companyId),
  unique('cft_company_code_unique').on(table.companyId, table.code),
]);

export const companyFileVersion = pgTable('company_file_versions', {
  id: text('id').primaryKey(),
  templateId: text('template_id').references(() => companyFileTemplate.id, { onDelete: 'cascade' }).notNull(),
  version: varchar('version', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  blobUrl: text('blob_url').notNull(),
  blobPath: text('blob_path'),
  contentType: varchar('content_type', { length: 255 }),
  size: integer('size').default(0).notNull(),
  metadata: jsonb('metadata'),
  isCurrent: boolean('is_current').default(false).notNull(),
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('cfv_template_idx').on(table.templateId),
  unique('cfv_template_version_unique').on(table.templateId, table.version),
]);

export const companyFileAttachment = pgTable('company_file_attachments', {
  id: text('id').primaryKey(),
  versionId: text('version_id').references(() => companyFileVersion.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  blobUrl: text('blob_url').notNull(),
  blobPath: text('blob_path'),
  contentType: varchar('content_type', { length: 255 }),
  size: integer('size').default(0).notNull(),
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('cfa_version_idx').on(table.versionId),
]);

export type CompanyFileTemplateType = typeof companyFileTemplate.$inferSelect;
export type CompanyFileVersionType = typeof companyFileVersion.$inferSelect;
export type CompanyFileAttachmentType = typeof companyFileAttachment.$inferSelect;

export type CompanyType = typeof company.$inferSelect;
export type DepartmentType = typeof department.$inferSelect;
export type UnitType = typeof unit.$inferSelect;
export type CompanyFileType = typeof companyFile.$inferSelect;
export type CompanyLocationType = typeof companyLocation.$inferSelect;