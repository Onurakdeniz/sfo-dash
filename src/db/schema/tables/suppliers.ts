import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check, boolean, decimal, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";

/**
 * @deprecated Use businessEntity table instead with entityType='supplier'
 * This table is being phased out in favor of the unified businessEntity table
 * which can handle both customers and suppliers
 */
// Suppliers table - stores supplier profiles with Turkish business identifiers and lifecycle data
export const supplier = pgTable('suppliers', {
  /* Core identifier */
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),

  /* Workspace and company association */
  workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'cascade' }).notNull(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),

  /* Basic supplier information */
  name: varchar('name', { length: 255 }).notNull(),
  fullName: text('full_name'),
  supplierLogoUrl: text('supplier_logo_url'),
  supplierType: varchar('supplier_type', { length: 50 }).default('individual').notNull(),
  supplierCategory: varchar('supplier_category', { length: 50 }),

  /* ERP status & categorisation */
  status: varchar('status', { length: 50 }).default('active').notNull(),
  industry: varchar('industry', { length: 100 }),
  priority: varchar('priority', { length: 20 }).default('medium'), // high, medium, low

  /* Contact information */
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  fax: varchar('fax', { length: 20 }),

  /* Address information */
  address: text('address'),
  district: varchar('district', { length: 100 }),
  city: varchar('city', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),
  country: varchar('country', { length: 100 }).default('Türkiye').notNull(),

  /* Financial & legal – Türkiye specific */
  taxOffice: varchar('tax_office', { length: 100 }),
  taxNumber: varchar('tax_number', { length: 50 }), // TCKN for individuals, VKN for corporations
  mersisNumber: varchar('mersis_number', { length: 50 }),
  tradeRegistryNumber: varchar('trade_registry_number', { length: 100 }),

  /* Financial – general */
  defaultCurrency: varchar('default_currency', { length: 3 }).default('TRY').notNull(),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
  paymentTerms: varchar('payment_terms', { length: 100 }), // e.g., "Net 30", "Net 15"
  discountRate: decimal('discount_rate', { precision: 5, scale: 2 }), // Default discount percentage

  /* Supplier specific fields */
  supplierCode: varchar('supplier_code', { length: 50 }), // Internal supplier code
  leadTimeDays: integer('lead_time_days'), // Average lead time in days
  minimumOrderQuantity: integer('minimum_order_quantity'),
  orderIncrement: integer('order_increment'), // Order increment quantity
  qualityRating: decimal('quality_rating', { precision: 3, scale: 2 }), // Rating out of 5.00
  deliveryRating: decimal('delivery_rating', { precision: 3, scale: 2 }), // Rating out of 5.00

  /* Contact persons */
  primaryContactName: varchar('primary_contact_name', { length: 255 }),
  primaryContactTitle: varchar('primary_contact_title', { length: 100 }),
  primaryContactPhone: varchar('primary_contact_phone', { length: 20 }),
  primaryContactEmail: varchar('primary_contact_email', { length: 255 }),

  /* Additional contact persons stored as JSON */
  additionalContacts: jsonb('additional_contacts').default([]),

  /* Business relationships */
  parentSupplierId: text('parent_supplier_id'),
  supplierGroup: varchar('supplier_group', { length: 100 }), // For grouping similar suppliers
  tags: jsonb('tags').default([]),

  /* Notes and metadata */
  notes: text('notes'),
  internalNotes: text('internal_notes'), // Internal notes not visible to supplier
  metadata: jsonb('metadata'),

  /* Audit fields */
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  // Performance indexes for frequently queried columns
  index('suppliers_workspace_company_idx').on(table.workspaceId, table.companyId),
  index('suppliers_name_idx').on(table.name),
  index('suppliers_email_idx').on(table.email),
  index('suppliers_phone_idx').on(table.phone),
  index('suppliers_status_idx').on(table.status),
  index('suppliers_type_idx').on(table.supplierType),
  index('suppliers_category_idx').on(table.supplierCategory),
  index('suppliers_priority_idx').on(table.priority),
  index('suppliers_parent_idx').on(table.parentSupplierId),
  index('suppliers_industry_idx').on(table.industry),
  index('suppliers_city_idx').on(table.city),
  index('suppliers_supplier_group_idx').on(table.supplierGroup),
  index('suppliers_supplier_code_idx').on(table.supplierCode),
  index('suppliers_created_by_idx').on(table.createdBy),
  index('suppliers_created_at_idx').on(table.createdAt),
  index('suppliers_updated_at_idx').on(table.updatedAt),

  // Composite indexes for common query patterns
  index('suppliers_status_created_idx').on(table.status, table.createdAt),
  index('suppliers_type_status_idx').on(table.supplierType, table.status),
  index('suppliers_priority_status_idx').on(table.priority, table.status),
  index('suppliers_industry_status_idx').on(table.industry, table.status),

  // Unique constraints
  unique('suppliers_supplier_code_unique').on(table.workspaceId, table.companyId, table.supplierCode),
]);

