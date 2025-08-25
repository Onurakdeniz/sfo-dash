import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check, boolean, decimal, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { requestStatusEnum, requestPriorityEnum, requestTypeEnum, requestCategoryEnum, requestItemStatusEnum } from "../enums";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";
import { businessEntity, businessEntityContact } from "./businessEntity";

// ============================================
// MAIN REQUEST TABLE
// ============================================
// Core request entity that tracks the entire lifecycle of a customer request
export const request = pgTable('request', {
  /* Core Identifiers */
  id: text('id').primaryKey(),
  requestNumber: varchar('request_number', { length: 50 }).unique().notNull(), // REQ-2024-001
  version: integer('version').default(1).notNull(), // For optimistic locking
  
  /* Workspace & Company Association */
  workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'cascade' }).notNull(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),
  
  /* Request Metadata */
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: requestTypeEnum('type').default('general_inquiry').notNull(),
  category: requestCategoryEnum('category'),
  priority: requestPriorityEnum('priority').default('medium').notNull(),
  
  /* Workflow Management */
  status: requestStatusEnum('status').default('new').notNull(),
  previousStatus: requestStatusEnum('previous_status'), // Track status transitions
  statusChangedAt: timestamp('status_changed_at'),
  statusChangedBy: text('status_changed_by').references(() => user.id),
  
  /* Customer (Business Entity) Association */
  customerId: text('customer_id').references(() => businessEntity.id, { onDelete: 'restrict' }).notNull(),
  customerContactId: text('customer_contact_id').references(() => businessEntityContact.id, { onDelete: 'set null' }),
  
  /* Request Source & Channel */
  source: varchar('source', { length: 50 }).default('web'), // web, email, phone, in_person, api
  channel: varchar('channel', { length: 50 }), // sales_team, customer_portal, partner, direct
  referenceNumber: varchar('reference_number', { length: 100 }), // Customer's reference number
  
  /* Timeline & Deadlines */
  requestedDeliveryDate: timestamp('requested_delivery_date'),
  promisedDeliveryDate: timestamp('promised_delivery_date'),
  actualDeliveryDate: timestamp('actual_delivery_date'),
  responseDeadline: timestamp('response_deadline'), // SLA response time
  resolutionDeadline: timestamp('resolution_deadline'), // SLA resolution time
  
  /* Financial Summary */
  estimatedValue: decimal('estimated_value', { precision: 15, scale: 2 }),
  quotedValue: decimal('quoted_value', { precision: 15, scale: 2 }),
  finalValue: decimal('final_value', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  /* Assignment & Ownership */
  ownerId: text('owner_id').references(() => user.id), // Primary owner/responsible person
  assignedTeam: varchar('assigned_team', { length: 100 }), // sales, support, procurement
  
  /* Clarification Stage Tracking */
  clarificationStartedAt: timestamp('clarification_started_at'),
  clarificationCompletedAt: timestamp('clarification_completed_at'),
  clarificationNotes: text('clarification_notes'),
  isClarified: boolean('is_clarified').default(false),
  
  /* Supplier Inquiry Stage Tracking */
  supplierInquiryStartedAt: timestamp('supplier_inquiry_started_at'),
  supplierInquiryCompletedAt: timestamp('supplier_inquiry_completed_at'),
  suppliersContacted: integer('suppliers_contacted').default(0),
  quotesReceived: integer('quotes_received').default(0),
  
  /* Outcome & Resolution */
  outcome: varchar('outcome', { length: 50 }), // won, lost, cancelled, expired
  outcomeReason: text('outcome_reason'),
  competitorWon: varchar('competitor_won', { length: 255 }), // If lost, who won
  closedAt: timestamp('closed_at'),
  closedBy: text('closed_by').references(() => user.id),
  
  /* Tags & Categorization */
  tags: jsonb('tags').default([]), // ['urgent', 'vip', 'repeat_customer']
  labels: jsonb('labels').default([]), // User-defined labels
  customFields: jsonb('custom_fields'), // Flexible fields for specific needs
  
  /* Metadata */
  metadata: jsonb('metadata'), // Additional unstructured data
  internalNotes: text('internal_notes'), // Private notes not visible to customer
  
  /* Audit Fields */
  createdBy: text('created_by').references(() => user.id).notNull(),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  // Unique constraints
  unique('request_number_workspace').on(table.requestNumber, table.workspaceId),
  
  // Performance indexes
  index('request_workspace_company_idx').on(table.workspaceId, table.companyId),
  index('request_status_idx').on(table.status),
  index('request_priority_idx').on(table.priority),
  index('request_customer_idx').on(table.customerId),
  index('request_owner_idx').on(table.ownerId),
  index('request_created_at_idx').on(table.createdAt),
  
  // Composite indexes for common queries
  index('request_status_priority_idx').on(table.status, table.priority),
  index('request_customer_status_idx').on(table.customerId, table.status),
  index('request_owner_status_idx').on(table.ownerId, table.status),
  index('request_workspace_status_created_idx').on(table.workspaceId, table.status, table.createdAt),
  
  // Validation constraints
  check('request_dates_check', sql`
    (requested_delivery_date IS NULL OR actual_delivery_date IS NULL OR requested_delivery_date <= actual_delivery_date)
  `),
]);

