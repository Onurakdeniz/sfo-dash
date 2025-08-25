import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check, boolean, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { requestStatusEnum, requestPriorityEnum, requestTypeEnum, requestCategoryEnum, requestStageEnum, requestActionTypeEnum } from "../enums";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";
import { businessEntity, businessEntityContact } from "./businessEntity";

// Main request table - stores request information with comprehensive metadata
export const request = pgTable('requests', {
  /* Core identifier */
  id: text('id').primaryKey(),
  requestNumber: varchar('request_number', { length: 20 }).notNull(),
  
  /* Workspace and company association */
  workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'cascade' }).notNull(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),
  
  /* Request details */
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: requestTypeEnum('type').default('general_inquiry').notNull(),
  category: requestCategoryEnum('category'),
  
  /* Workflow management */
  status: requestStatusEnum('status').default('new').notNull(),
  stage: requestStageEnum('stage').default('new').notNull(),
  priority: requestPriorityEnum('priority').default('medium').notNull(),
  
  /* Customer association (business entity that requested) */
  customerId: text('customer_id').references(() => businessEntity.id, { onDelete: 'restrict' }).notNull(),
  customerContactId: text('customer_contact_id').references(() => businessEntityContact.id, { onDelete: 'set null' }),
  
  /* Request source and reference */
  source: varchar('source', { length: 50 }).default('direct'), // direct, email, phone, portal, api
  referenceNumber: varchar('reference_number', { length: 100 }), // Customer's reference number
  parentRequestId: text('parent_request_id').references(() => request.id, { onDelete: 'set null' }), // For follow-up requests
  
  /* Contact information for this specific request */
  contactName: varchar('contact_name', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactTitle: varchar('contact_title', { length: 100 }),
  
  /* Request metadata */
  tags: jsonb('tags').default([]),
  metadata: jsonb('metadata'),
  customFields: jsonb('custom_fields'), // For dynamic fields specific to request types
  
  /* Deadline and scheduling */
  requestedDeliveryDate: timestamp('requested_delivery_date'),
  promisedDeliveryDate: timestamp('promised_delivery_date'),
  actualDeliveryDate: timestamp('actual_delivery_date'),
  responseDeadline: timestamp('response_deadline'), // When we need to respond by
  
  /* Time tracking */
  estimatedHours: decimal('estimated_hours', { precision: 5, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 5, scale: 2 }),
  
  /* Financial information */
  estimatedValue: decimal('estimated_value', { precision: 15, scale: 2 }),
  quotedValue: decimal('quoted_value', { precision: 15, scale: 2 }),
  finalValue: decimal('final_value', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  /* Resolution details */
  resolution: text('resolution'),
  resolutionDate: timestamp('resolution_date'),
  closureReason: varchar('closure_reason', { length: 50 }), // won, lost, cancelled, duplicate
  competitorWon: varchar('competitor_won', { length: 255 }), // If lost, who won
  lossReason: text('loss_reason'), // Why we lost the deal
  
  /* Workflow timestamps */
  clarificationStartDate: timestamp('clarification_start_date'),
  clarificationEndDate: timestamp('clarification_end_date'),
  supplierInquiryStartDate: timestamp('supplier_inquiry_start_date'),
  pricingStartDate: timestamp('pricing_start_date'),
  offerSentDate: timestamp('offer_sent_date'),
  
  /* Compliance and export control */
  exportControlled: boolean('export_controlled').default(false),
  itarControlled: boolean('itar_controlled').default(false),
  endUserCountry: varchar('end_user_country', { length: 100 }),
  endUserCertificateRequired: boolean('end_user_certificate_required').default(false),
  
  /* Internal flags */
  isUrgent: boolean('is_urgent').default(false),
  isConfidential: boolean('is_confidential').default(false),
  requiresApproval: boolean('requires_approval').default(false),
  approvedBy: text('approved_by').references(() => user.id),
  approvalDate: timestamp('approval_date'),
  
  /* Audit fields */
  createdBy: text('created_by').references(() => user.id).notNull(),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  // Unique constraints
  unique('request_number_workspace_unique').on(table.requestNumber, table.workspaceId),
  
  // Performance indexes
  index('request_workspace_company_idx').on(table.workspaceId, table.companyId),
  index('request_status_idx').on(table.status),
  index('request_stage_idx').on(table.stage),
  index('request_priority_idx').on(table.priority),
  index('request_customer_idx').on(table.customerId),
  index('request_type_idx').on(table.type),
  index('request_category_idx').on(table.category),
  index('request_created_at_idx').on(table.createdAt),
  index('request_response_deadline_idx').on(table.responseDeadline),
  
  // Composite indexes for common queries
  index('request_status_priority_idx').on(table.status, table.priority),
  index('request_customer_status_idx').on(table.customerId, table.status),
  index('request_stage_status_idx').on(table.stage, table.status),
  
  // Validation constraints
  check('request_email_check', sql`contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  check('request_phone_check', sql`contact_phone IS NULL OR contact_phone ~* '^\\+?[1-9]\\d{1,14}$'`),
]);

// Request items table - individual products/services requested
export const requestItem = pgTable('request_items', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  
  /* Item identification */
  itemNumber: integer('item_number').notNull(), // Line item number
  revision: integer('revision').default(0).notNull(), // Revision number for tracking changes
  
  /* Product details */
  productCode: varchar('product_code', { length: 100 }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productDescription: text('product_description'),
  manufacturer: varchar('manufacturer', { length: 255 }),
  manufacturerPartNumber: varchar('manufacturer_part_number', { length: 100 }),
  model: varchar('model', { length: 255 }),
  
  /* Specifications */
  specifications: jsonb('specifications'), // Technical specs as JSON
  category: varchar('category', { length: 100 }),
  subCategory: varchar('sub_category', { length: 100 }),
  
  /* Quantity and pricing */
  requestedQuantity: decimal('requested_quantity', { precision: 15, scale: 3 }).notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }).default('piece'),
  targetUnitPrice: decimal('target_unit_price', { precision: 15, scale: 2 }),
  targetTotalPrice: decimal('target_total_price', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  /* Delivery requirements */
  requestedDeliveryDate: timestamp('requested_delivery_date'),
  deliveryTerms: varchar('delivery_terms', { length: 50 }), // EXW, FOB, CIF, etc.
  deliveryLocation: text('delivery_location'),
  
  /* Compliance */
  exportControlled: boolean('export_controlled').default(false),
  itarControlled: boolean('itar_controlled').default(false),
  certificationRequired: jsonb('certification_required'), // Array of required certifications
  qualityStandards: jsonb('quality_standards'), // ISO, MIL-SPEC, etc.
  
  /* Status tracking */
  status: varchar('status', { length: 50 }).default('pending'), // pending, quoted, approved, rejected, cancelled
  quotedQuantity: decimal('quoted_quantity', { precision: 15, scale: 3 }),
  quotedUnitPrice: decimal('quoted_unit_price', { precision: 15, scale: 2 }),
  quotedTotalPrice: decimal('quoted_total_price', { precision: 15, scale: 2 }),
  
  /* Notes and metadata */
  customerNotes: text('customer_notes'), // Notes from customer
  internalNotes: text('internal_notes'), // Internal notes
  metadata: jsonb('metadata'),
  
  /* Audit fields */
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('request_items_request_idx').on(table.requestId),
  index('request_items_product_code_idx').on(table.productCode),
  index('request_items_status_idx').on(table.status),
  unique('request_item_number_unique').on(table.requestId, table.itemNumber),
]);

// Request files table - documents associated with requests
export const requestFile = pgTable('request_files', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  requestItemId: text('request_item_id').references(() => requestItem.id, { onDelete: 'cascade' }), // Optional link to specific item
  
  /* File metadata */
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // document, image, drawing, specification, certificate
  category: varchar('category', { length: 100 }), // rfq, technical_spec, compliance, commercial, other
  
  /* Storage information */
  storageUrl: text('storage_url').notNull(),
  storagePath: text('storage_path'),
  contentType: varchar('content_type', { length: 255 }),
  fileSize: integer('file_size').notNull(), // in bytes
  
  /* File details */
  description: text('description'),
  version: varchar('version', { length: 20 }),
  isLatestVersion: boolean('is_latest_version').default(true),
  
  /* Visibility */
  isInternal: boolean('is_internal').default(false).notNull(),
  isVisibleToCustomer: boolean('is_visible_to_customer').default(false).notNull(),
  isVisibleToSupplier: boolean('is_visible_to_supplier').default(false).notNull(),
  
  /* Metadata */
  metadata: jsonb('metadata'),
  tags: jsonb('tags').default([]),
  
  /* Audit fields */
  uploadedBy: text('uploaded_by').references(() => user.id).notNull(),
  
  /* Timestamps */
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('request_files_request_idx').on(table.requestId),
  index('request_files_item_idx').on(table.requestItemId),
  index('request_files_type_idx').on(table.fileType),
  index('request_files_category_idx').on(table.category),
  index('request_files_uploaded_at_idx').on(table.uploadedAt),
]);

// Request notes table - for tracking communications and internal notes
export const requestNote = pgTable('request_notes', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  requestItemId: text('request_item_id').references(() => requestItem.id, { onDelete: 'cascade' }), // Optional link to specific item
  
  /* Note details */
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  noteType: varchar('note_type', { length: 50 }).notNull(), // internal, customer_communication, supplier_communication, clarification, resolution
  
  /* Communication details (if applicable) */
  communicationMethod: varchar('communication_method', { length: 50 }), // email, phone, meeting, chat
  communicationDate: timestamp('communication_date'),
  contactPerson: varchar('contact_person', { length: 255 }),
  
  /* Visibility */
  isInternal: boolean('is_internal').default(true).notNull(),
  isVisibleToCustomer: boolean('is_visible_to_customer').default(false).notNull(),
  isPinned: boolean('is_pinned').default(false), // Pin important notes
  
  /* Related entities */
  relatedUserId: text('related_user_id').references(() => user.id),
  relatedContactId: text('related_contact_id').references(() => businessEntityContact.id),
  
  /* Metadata */
  attachments: jsonb('attachments').default([]), // Array of file IDs
  metadata: jsonb('metadata'),
  
  /* Audit fields */
  createdBy: text('created_by').references(() => user.id).notNull(),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('request_notes_request_idx').on(table.requestId),
  index('request_notes_item_idx').on(table.requestItemId),
  index('request_notes_type_idx').on(table.noteType),
  index('request_notes_created_at_idx').on(table.createdAt),
  index('request_notes_pinned_idx').on(table.isPinned),
]);

// Request team members table - employees assigned to work on the request
export const requestTeamMember = pgTable('request_team_members', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  
  /* Role and responsibilities */
  role: varchar('role', { length: 50 }).notNull(), // owner, technical_lead, commercial_lead, support, observer
  responsibilities: text('responsibilities'),
  
  /* Assignment details */
  assignedBy: text('assigned_by').references(() => user.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  unassignedAt: timestamp('unassigned_at'),
  
  /* Permissions */
  canEdit: boolean('can_edit').default(true).notNull(),
  canDelete: boolean('can_delete').default(false).notNull(),
  canAssignOthers: boolean('can_assign_others').default(false).notNull(),
  
  /* Activity tracking */
  lastActivityAt: timestamp('last_activity_at'),
  totalTimeSpent: integer('total_time_spent'), // in minutes
  
  /* Metadata */
  metadata: jsonb('metadata'),
}, (table) => [
  index('request_team_request_idx').on(table.requestId),
  index('request_team_user_idx').on(table.userId),
  index('request_team_role_idx').on(table.role),
  unique('request_team_member_unique').on(table.requestId, table.userId),
]);

// Request activities table - comprehensive audit log
export const requestActivity = pgTable('request_activities', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  requestItemId: text('request_item_id').references(() => requestItem.id, { onDelete: 'cascade' }), // Optional link to specific item
  
  /* Activity details */
  activityType: varchar('activity_type', { length: 100 }).notNull(), // status_change, assignment, note_added, file_uploaded, item_added, item_updated, etc.
  activityCategory: varchar('activity_category', { length: 50 }), // workflow, communication, documentation, commercial, technical
  description: text('description').notNull(),
  
  /* Change tracking */
  entityType: varchar('entity_type', { length: 50 }), // request, request_item, note, file, etc.
  entityId: text('entity_id'),
  fieldName: varchar('field_name', { length: 100 }),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  
  /* Related data */
  relatedData: jsonb('related_data'), // Additional context-specific data
  
  /* Visibility */
  isVisibleToCustomer: boolean('is_visible_to_customer').default(false).notNull(),
  
  /* Audit fields */
  performedBy: text('performed_by').references(() => user.id).notNull(),
  performedAt: timestamp('performed_at').defaultNow().notNull(),
  
  /* IP and session tracking */
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  sessionId: text('session_id'),
}, (table) => [
  index('request_activities_request_idx').on(table.requestId),
  index('request_activities_item_idx').on(table.requestItemId),
  index('request_activities_type_idx').on(table.activityType),
  index('request_activities_category_idx').on(table.activityCategory),
  index('request_activities_performed_by_idx').on(table.performedBy),
  index('request_activities_performed_at_idx').on(table.performedAt),
]);

// Request actions table - specific actions taken during request processing
export const requestAction = pgTable('request_actions', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  
  /* Action details */
  actionType: requestActionTypeEnum('action_type').notNull(),
  actionCategory: varchar('action_category', { length: 50 }), // communication, procurement, technical, commercial
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  /* Stage and status at time of action */
  stageAtAction: requestStageEnum('stage_at_action').notNull(),
  statusAtAction: requestStatusEnum('status_at_action').notNull(),
  
  /* Communication details (if applicable) */
  communicationType: varchar('communication_type', { length: 50 }), // email, phone, meeting, site_visit
  contactEntity: varchar('contact_entity', { length: 50 }), // customer, supplier, internal
  contactPerson: varchar('contact_person', { length: 255 }),
  contactCompany: varchar('contact_company', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  
  /* Action outcome */
  outcome: varchar('outcome', { length: 100 }), // successful, pending, failed, follow_up_required
  outcomeNotes: text('outcome_notes'),
  
  /* Follow-up */
  requiresFollowUp: boolean('requires_follow_up').default(false),
  followUpDate: timestamp('follow_up_date'),
  followUpAssignedTo: text('follow_up_assigned_to').references(() => user.id),
  followUpCompleted: boolean('follow_up_completed').default(false),
  followUpNotes: text('follow_up_notes'),
  
  /* Related entities */
  relatedItemIds: jsonb('related_item_ids').default([]), // Array of requestItem ids
  attachmentIds: jsonb('attachment_ids').default([]), // Array of file ids
  
  /* Time tracking */
  scheduledDate: timestamp('scheduled_date'),
  actualDate: timestamp('actual_date'),
  duration: integer('duration'), // Duration in minutes
  
  /* Metadata */
  metadata: jsonb('metadata'),
  tags: jsonb('tags').default([]),
  
  /* Audit fields */
  performedBy: text('performed_by').references(() => user.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('request_actions_request_idx').on(table.requestId),
  index('request_actions_type_idx').on(table.actionType),
  index('request_actions_category_idx').on(table.actionCategory),
  index('request_actions_outcome_idx').on(table.outcome),
  index('request_actions_performed_by_idx').on(table.performedBy),
  index('request_actions_scheduled_date_idx').on(table.scheduledDate),
  index('request_actions_follow_up_idx').on(table.requiresFollowUp, table.followUpDate),
]);

// Request stage transitions table - tracks workflow stage changes
export const requestStageTransition = pgTable('request_stage_transitions', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => request.id, { onDelete: 'cascade' }).notNull(),
  
  /* Transition details */
  fromStage: requestStageEnum('from_stage'),
  toStage: requestStageEnum('to_stage').notNull(),
  fromStatus: requestStatusEnum('from_status'),
  toStatus: requestStatusEnum('to_status').notNull(),
  
  /* Transition metadata */
  reason: text('reason'),
  notes: text('notes'),
  automaticTransition: boolean('automatic_transition').default(false),
  
  /* Duration tracking */
  stageStartedAt: timestamp('stage_started_at').notNull(),
  stageEndedAt: timestamp('stage_ended_at'),
  stageDuration: integer('stage_duration'), // in minutes
  
  /* Audit fields */
  transitionedBy: text('transitioned_by').references(() => user.id).notNull(),
  transitionedAt: timestamp('transitioned_at').defaultNow().notNull(),
}, (table) => [
  index('request_transitions_request_idx').on(table.requestId),
  index('request_transitions_from_stage_idx').on(table.fromStage),
  index('request_transitions_to_stage_idx').on(table.toStage),
  index('request_transitions_transitioned_at_idx').on(table.transitionedAt),
]);

// Type exports
export type RequestType = typeof request.$inferSelect;
export type RequestItemType = typeof requestItem.$inferSelect;
export type RequestFileType = typeof requestFile.$inferSelect;
export type RequestNoteType = typeof requestNote.$inferSelect;
export type RequestTeamMemberType = typeof requestTeamMember.$inferSelect;
export type RequestActivityType = typeof requestActivity.$inferSelect;
export type RequestActionType = typeof requestAction.$inferSelect;
export type RequestStageTransitionType = typeof requestStageTransition.$inferSelect;