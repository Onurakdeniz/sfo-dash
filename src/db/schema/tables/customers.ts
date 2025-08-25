import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check, boolean, decimal, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";

/**
 * @deprecated Use businessEntity table instead with entityType='customer'
 * This table is being phased out in favor of the unified businessEntity table
 * which can handle both customers and suppliers
 */
// Customers table - stores customer profiles with Turkish business identifiers and lifecycle data
export const customer = pgTable('customers', {
  /* Core identifier */
  id: text('id').primaryKey(),

  /* Workspace and company association */
  workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'cascade' }).notNull(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),

  /* Basic customer information */
  name: varchar('name', { length: 255 }).notNull(),
  fullName: text('full_name'),
  customerLogoUrl: text('customer_logo_url'),
  customerType: varchar('customer_type', { length: 50 }).default('individual').notNull(),
  customerCategory: varchar('customer_category', { length: 50 }),

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

  /* Contact persons */
  primaryContactName: varchar('primary_contact_name', { length: 255 }),
  primaryContactTitle: varchar('primary_contact_title', { length: 100 }),
  primaryContactPhone: varchar('primary_contact_phone', { length: 20 }),
  primaryContactEmail: varchar('primary_contact_email', { length: 255 }),

  /* Additional contact persons stored as JSON */
  additionalContacts: jsonb('additional_contacts').default([]),

  /* Business relationships */
  parentCustomerId: text('parent_customer_id'),
  customerGroup: varchar('customer_group', { length: 100 }), // For grouping similar customers
  tags: jsonb('tags').default([]),

  /* Notes and metadata */
  notes: text('notes'),
  internalNotes: text('internal_notes'), // Internal notes not visible to customer
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
  index('customers_workspace_company_idx').on(table.workspaceId, table.companyId),
  index('customers_name_idx').on(table.name),
  index('customers_email_idx').on(table.email),
  index('customers_phone_idx').on(table.phone),
  index('customers_status_idx').on(table.status),
  index('customers_type_idx').on(table.customerType),
  index('customers_category_idx').on(table.customerCategory),
  index('customers_priority_idx').on(table.priority),
  index('customers_parent_idx').on(table.parentCustomerId),
  index('customers_industry_idx').on(table.industry),
  index('customers_city_idx').on(table.city),
  index('customers_customer_group_idx').on(table.customerGroup),
  index('customers_created_by_idx').on(table.createdBy),
  index('customers_created_at_idx').on(table.createdAt),
  index('customers_updated_at_idx').on(table.updatedAt),
  
  // Composite indexes for common query patterns
  index('customers_status_created_idx').on(table.status, table.createdAt),
  index('customers_type_status_idx').on(table.customerType, table.status),
  index('customers_priority_status_idx').on(table.priority, table.status),
  index('customers_industry_status_idx').on(table.industry, table.status),
]);

/**
 * @deprecated Use businessEntityAddress table instead
 */
// Customer addresses table - for multiple addresses per customer
export const customerAddress = pgTable('customer_addresses', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customer.id, { onDelete: 'cascade' }).notNull(),

  // Address details
  addressType: varchar('address_type', { length: 50 }).default('billing').notNull(), // billing, shipping, etc.
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
  index('customer_addresses_customer_idx').on(table.customerId),
  index('customer_addresses_type_idx').on(table.addressType),
  index('customer_addresses_default_idx').on(table.isDefault),
  index('customer_addresses_active_idx').on(table.isActive),

  // Unique constraint for address type per customer (no default constraint due to drizzle version)

  // Validation constraints
  check('customer_addresses_email_check', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('customer_addresses_phone_check', sql`phone IS NULL OR phone ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('customer_addresses_postal_code_check', sql`postal_code IS NULL OR postal_code ~* '^[0-9]{5}$'`),
]);

/**
 * @deprecated Use businessEntityContact table instead
 */
// Customer contacts table - detailed contact person information
export const customerContact = pgTable('customer_contacts', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customer.id, { onDelete: 'cascade' }).notNull(),

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
  role: varchar('role', { length: 50 }), // decision_maker, influencer, user, etc.
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
  index('customer_contacts_customer_idx').on(table.customerId),
  index('customer_contacts_email_idx').on(table.email),
  index('customer_contacts_phone_idx').on(table.phone),
  index('customer_contacts_role_idx').on(table.role),
  index('customer_contacts_primary_idx').on(table.isPrimary),
  index('customer_contacts_active_idx').on(table.isActive),

  // Validation constraints
  check('customer_contacts_email_check', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('customer_contacts_phone_check', sql`phone IS NULL OR phone ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('customer_contacts_mobile_check', sql`mobile IS NULL OR mobile ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('customer_contacts_fax_check', sql`fax IS NULL OR fax ~* '^\\+?[1-9]\\d{1,14}$'`),
]);

/**
 * @deprecated Use businessEntityFile table instead
 */
// Customer files table - documents associated with customers
export const customerFile = pgTable('customer_files', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customer.id, { onDelete: 'cascade' }).notNull(),

  // File metadata
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }), // contract, invoice, document, etc.
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
  index('customer_files_customer_idx').on(table.customerId),
  index('customer_files_category_idx').on(table.category),
  index('customer_files_created_at_idx').on(table.createdAt),
]);

/**
 * @deprecated Use businessEntityNote table instead
 */
// Customer notes table - for tracking customer interactions and notes
export const customerNote = pgTable('customer_notes', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customer.id, { onDelete: 'cascade' }).notNull(),

  // Note details
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  noteType: varchar('note_type', { length: 50 }).default('general'), // general, call, meeting, email, etc.

  // Visibility and importance
  isInternal: boolean('is_internal').default(false).notNull(),
  priority: varchar('priority', { length: 20 }).default('medium'), // high, medium, low

  // Related entities
  relatedContactId: text('related_contact_id').references(() => customerContact.id),

  // Audit fields
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('customer_notes_customer_idx').on(table.customerId),
  index('customer_notes_type_idx').on(table.noteType),
  index('customer_notes_created_by_idx').on(table.createdBy),
  index('customer_notes_created_at_idx').on(table.createdAt),
]);

// Type exports
export type CustomerType = typeof customer.$inferSelect;
export type CustomerAddressType = typeof customerAddress.$inferSelect;
export type CustomerContactType = typeof customerContact.$inferSelect;
export type CustomerFileType = typeof customerFile.$inferSelect;
export type CustomerNoteType = typeof customerNote.$inferSelect;