/**
 * @deprecated Use businessEntityAddress table instead
 */
// Supplier addresses table - for multiple addresses per supplier
export const supplierAddress = pgTable('supplier_addresses', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id').references(() => supplier.id, { onDelete: 'cascade' }).notNull(),

  // Address details
  addressType: varchar('address_type', { length: 50 }).default('billing').notNull(), // billing, shipping, warehouse, etc.
  title: varchar('title', { length: 100 }), // e.g., "Main Office", "Warehouse"
  address: text('address').notNull(),
  district: varchar('district', { length: 100 }),
  city: varchar('city', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),
  country: varchar('country', { length: 100 }).default('Türkiye').notNull(),

  // Contact info for this address
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  contactName: varchar('contact_name', { length: 255 }),
  contactTitle: varchar('contact_title', { length: 100 }),

  // Flags
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),

  // Metadata
  notes: text('notes'),
  metadata: jsonb('metadata'),

  // Audit fields
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('supplier_addresses_supplier_idx').on(table.supplierId),
  index('supplier_addresses_type_idx').on(table.addressType),
  index('supplier_addresses_default_idx').on(table.isDefault),
  index('supplier_addresses_active_idx').on(table.isActive),

  // Validation constraints
  check('supplier_addresses_email_check', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('supplier_addresses_phone_check', sql`phone IS NULL OR phone ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('supplier_addresses_postal_code_check', sql`postal_code IS NULL OR postal_code ~* '^[0-9]{5}$'`),
]);

/**
 * @deprecated Use businessEntityContact table instead
 */
// Supplier contacts table - detailed contact person information
export const supplierContact = pgTable('supplier_contacts', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id').references(() => supplier.id, { onDelete: 'cascade' }).notNull(),

  // Contact details
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  title: varchar('title', { length: 100 }),
  department: varchar('department', { length: 100 }),

  // Contact information
  phone: varchar('phone', { length: 20 }),
  mobile: varchar('mobile', { length: 20 }),
  email: varchar('email', { length: 255 }),
  fax: varchar('fax', { length: 20 }),

  // Role and importance
  role: varchar('role', { length: 50 }), // sales_rep, account_manager, technical_support, etc.
  isPrimary: boolean('is_primary').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),

  // Additional information
  notes: text('notes'),
  metadata: jsonb('metadata'),

  // Audit fields
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('supplier_contacts_supplier_idx').on(table.supplierId),
  index('supplier_contacts_email_idx').on(table.email),
  index('supplier_contacts_phone_idx').on(table.phone),
  index('supplier_contacts_role_idx').on(table.role),
  index('supplier_contacts_primary_idx').on(table.isPrimary),
  index('supplier_contacts_active_idx').on(table.isActive),

  // Validation constraints
  check('supplier_contacts_email_check', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('supplier_contacts_phone_check', sql`phone IS NULL OR phone ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('supplier_contacts_mobile_check', sql`mobile IS NULL OR mobile ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('supplier_contacts_fax_check', sql`fax IS NULL OR fax ~* '^\\+?[1-9]\\d{1,14}$'`),
]);

/**
 * @deprecated Use businessEntityFile table instead
 */
// Supplier files table - documents associated with suppliers
export const supplierFile = pgTable('supplier_files', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id').references(() => supplier.id, { onDelete: 'cascade' }).notNull(),

  // File metadata
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }), // contract, certificate, catalog, document, etc.
  blobUrl: text('blob_url').notNull(),
  blobPath: text('blob_path'),
  contentType: varchar('content_type', { length: 255 }),
  size: integer('size').default(0).notNull(),

  // Additional metadata
  description: text('description'),
  metadata: jsonb('metadata'),

  // Audit fields
  uploadedBy: text('uploaded_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('supplier_files_supplier_idx').on(table.supplierId),
  index('supplier_files_category_idx').on(table.category),
  index('supplier_files_created_at_idx').on(table.createdAt),
]);

/**
 * @deprecated Use businessEntityNote table instead
 */
// Supplier notes table - for tracking supplier interactions and notes
export const supplierNote = pgTable('supplier_notes', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id').references(() => supplier.id, { onDelete: 'cascade' }).notNull(),

  // Note details
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  noteType: varchar('note_type', { length: 50 }).default('general'), // general, call, meeting, email, etc.

  // Visibility and importance
  isInternal: boolean('is_internal').default(false).notNull(),
  priority: varchar('priority', { length: 20 }).default('medium'), // high, medium, low

  // Related entities
  relatedContactId: text('related_contact_id').references(() => supplierContact.id),

  // Audit fields
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('supplier_notes_supplier_idx').on(table.supplierId),
  index('supplier_notes_type_idx').on(table.noteType),
  index('supplier_notes_created_by_idx').on(table.createdBy),
  index('supplier_notes_created_at_idx').on(table.createdAt),
]);

/**
 * @deprecated Use businessEntityPerformance table instead
 */
// Supplier performance history table - tracks supplier performance over time
export const supplierPerformance = pgTable('supplier_performance', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id').references(() => supplier.id, { onDelete: 'cascade' }).notNull(),

  // Performance period
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  periodType: varchar('period_type', { length: 20 }).default('monthly').notNull(), // monthly, quarterly, yearly

  // Performance metrics
  onTimeDeliveryRate: decimal('on_time_delivery_rate', { precision: 5, scale: 2 }), // Percentage 0-100
  qualityRating: decimal('quality_rating', { precision: 3, scale: 2 }), // Rating out of 5.00
  responseTimeHours: decimal('response_time_hours', { precision: 5, scale: 2 }), // Average response time
  // orderFulfillmentRate removed - orders module not implemented

  // Financial metrics (order-related fields removed - orders module not implemented)

  // Issues and complaints
  qualityIssues: integer('quality_issues').default(0),
  deliveryIssues: integer('delivery_issues').default(0),
  communicationIssues: integer('communication_issues').default(0),

  // Overall score
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }), // Calculated score out of 100

  // Additional data
  notes: text('notes'),
  metadata: jsonb('metadata'),

  // Audit fields
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('supplier_performance_supplier_idx').on(table.supplierId),
  index('supplier_performance_period_idx').on(table.periodStart, table.periodEnd),
  index('supplier_performance_type_idx').on(table.periodType),
  index('supplier_performance_score_idx').on(table.overallScore),
  index('supplier_performance_created_at_idx').on(table.createdAt),

  // Unique constraint for performance period per supplier
  unique('supplier_performance_unique_period').on(table.supplierId, table.periodStart, table.periodEnd, table.periodType),
]);

// Type exports
export type SupplierType = typeof supplier.$inferSelect;
export type SupplierAddressType = typeof supplierAddress.$inferSelect;
export type SupplierContactType = typeof supplierContact.$inferSelect;
export type SupplierFileType = typeof supplierFile.$inferSelect;
export type SupplierNoteType = typeof supplierNote.$inferSelect;
export type SupplierPerformanceType = typeof supplierPerformance.$inferSelect;
