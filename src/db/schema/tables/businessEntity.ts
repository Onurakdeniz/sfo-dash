import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check, boolean, decimal, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";

// Unified business entities table - stores both suppliers and customers
export const businessEntity = pgTable('business_entities', {
  /* Core identifier */
  id: text('id').primaryKey(),

  /* Workspace and company association */
  workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'cascade' }).notNull(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),

  /* Entity type - supplier, customer, or both */
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'supplier', 'customer', 'both'

  /* Basic information */
  name: varchar('name', { length: 255 }).notNull(),
  fullName: text('full_name'),
  logoUrl: text('logo_url'),
  entityCategory: varchar('entity_category', { length: 50 }),

  /* Business classification */
  businessType: varchar('business_type', { length: 50 }).default('company').notNull(), // company, individual, government
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

  /* Business entity codes */
  entityCode: varchar('entity_code', { length: 50 }), // Internal entity code
  supplierCode: varchar('supplier_code', { length: 50 }), // Used when acting as supplier
  customerCode: varchar('customer_code', { length: 50 }), // Used when acting as customer

  /* Supplier specific fields (only used when entityType includes supplier) */
  leadTimeDays: integer('lead_time_days'), // Average lead time in days
  minimumOrderQuantity: integer('minimum_order_quantity'),
  orderIncrement: integer('order_increment'), // Order increment quantity
  qualityRating: decimal('quality_rating', { precision: 3, scale: 2 }), // Rating out of 5.00
  deliveryRating: decimal('delivery_rating', { precision: 3, scale: 2 }), // Rating out of 5.00

  /* Defense industry specific */
  defenseContractor: boolean('defense_contractor').default(false),
  exportLicense: boolean('export_license').default(false),
  securityClearance: varchar('security_clearance', { length: 50 }), // Level of security clearance
  certifications: jsonb('certifications').default([]), // Array of certification details

  /* Contact persons */
  primaryContactName: varchar('primary_contact_name', { length: 255 }),
  primaryContactTitle: varchar('primary_contact_title', { length: 100 }),
  primaryContactPhone: varchar('primary_contact_phone', { length: 20 }),
  primaryContactEmail: varchar('primary_contact_email', { length: 255 }),

  /* Business relationships */
  parentEntityId: text('parent_entity_id'),
  entityGroup: varchar('entity_group', { length: 100 }), // For grouping similar entities
  tags: jsonb('tags').default([]),

  /* Notes and metadata */
  notes: text('notes'),
  internalNotes: text('internal_notes'), // Internal notes not visible to entity
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
  index('business_entities_workspace_company_idx').on(table.workspaceId, table.companyId),
  index('business_entities_entity_type_idx').on(table.entityType),
  index('business_entities_name_idx').on(table.name),
  index('business_entities_email_idx').on(table.email),
  index('business_entities_phone_idx').on(table.phone),
  index('business_entities_status_idx').on(table.status),
  index('business_entities_business_type_idx').on(table.businessType),
  index('business_entities_category_idx').on(table.entityCategory),
  index('business_entities_priority_idx').on(table.priority),
  index('business_entities_parent_idx').on(table.parentEntityId),
  index('business_entities_industry_idx').on(table.industry),
  index('business_entities_city_idx').on(table.city),
  index('business_entities_entity_group_idx').on(table.entityGroup),
  index('business_entities_entity_code_idx').on(table.entityCode),
  index('business_entities_supplier_code_idx').on(table.supplierCode),
  index('business_entities_customer_code_idx').on(table.customerCode),
  index('business_entities_created_by_idx').on(table.createdBy),
  index('business_entities_created_at_idx').on(table.createdAt),
  index('business_entities_updated_at_idx').on(table.updatedAt),

  // Composite indexes for common query patterns
  index('business_entities_type_status_idx').on(table.entityType, table.status),
  index('business_entities_priority_status_idx').on(table.priority, table.status),
  index('business_entities_industry_status_idx').on(table.industry, table.status),

  // Unique constraints
  unique('business_entities_entity_code_unique').on(table.workspaceId, table.companyId, table.entityCode),
  unique('business_entities_supplier_code_unique').on(table.workspaceId, table.companyId, table.supplierCode),
  unique('business_entities_customer_code_unique').on(table.workspaceId, table.companyId, table.customerCode),
]);

