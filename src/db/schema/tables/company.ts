import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { companyStatusEnum, companyTypeEnum } from "..";
import { user } from "./user";

// Main companies table - stores organization profiles with Turkish business identifiers and lifecycle data 
export const company = pgTable('companies', {
  /* Core identifier */
  id: text('id').primaryKey(),

  /* Basic company information */
  name: varchar('name', { length: 255 }).notNull(),
  fullName: text('full_name'),
  companyLogoUrl: text('company_logo_url'),
  companyType: companyTypeEnum('company_type'),

  /* ERP status & categorisation */
  status: companyStatusEnum('status').default('active').notNull(),
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

  // Performance indexes
  index('companies_name_idx').on(table.name),
  index('companies_email_idx').on(table.email),
  index('companies_status_idx').on(table.status),
  index('companies_parent_idx').on(table.parentCompanyId),
  
  // Data validation constraints
  check('companies_email_check', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('companies_phone_check', sql`phone IS NULL OR phone ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('companies_currency_check', sql`default_currency ~* '^[A-Z]{3}$'`),
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

  unique('departments_company_name_unique').on(table.companyId, table.name),
  unique('departments_company_code_unique').on(table.companyId, table.code),
]); 

// Units table - sub-organizational units within departments for detailed structure management 
export const unit = pgTable('units', { 
  id: text('id').primaryKey(), 
  departmentId: text('department_id').references(() => department.id, { onDelete: 'cascade' }).notNull(), 

  name: varchar('name', { length: 255 }).notNull(), 
  description: text('description'), 
  staffCount: integer('staff_count').default(0).notNull(),

  // Link to the user leading the unit
  leadId: text('lead_id').references(() => user.id),

  createdAt: timestamp('created_at').defaultNow().notNull(), 
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), 
}, (table) => [
  index('units_department_idx').on(table.departmentId),
  index('units_name_idx').on(table.name),
  index('units_lead_idx').on(table.leadId),
  // Unique constraint for unit name within department
  unique('units_department_name_unique').on(table.departmentId, table.name),
]);

// Company files table - metadata for files stored in Vercel Blob and associated with a company
export const companyFile = pgTable('company_files', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),
  uploadedBy: text('uploaded_by').references(() => user.id),
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
]);

export type CompanyType = typeof company.$inferSelect;
export type DepartmentType = typeof department.$inferSelect;
export type UnitType = typeof unit.$inferSelect;
export type CompanyFileType = typeof companyFile.$inferSelect;