// ============================================
// REQUEST ITEMS TABLE
// ============================================
// Individual products/services requested within a request
export const requestItem = pgTable('request_item', {
  /* Core Identifiers */
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  itemNumber: integer('item_number').notNull(), // Line item number (1, 2, 3...)
  revision: integer('revision').default(0).notNull(), // Track changes to item specs
  
  /* Product/Service Details */
  itemType: varchar('item_type', { length: 50 }).default('product'), // product, service, spare_part
  productCode: varchar('product_code', { length: 100 }),
  productName: varchar('product_name', { length: 500 }).notNull(),
  description: text('description'),
  manufacturer: varchar('manufacturer', { length: 255 }),
  brand: varchar('brand', { length: 255 }),
  model: varchar('model', { length: 255 }),
  partNumber: varchar('part_number', { length: 100 }),
  
  /* Specifications */
  specifications: jsonb('specifications'), // Technical specs as JSON
  category: varchar('category', { length: 100 }),
  subCategory: varchar('sub_category', { length: 100 }),
  
  /* Quantity & Units */
  requestedQuantity: decimal('requested_quantity', { precision: 15, scale: 3 }).notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }).default('piece'), // piece, kg, meter, etc.
  minimumOrderQuantity: decimal('minimum_order_quantity', { precision: 15, scale: 3 }),
  quantityTolerance: decimal('quantity_tolerance', { precision: 5, scale: 2 }), // +/- percentage
  
  /* Pricing Information */
  targetPrice: decimal('target_price', { precision: 15, scale: 2 }),
  previousPrice: decimal('previous_price', { precision: 15, scale: 2 }), // Historical reference
  quotedPrice: decimal('quoted_price', { precision: 15, scale: 2 }),
  finalPrice: decimal('final_price', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  priceValidUntil: timestamp('price_valid_until'),
  
  /* Delivery Requirements */
  requiredByDate: timestamp('required_by_date'),
  deliveryTerms: varchar('delivery_terms', { length: 50 }), // EXW, FOB, CIF, DDP
  deliveryLocation: text('delivery_location'),
  
  /* Compliance & Certification */
  certificationRequired: jsonb('certification_required'), // Array of required certs
  complianceStandards: jsonb('compliance_standards'), // ISO, MIL-STD, etc.
  exportControlled: boolean('export_controlled').default(false),
  itarControlled: boolean('itar_controlled').default(false),
  endUseStatement: text('end_use_statement'),
  
  /* Item Status */
  status: requestItemStatusEnum('status').default('pending'), // pending, quoted, approved, rejected, ordered
  statusReason: text('status_reason'),
  
  /* Supplier Assignment */
  preferredSupplierId: text('preferred_supplier_id'), // Reference to supplier
  alternativeSuppliers: jsonb('alternative_suppliers'), // Array of supplier IDs
  
  /* Notes & References */
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  customerReference: varchar('customer_reference', { length: 255 }),
  attachments: jsonb('attachments'), // References to file IDs
  
  /* Metadata */
  customFields: jsonb('custom_fields'),
  metadata: jsonb('metadata'),
  
  /* Audit Fields */
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // Unique constraint for item numbering within a request
  unique('request_item_number').on(table.requestId, table.itemNumber),
  
  // Performance indexes
  index('request_item_request_idx').on(table.requestId),
  index('request_item_status_idx').on(table.status),
  index('request_item_product_code_idx').on(table.productCode),
  index('request_item_category_idx').on(table.category),
  
  // Composite indexes
  index('request_item_request_status_idx').on(table.requestId, table.status),
]);