// Business entity addresses table - for multiple addresses per entity
export const businessEntityAddress = pgTable('business_entity_addresses', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').references(() => businessEntity.id, { onDelete: 'cascade' }).notNull(),

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
  index('business_entity_addresses_entity_idx').on(table.entityId),
  index('business_entity_addresses_type_idx').on(table.addressType),
  index('business_entity_addresses_default_idx').on(table.isDefault),
  index('business_entity_addresses_active_idx').on(table.isActive),

  // Validation constraints
  check('business_entity_addresses_email_check', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('business_entity_addresses_phone_check', sql`phone IS NULL OR phone ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('business_entity_addresses_postal_code_check', sql`postal_code IS NULL OR postal_code ~* '^[0-9]{5}$'`),
]);

// Business entity contacts table - detailed contact person information
export const businessEntityContact = pgTable('business_entity_contacts', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').references(() => businessEntity.id, { onDelete: 'cascade' }).notNull(),

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
  role: varchar('role', { length: 50 }), // sales_rep, account_manager, technical_support, decision_maker, etc.
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
  index('business_entity_contacts_entity_idx').on(table.entityId),
  index('business_entity_contacts_email_idx').on(table.email),
  index('business_entity_contacts_phone_idx').on(table.phone),
  index('business_entity_contacts_role_idx').on(table.role),
  index('business_entity_contacts_primary_idx').on(table.isPrimary),
  index('business_entity_contacts_active_idx').on(table.isActive),

  // Validation constraints
  check('business_entity_contacts_email_check', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('business_entity_contacts_phone_check', sql`phone IS NULL OR phone ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('business_entity_contacts_mobile_check', sql`mobile IS NULL OR mobile ~* '^\\+?[1-9]\\d{1,14}$'`),
  check('business_entity_contacts_fax_check', sql`fax IS NULL OR fax ~* '^\\+?[1-9]\\d{1,14}$'`),
]);

// Business entity activities table - unified activities tracking
export const businessEntityActivity = pgTable('business_entity_activities', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').references(() => businessEntity.id, { onDelete: 'cascade' }).notNull(),

  // Activity details
  activityType: varchar('activity_type', { length: 100 }).notNull(), // call, email, meeting, order, delivery, payment, etc.
  activityCategory: varchar('activity_category', { length: 50 }), // sales, support, procurement, financial
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Activity metadata
  activityDate: timestamp('activity_date').defaultNow().notNull(),
  duration: integer('duration'), // Duration in minutes
  outcome: varchar('outcome', { length: 100 }), // successful, pending, failed, follow_up_required

  // Related entities
  contactId: text('contact_id').references(() => businessEntityContact.id),
  relatedOrderId: text('related_order_id'), // Will reference orders table
  relatedTalepId: text('related_talep_id'), // References talep table

  // Follow up
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: timestamp('follow_up_date'),
  followUpNotes: text('follow_up_notes'),

  // Additional data
  attachments: jsonb('attachments').default([]), // Array of file references
  metadata: jsonb('metadata'),

  // Audit fields
  performedBy: text('performed_by').references(() => user.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('business_entity_activities_entity_idx').on(table.entityId),
  index('business_entity_activities_type_idx').on(table.activityType),
  index('business_entity_activities_category_idx').on(table.activityCategory),
  index('business_entity_activities_date_idx').on(table.activityDate),
  index('business_entity_activities_performed_by_idx').on(table.performedBy),
  index('business_entity_activities_follow_up_idx').on(table.followUpRequired, table.followUpDate),
]);

// Business entity files table - documents associated with entities
export const businessEntityFile = pgTable('business_entity_files', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').references(() => businessEntity.id, { onDelete: 'cascade' }).notNull(),

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
  index('business_entity_files_entity_idx').on(table.entityId),
  index('business_entity_files_category_idx').on(table.category),
  index('business_entity_files_created_at_idx').on(table.createdAt),
]);

