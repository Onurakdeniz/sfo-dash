import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check, boolean, decimal, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { talepStatusEnum, talepPriorityEnum, talepTypeEnum, talepCategoryEnum } from "../enums";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";
import { businessEntity, businessEntityContact } from "./businessEntity";
import { products } from "./products";

// Main Request table - Top-level entity representing the entire customer request
// Acts as a container for all information, files, and actions related to a specific customer need
export const talep = pgTable('talep', {
  /* Core identifier */
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 20 }),

  /* Workspace and company association */
  workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'cascade' }).notNull(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),

  /* Customer association - The customer who made the request */
  customerId: text('customer_id').references(() => businessEntity.id, { onDelete: 'cascade' }).notNull(),
  
  /* Request details */
  title: text('title').notNull(), // Short descriptive title (e.g., "Q3 Widget Order")
  description: text('description'), // Additional context or notes
  
  /* Workflow State Management */
  status: talepStatusEnum('status').default('new').notNull(),
  priority: talepPriorityEnum('priority').default('medium').notNull(),
  
  /* Contact information for this specific request */
  entityContactId: text('entity_contact_id').references(() => businessEntityContact.id, { onDelete: 'set null' }),

  /* Assignment */
  assignedTo: text('assigned_to').references(() => user.id),
  assignedBy: text('assigned_by').references(() => user.id),

  /* Contact information for this specific request */
  contactName: varchar('contact_name', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 255 }),

  /* Request metadata */
  tags: jsonb('tags').default([]),
  metadata: jsonb('metadata'),

  /* Deadline and scheduling */
  deadline: timestamp('deadline'),
  estimatedHours: decimal('estimated_hours', { precision: 5, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 5, scale: 2 }),

  /* Resolution details */
  resolution: text('resolution'),
  resolutionDate: timestamp('resolution_date'),

  /* Financial information */
  estimatedCost: decimal('estimated_cost', { precision: 15, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 15, scale: 2 }),
  billingStatus: varchar('billing_status', { length: 50 }), // not_billed, billed, invoiced

  /* Audit fields */
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  // Performance indexes for frequently queried columns
  unique('talep_code_unique').on(table.code),
  index('talep_workspace_company_idx').on(table.workspaceId, table.companyId),
  index('talep_title_idx').on(table.title),
  index('talep_status_idx').on(table.status),
  index('talep_priority_idx').on(table.priority),
  index('talep_customer_idx').on(table.customerId),
  index('talep_entity_contact_idx').on(table.entityContactId),
  index('talep_assigned_to_idx').on(table.assignedTo),
  index('talep_assigned_by_idx').on(table.assignedBy),
  index('talep_deadline_idx').on(table.deadline),
  index('talep_created_by_idx').on(table.createdBy),
  index('talep_created_at_idx').on(table.createdAt),
  index('talep_updated_at_idx').on(table.updatedAt),

  // Composite indexes for common query patterns
  index('talep_status_created_idx').on(table.status, table.createdAt),
  index('talep_priority_status_idx').on(table.priority, table.status),
  index('talep_customer_status_idx').on(table.customerId, table.status),
  index('talep_assigned_deadline_idx').on(table.assignedTo, table.deadline),

  // Validation constraints
  check('talep_email_check', sql`contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('talep_phone_check', sql`contact_phone IS NULL OR contact_phone ~* '^\\+?[1-9]\\d{1,14}$'`),
]);

// Talep notes table - for tracking request interactions and internal notes
export const talepNote = pgTable('talep_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => talep.id, { onDelete: 'cascade' }).notNull(),

  // Note details
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  noteType: varchar('note_type', { length: 50 }).default('internal'), // internal, customer, resolution

  // Visibility and importance
  isInternal: boolean('is_internal').default(true).notNull(),
  isVisibleToEntity: boolean('is_visible_to_entity').default(false).notNull(),
  priority: talepPriorityEnum('priority').default('medium'),

  // Related entities
  relatedContactId: text('related_contact_id'),

  // Audit fields
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('talep_notes_request_idx').on(table.requestId),
  index('talep_notes_type_idx').on(table.noteType),
  index('talep_notes_created_by_idx').on(table.createdBy),
  index('talep_notes_created_at_idx').on(table.createdAt),
  index('talep_notes_internal_idx').on(table.isInternal),
  index('talep_notes_visible_entity_idx').on(table.isVisibleToEntity),
]);

// Talep files table - documents associated with requests
export const talepFile = pgTable('talep_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => talep.id, { onDelete: 'cascade' }).notNull(),

  // File metadata
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }), // contract, invoice, document, image, etc.
  blobUrl: text('blob_url').notNull(),
  blobPath: text('blob_path'),
  contentType: varchar('content_type', { length: 255 }),
  size: integer('size').default(0).notNull(),

  // Additional metadata
  description: text('description'),
  isVisibleToEntity: boolean('is_visible_to_entity').default(false).notNull(),
  metadata: jsonb('metadata'),

  // Audit fields
  uploadedBy: text('uploaded_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('talep_files_request_idx').on(table.requestId),
  index('talep_files_category_idx').on(table.category),
  index('talep_files_created_at_idx').on(table.createdAt),
  index('talep_files_visible_entity_idx').on(table.isVisibleToEntity),
]);

// Talep activities table - audit log of all activities on a request (Workflow Action audit trail)
export const talepActivity = pgTable('talep_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => talep.id, { onDelete: 'cascade' }).notNull(),

  // Activity details
  activityType: varchar('activity_type', { length: 100 }).notNull(), // status_change, assignment, note_added, file_uploaded, etc.
  description: text('description').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),

  // Additional metadata
  metadata: jsonb('metadata'),

  // Audit fields
  performedBy: text('performed_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('talep_activities_request_idx').on(table.requestId),
  index('talep_activities_type_idx').on(table.activityType),
  index('talep_activities_performed_by_idx').on(table.performedBy),
  index('talep_activities_created_at_idx').on(table.createdAt),
]);

// RequestItem table - Child entity representing a single product/service line item within a Request
// A single Request can have multiple RequestItems
export const requestItem = pgTable('request_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => talep.id, { onDelete: 'cascade' }).notNull(),

  // Product association (optional - links to known product in catalog)
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  
  // Item specification
  specification: text('specification').notNull(), // Detailed description if not in catalog, or additional specs
  productCode: varchar('product_code', { length: 100 }),
  productName: varchar('product_name', { length: 255 }),
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 255 }),
  partNumber: varchar('part_number', { length: 100 }),

  // Technical specifications
  specifications: jsonb('specifications'), // Additional technical specs as JSON
  category: varchar('category', { length: 100 }),
  subCategory: varchar('sub_category', { length: 100 }),

  // Quantity and units
  quantity: integer('quantity').default(1).notNull(), // Number of units requested
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }).default('piece'),
  
  // Revision tracking
  revision: integer('revision').default(1).notNull(), // Version number, incremented on changes
  
  // Pricing information
  targetPrice: decimal('target_price', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),

  // Defense industry specific fields
  exportControlled: boolean('export_controlled').default(false),
  itar: boolean('itar').default(false),
  endUseStatement: text('end_use_statement'),
  certificationRequired: jsonb('certification_required'),

  // Status and notes
  status: varchar('status', { length: 50 }).default('requested'),
  notes: text('notes'),

  // Audit fields
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('request_items_request_idx').on(table.requestId),
  index('request_items_product_idx').on(table.productId),
  index('request_items_code_idx').on(table.productCode),
  index('request_items_name_idx').on(table.productName),
  index('request_items_category_idx').on(table.category),
  index('request_items_status_idx').on(table.status),
  index('request_items_revision_idx').on(table.revision),
]);

// Keep the old name as an alias for backward compatibility
export const talepProduct = requestItem;

// Talep actions table - detailed actions taken for a talep
export const talepAction = pgTable('talep_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => talep.id, { onDelete: 'cascade' }).notNull(),

  // Action details
  actionType: varchar('action_type', { length: 100 }).notNull(), // email_sent, call_made, meeting_held, quote_requested, etc.
  actionCategory: varchar('action_category', { length: 50 }), // communication, documentation, procurement, technical
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),

  // Communication details (if applicable)
  communicationType: varchar('communication_type', { length: 50 }), // email, phone, meeting, site_visit
  contactPerson: varchar('contact_person', { length: 255 }),
  contactCompany: varchar('contact_company', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),

  // Action outcome
  outcome: varchar('outcome', { length: 100 }), // successful, pending, failed, follow_up_required
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: timestamp('follow_up_date'),
  followUpNotes: text('follow_up_notes'),

  // Related entities
  relatedProductIds: jsonb('related_product_ids').default([]), // Array of talepProduct ids
  attachmentIds: jsonb('attachment_ids').default([]), // Array of file ids

  // Time tracking
  duration: integer('duration'), // Duration in minutes
  actionDate: timestamp('action_date').defaultNow().notNull(),

  // Additional metadata
  metadata: jsonb('metadata'),

  // Audit fields
  performedBy: text('performed_by').references(() => user.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('talep_actions_request_idx').on(table.requestId),
  index('talep_actions_type_idx').on(table.actionType),
  index('talep_actions_category_idx').on(table.actionCategory),
  index('talep_actions_outcome_idx').on(table.outcome),
  index('talep_actions_performed_by_idx').on(table.performedBy),
  index('talep_actions_date_idx').on(table.actionDate),
  index('talep_actions_follow_up_idx').on(table.followUpRequired, table.followUpDate),
]);

// Type exports
export type TalepType = typeof talep.$inferSelect;
export type RequestType = typeof talep.$inferSelect; // Alias for clarity
export type TalepNoteType = typeof talepNote.$inferSelect;
export type TalepFileType = typeof talepFile.$inferSelect;
export type TalepActivityType = typeof talepActivity.$inferSelect;
export type RequestItemType = typeof requestItem.$inferSelect;
export type TalepProductType = typeof requestItem.$inferSelect; // Backward compatibility
export type TalepActionType = typeof talepAction.$inferSelect;