// ============================================
// REQUEST ITEM REVISIONS TABLE
// ============================================
// Track all changes to request items for audit trail
export const requestItemRevision = pgTable('request_item_revision', {
  id: text('id').primaryKey(),
  requestItemId: text('request_item_id').references(() => requestItem.id, { onDelete: 'cascade' }).notNull(),
  revisionNumber: integer('revision_number').notNull(),
  
  /* Snapshot of item data at this revision */
  itemData: jsonb('item_data').notNull(), // Complete snapshot of requestItem at this revision
  
  /* Change tracking */
  changeType: varchar('change_type', { length: 50 }).notNull(), // created, updated, quantity_changed, price_changed
  changeDescription: text('change_description'),
  changedFields: jsonb('changed_fields'), // Array of field names that changed
  
  /* Reason for change */
  reason: text('reason'),
  requestedBy: varchar('requested_by', { length: 255 }), // Could be customer name or internal user
  
  /* Audit */
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('item_revision_number').on(table.requestItemId, table.revisionNumber),
  index('request_item_revision_item_idx').on(table.requestItemId),
  index('request_item_revision_created_idx').on(table.createdAt),
]);

// ============================================
// REQUEST FILES TABLE
// ============================================
// Documents and files attached to requests
export const requestFile = pgTable('request_file', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  requestItemId: text('request_item_id').references(() => requestItem.id, { onDelete: 'cascade' }), // Optional link to specific item
  
  /* File Information */
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }), // document, image, drawing, specification
  category: varchar('category', { length: 100 }), // rfq, technical_spec, certificate, contract
  mimeType: varchar('mime_type', { length: 255 }),
  fileSize: integer('file_size'), // in bytes
  
  /* Storage */
  storageUrl: text('storage_url').notNull(),
  storagePath: text('storage_path'),
  thumbnailUrl: text('thumbnail_url'),
  
  /* File Metadata */
  description: text('description'),
  version: varchar('version', { length: 50 }),
  isLatestVersion: boolean('is_latest_version').default(true),
  parentFileId: text('parent_file_id'), // For versioning
  
  /* Visibility & Security */
  isInternal: boolean('is_internal').default(false), // Internal only, not visible to customer
  isConfidential: boolean('is_confidential').default(false),
  accessLevel: varchar('access_level', { length: 50 }).default('request_team'), // all, request_team, owner_only
  
  /* Metadata */
  metadata: jsonb('metadata'),
  tags: jsonb('tags').default([]),
  
  /* Audit Fields */
  uploadedBy: text('uploaded_by').references(() => user.id).notNull(),
  
  /* Timestamps */
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('request_file_request_idx').on(table.requestId),
  index('request_file_item_idx').on(table.requestItemId),
  index('request_file_category_idx').on(table.category),
  index('request_file_uploaded_at_idx').on(table.uploadedAt),
]);

// ============================================
// REQUEST NOTES TABLE
// ============================================
// Notes and comments on requests
export const requestNote = pgTable('request_note', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  requestItemId: text('request_item_id').references(() => requestItem.id, { onDelete: 'cascade' }), // Optional link to specific item
  
  /* Note Content */
  noteType: varchar('note_type', { length: 50 }).default('general'), // general, clarification, technical, commercial, internal
  subject: varchar('subject', { length: 500 }),
  content: text('content').notNull(),
  
  /* Visibility */
  isInternal: boolean('is_internal').default(true).notNull(), // Internal team only
  isCustomerVisible: boolean('is_customer_visible').default(false).notNull(),
  isPinned: boolean('is_pinned').default(false), // Important notes
  
  /* Related Context */
  relatedToStatus: requestStatusEnum('related_to_status'), // Note related to specific status
  mentionedUsers: jsonb('mentioned_users'), // Array of user IDs mentioned in note
  attachments: jsonb('attachments'), // Array of file IDs
  
  /* Metadata */
  metadata: jsonb('metadata'),
  
  /* Audit Fields */
  createdBy: text('created_by').references(() => user.id).notNull(),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('request_note_request_idx').on(table.requestId),
  index('request_note_type_idx').on(table.noteType),
  index('request_note_internal_idx').on(table.isInternal),
  index('request_note_created_at_idx').on(table.createdAt),
]);