// Business entity notes table - for tracking entity interactions and notes
export const businessEntityNote = pgTable('business_entity_notes', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').references(() => businessEntity.id, { onDelete: 'cascade' }).notNull(),

  // Note details
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  noteType: varchar('note_type', { length: 50 }).default('general'), // general, call, meeting, email, etc.

  // Visibility and importance
  isInternal: boolean('is_internal').default(false).notNull(),
  priority: varchar('priority', { length: 20 }).default('medium'), // high, medium, low

  // Related entities
  relatedContactId: text('related_contact_id').references(() => businessEntityContact.id),

  // Audit fields
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('business_entity_notes_entity_idx').on(table.entityId),
  index('business_entity_notes_type_idx').on(table.noteType),
  index('business_entity_notes_created_by_idx').on(table.createdBy),
  index('business_entity_notes_created_at_idx').on(table.createdAt),
]);

// Business entity performance history table - tracks entity performance over time
export const businessEntityPerformance = pgTable('business_entity_performance', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').references(() => businessEntity.id, { onDelete: 'cascade' }).notNull(),

  // Performance period
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  periodType: varchar('period_type', { length: 20 }).default('monthly').notNull(), // monthly, quarterly, yearly

  // Performance metrics (for suppliers)
  onTimeDeliveryRate: decimal('on_time_delivery_rate', { precision: 5, scale: 2 }), // Percentage 0-100
  qualityRating: decimal('quality_rating', { precision: 3, scale: 2 }), // Rating out of 5.00
  responseTimeHours: decimal('response_time_hours', { precision: 5, scale: 2 }), // Average response time
  orderFulfillmentRate: decimal('order_fulfillment_rate', { precision: 5, scale: 2 }), // Percentage 0-100

  // Financial metrics
  totalOrders: integer('total_orders').default(0),
  totalOrderValue: decimal('total_order_value', { precision: 15, scale: 2 }),
  averageOrderValue: decimal('average_order_value', { precision: 15, scale: 2 }),
  paymentOnTimeRate: decimal('payment_on_time_rate', { precision: 5, scale: 2 }), // For customers

  // Issues and complaints
  qualityIssues: integer('quality_issues').default(0),
  deliveryIssues: integer('delivery_issues').default(0),
  communicationIssues: integer('communication_issues').default(0),
  paymentIssues: integer('payment_issues').default(0),

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
  index('business_entity_performance_entity_idx').on(table.entityId),
  index('business_entity_performance_period_idx').on(table.periodStart, table.periodEnd),
  index('business_entity_performance_type_idx').on(table.periodType),
  index('business_entity_performance_score_idx').on(table.overallScore),
  index('business_entity_performance_created_at_idx').on(table.createdAt),

  // Unique constraint for performance period per entity
  unique('business_entity_performance_unique_period').on(table.entityId, table.periodStart, table.periodEnd, table.periodType),
]);

// Type exports
export type BusinessEntityType = typeof businessEntity.$inferSelect;
export type BusinessEntityAddressType = typeof businessEntityAddress.$inferSelect;
export type BusinessEntityContactType = typeof businessEntityContact.$inferSelect;
export type BusinessEntityActivityType = typeof businessEntityActivity.$inferSelect;
export type BusinessEntityFileType = typeof businessEntityFile.$inferSelect;
export type BusinessEntityNoteType = typeof businessEntityNote.$inferSelect;
export type BusinessEntityPerformanceType = typeof businessEntityPerformance.$inferSelect;