// ============================================
// REQUEST EMPLOYEES TABLE
// ============================================
// Team members assigned to work on a request
export const requestEmployee = pgTable('request_employee', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  
  /* Assignment Details */
  role: varchar('role', { length: 100 }).notNull(), // owner, sales_rep, technical_lead, procurement, support
  isPrimary: boolean('is_primary').default(false), // Primary contact for this role
  
  /* Responsibilities */
  responsibilities: text('responsibilities'), // Specific tasks/responsibilities
  department: varchar('department', { length: 100 }), // Sales, Technical, Procurement
  
  /* Permissions on this request */
  canEdit: boolean('can_edit').default(false),
  canDelete: boolean('can_delete').default(false),
  canChangeStatus: boolean('can_change_status').default(false),
  canViewFinancials: boolean('can_view_financials').default(true),
  canContactCustomer: boolean('can_contact_customer').default(false),
  
  /* Assignment Period */
  assignedFrom: timestamp('assigned_from').defaultNow().notNull(),
  assignedUntil: timestamp('assigned_until'),
  isActive: boolean('is_active').default(true).notNull(),
  
  /* Performance Metrics */
  tasksAssigned: integer('tasks_assigned').default(0),
  tasksCompleted: integer('tasks_completed').default(0),
  
  /* Notes */
  notes: text('notes'),
  
  /* Audit Fields */
  assignedBy: text('assigned_by').references(() => user.id).notNull(),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // Prevent duplicate assignments
  unique('request_employee_unique').on(table.requestId, table.userId, table.role),
  
  // Indexes
  index('request_employee_request_idx').on(table.requestId),
  index('request_employee_user_idx').on(table.userId),
  index('request_employee_role_idx').on(table.role),
  index('request_employee_active_idx').on(table.isActive),
]);

// ============================================
// REQUEST ACTIVITIES TABLE
// ============================================
// Comprehensive activity log for all request-related actions
export const requestActivity = pgTable('request_activity', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  requestItemId: text('request_item_id').references(() => requestItem.id, { onDelete: 'cascade' }), // If activity is item-specific
  
  /* Activity Classification */
  activityType: varchar('activity_type', { length: 100 }).notNull(), // status_change, assignment, note_added, item_added, item_updated, file_uploaded, email_sent
  activityCategory: varchar('activity_category', { length: 50 }), // system, user, customer, automated
  importance: varchar('importance', { length: 20 }).default('normal'), // low, normal, high, critical
  
  /* Activity Details */
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  
  /* Change Tracking */
  entityType: varchar('entity_type', { length: 50 }), // request, request_item, note, file, etc.
  entityId: text('entity_id'), // ID of the affected entity
  oldValue: jsonb('old_value'), // Previous state
  newValue: jsonb('new_value'), // New state
  changedFields: jsonb('changed_fields'), // List of changed field names
  
  /* Related Entities */
  relatedUserId: text('related_user_id').references(() => user.id), // User involved in activity
  relatedData: jsonb('related_data'), // Additional context data
  
  /* Communication Tracking (if activity involves communication) */
  communicationType: varchar('communication_type', { length: 50 }), // email, phone, meeting, chat
  communicationDetails: jsonb('communication_details'), // Email subject, phone number, etc.
  
  /* System Metadata */
  isSystemGenerated: boolean('is_system_generated').default(false),
  triggerSource: varchar('trigger_source', { length: 100 }), // api, web_ui, email_integration, workflow
  
  /* Metadata */
  metadata: jsonb('metadata'),
  
  /* Audit Fields */
  performedBy: text('performed_by').references(() => user.id),
  performedAt: timestamp('performed_at').defaultNow().notNull(),
  
  /* IP and User Agent for security */
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
}, (table) => [
  index('request_activity_request_idx').on(table.requestId),
  index('request_activity_type_idx').on(table.activityType),
  index('request_activity_performed_at_idx').on(table.performedAt),
  index('request_activity_performed_by_idx').on(table.performedBy),
  index('request_activity_importance_idx').on(table.importance),
]);

// ============================================
// REQUEST ACTIONS TABLE
// ============================================
// Specific actions taken for a request (calls, meetings, follow-ups)
export const requestAction = pgTable('request_action', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  
  /* Action Classification */
  actionType: varchar('action_type', { length: 100 }).notNull(), // call, email, meeting, site_visit, quote_request, sample_sent
  actionCategory: varchar('action_category', { length: 50 }), // sales, technical, support, procurement
  priority: requestPriorityEnum('priority').default('medium'),
  
  /* Action Details */
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  purpose: text('purpose'), // Why this action was taken
  
  /* Scheduling */
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // in minutes
  
  /* Participants */
  assignedTo: text('assigned_to').references(() => user.id),
  participants: jsonb('participants'), // Array of {userId, name, role, company}
  
  /* Customer Contact Details */
  customerContactName: varchar('customer_contact_name', { length: 255 }),
  customerContactRole: varchar('customer_contact_role', { length: 255 }),
  customerContactEmail: varchar('customer_contact_email', { length: 255 }),
  customerContactPhone: varchar('customer_contact_phone', { length: 50 }),
  
  /* Action Outcome */
  status: varchar('status', { length: 50 }).default('pending'), // pending, in_progress, completed, cancelled, failed
  outcome: varchar('outcome', { length: 100 }), // successful, unsuccessful, follow_up_required, escalated
  outcomeNotes: text('outcome_notes'),
  
  /* Follow-up */
  requiresFollowUp: boolean('requires_follow_up').default(false),
  followUpDate: timestamp('follow_up_date'),
  followUpActionId: text('follow_up_action_id'), // Link to follow-up action
  followUpNotes: text('follow_up_notes'),
  
  /* Related Items */
  relatedItemIds: jsonb('related_item_ids'), // Array of requestItem IDs
  attachments: jsonb('attachments'), // Array of file IDs
  
  /* Location (for meetings/visits) */
  location: text('location'),
  locationType: varchar('location_type', { length: 50 }), // online, customer_site, our_office, other
  meetingLink: text('meeting_link'), // For online meetings
  
  /* Metadata */
  tags: jsonb('tags').default([]),
  customFields: jsonb('custom_fields'),
  metadata: jsonb('metadata'),
  
  /* Audit Fields */
  createdBy: text('created_by').references(() => user.id).notNull(),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('request_action_request_idx').on(table.requestId),
  index('request_action_type_idx').on(table.actionType),
  index('request_action_status_idx').on(table.status),
  index('request_action_assigned_idx').on(table.assignedTo),
  index('request_action_scheduled_idx').on(table.scheduledAt),
  index('request_action_follow_up_idx').on(table.requiresFollowUp, table.followUpDate),
]);

// ============================================
// REQUEST WORKFLOW STAGES TABLE
// ============================================
// Track the progression through workflow stages
export const requestWorkflowStage = pgTable('request_workflow_stage', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  
  /* Stage Information */
  stage: requestStatusEnum('stage').notNull(), // new, clarification, supplier_inquiry, pricing, offer, closed
  enteredAt: timestamp('entered_at').defaultNow().notNull(),
  exitedAt: timestamp('exited_at'),
  duration: integer('duration'), // Duration in this stage (minutes)
  
  /* Stage Completion Criteria */
  completionCriteria: jsonb('completion_criteria'), // What needs to be done
  completionStatus: jsonb('completion_status'), // What has been done
  isComplete: boolean('is_complete').default(false),
  
  /* Stage Owner */
  stageOwner: text('stage_owner').references(() => user.id),
  
  /* Notes */
  notes: text('notes'),
  blockers: text('blockers'), // What's preventing progress
  
  /* Audit */
  enteredBy: text('entered_by').references(() => user.id).notNull(),
  exitedBy: text('exited_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('request_workflow_request_idx').on(table.requestId),
  index('request_workflow_stage_idx').on(table.stage),
  index('request_workflow_entered_idx').on(table.enteredAt),
]);

// ============================================
// TYPE EXPORTS
// ============================================
export type RequestType = typeof request.$inferSelect;
export type RequestInsertType = typeof request.$inferInsert;

export type RequestItemType = typeof requestItem.$inferSelect;
export type RequestItemInsertType = typeof requestItem.$inferInsert;

export type RequestItemRevisionType = typeof requestItemRevision.$inferSelect;
export type RequestFileType = typeof requestFile.$inferSelect;
export type RequestNoteType = typeof requestNote.$inferSelect;
export type RequestEmployeeType = typeof requestEmployee.$inferSelect;
export type RequestActivityType = typeof requestActivity.$inferSelect;
export type RequestActionType = typeof requestAction.$inferSelect;
export type RequestWorkflowStageType = typeof requestWorkflowStage.$inferSelect;