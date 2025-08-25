CREATE TYPE "public"."request_action_type" AS ENUM('email_sent', 'email_received', 'call_made', 'call_received', 'meeting_held', 'site_visit', 'video_conference', 'document_requested', 'document_received', 'document_sent', 'specification_updated', 'supplier_contacted', 'quote_requested', 'quote_received', 'supplier_selected', 'supplier_rejected', 'price_calculated', 'offer_prepared', 'offer_sent', 'offer_revised', 'negotiation_round', 'discount_applied', 'internal_review', 'approval_requested', 'approval_granted', 'approval_denied', 'escalation', 'customer_clarification', 'customer_feedback', 'customer_approval', 'customer_rejection', 'technical_review', 'compliance_check', 'certification_verified', 'export_control_check', 'follow_up_scheduled', 'follow_up_completed', 'reminder_sent', 'note_added', 'status_changed', 'assignment_changed', 'other');--> statement-breakpoint
CREATE TYPE "public"."request_category" AS ENUM('weapon_systems', 'ammunition', 'missiles', 'uav_systems', 'avionics', 'radar_systems', 'communication', 'electronic_warfare', 'c4isr', 'naval_systems', 'land_systems', 'air_systems', 'space_systems', 'simulation', 'cyber_security', 'logistics', 'maintenance_equip', 'electronics', 'mechanical', 'materials', 'software', 'hardware', 'services', 'spare_parts', 'consumables', 'other');--> statement-breakpoint
CREATE TYPE "public"."request_priority" AS ENUM('low', 'medium', 'high', 'urgent', 'critical');--> statement-breakpoint
CREATE TYPE "public"."request_stage" AS ENUM('new', 'clarification', 'supplier_inquiry', 'pricing', 'offer', 'negotiation', 'closing', 'closed');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('new', 'in_progress', 'pending_customer', 'pending_supplier', 'pending_internal', 'quoted', 'negotiating', 'approved', 'rejected', 'on_hold', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('rfq', 'rfi', 'rfp', 'rft', 'product_inquiry', 'price_request', 'quotation_request', 'order_request', 'sample_request', 'technical_inquiry', 'certification_req', 'compliance_inquiry', 'export_license', 'end_user_cert', 'technical_support', 'maintenance', 'training', 'installation', 'delivery_status', 'return_request', 'complaint', 'general_inquiry', 'other');--> statement-breakpoint
CREATE TABLE "requests" (
	"id" text PRIMARY KEY NOT NULL,
	"request_number" varchar(20) NOT NULL,
	"workspace_id" text NOT NULL,
	"company_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" "request_type" DEFAULT 'general_inquiry' NOT NULL,
	"category" "request_category",
	"status" "request_status" DEFAULT 'new' NOT NULL,
	"stage" "request_stage" DEFAULT 'new' NOT NULL,
	"priority" "request_priority" DEFAULT 'medium' NOT NULL,
	"customer_id" text NOT NULL,
	"customer_contact_id" text,
	"source" varchar(50) DEFAULT 'direct',
	"reference_number" varchar(100),
	"parent_request_id" text,
	"contact_name" varchar(255),
	"contact_phone" varchar(20),
	"contact_email" varchar(255),
	"contact_title" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"custom_fields" jsonb,
	"requested_delivery_date" timestamp,
	"promised_delivery_date" timestamp,
	"actual_delivery_date" timestamp,
	"response_deadline" timestamp,
	"estimated_hours" numeric(5, 2),
	"actual_hours" numeric(5, 2),
	"estimated_value" numeric(15, 2),
	"quoted_value" numeric(15, 2),
	"final_value" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'USD',
	"resolution" text,
	"resolution_date" timestamp,
	"closure_reason" varchar(50),
	"competitor_won" varchar(255),
	"loss_reason" text,
	"clarification_start_date" timestamp,
	"clarification_end_date" timestamp,
	"supplier_inquiry_start_date" timestamp,
	"pricing_start_date" timestamp,
	"offer_sent_date" timestamp,
	"export_controlled" boolean DEFAULT false,
	"itar_controlled" boolean DEFAULT false,
	"end_user_country" varchar(100),
	"end_user_certificate_required" boolean DEFAULT false,
	"is_urgent" boolean DEFAULT false,
	"is_confidential" boolean DEFAULT false,
	"requires_approval" boolean DEFAULT false,
	"approved_by" text,
	"approval_date" timestamp,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "request_number_workspace_unique" UNIQUE("request_number","workspace_id"),
	CONSTRAINT "request_email_check" CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	CONSTRAINT "request_phone_check" CHECK (contact_phone IS NULL OR contact_phone ~* '^\+?[1-9]\d{1,14}$')
);
--> statement-breakpoint
CREATE TABLE "request_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"action_type" "request_action_type" NOT NULL,
	"action_category" varchar(50),
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"stage_at_action" "request_stage" NOT NULL,
	"status_at_action" "request_status" NOT NULL,
	"communication_type" varchar(50),
	"contact_entity" varchar(50),
	"contact_person" varchar(255),
	"contact_company" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"outcome" varchar(100),
	"outcome_notes" text,
	"requires_follow_up" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_assigned_to" text,
	"follow_up_completed" boolean DEFAULT false,
	"follow_up_notes" text,
	"related_item_ids" jsonb DEFAULT '[]'::jsonb,
	"attachment_ids" jsonb DEFAULT '[]'::jsonb,
	"scheduled_date" timestamp,
	"actual_date" timestamp,
	"duration" integer,
	"metadata" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"performed_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"request_item_id" text,
	"activity_type" varchar(100) NOT NULL,
	"activity_category" varchar(50),
	"description" text NOT NULL,
	"entity_type" varchar(50),
	"entity_id" text,
	"field_name" varchar(100),
	"old_value" text,
	"new_value" text,
	"related_data" jsonb,
	"is_visible_to_customer" boolean DEFAULT false NOT NULL,
	"performed_by" text NOT NULL,
	"performed_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" text
);
--> statement-breakpoint
CREATE TABLE "request_files" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"request_item_id" text,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"category" varchar(100),
	"storage_url" text NOT NULL,
	"storage_path" text,
	"content_type" varchar(255),
	"file_size" integer NOT NULL,
	"description" text,
	"version" varchar(20),
	"is_latest_version" boolean DEFAULT true,
	"is_internal" boolean DEFAULT false NOT NULL,
	"is_visible_to_customer" boolean DEFAULT false NOT NULL,
	"is_visible_to_supplier" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "request_items" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"item_number" integer NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"product_code" varchar(100),
	"product_name" varchar(255) NOT NULL,
	"product_description" text,
	"manufacturer" varchar(255),
	"manufacturer_part_number" varchar(100),
	"model" varchar(255),
	"specifications" jsonb,
	"category" varchar(100),
	"sub_category" varchar(100),
	"requested_quantity" numeric(15, 3) NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'piece',
	"target_unit_price" numeric(15, 2),
	"target_total_price" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'USD',
	"requested_delivery_date" timestamp,
	"delivery_terms" varchar(50),
	"delivery_location" text,
	"export_controlled" boolean DEFAULT false,
	"itar_controlled" boolean DEFAULT false,
	"certification_required" jsonb,
	"quality_standards" jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"quoted_quantity" numeric(15, 3),
	"quoted_unit_price" numeric(15, 2),
	"quoted_total_price" numeric(15, 2),
	"customer_notes" text,
	"internal_notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "request_item_number_unique" UNIQUE("request_id","item_number")
);
--> statement-breakpoint
CREATE TABLE "request_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"request_item_id" text,
	"title" varchar(255),
	"content" text NOT NULL,
	"note_type" varchar(50) NOT NULL,
	"communication_method" varchar(50),
	"communication_date" timestamp,
	"contact_person" varchar(255),
	"is_internal" boolean DEFAULT true NOT NULL,
	"is_visible_to_customer" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false,
	"related_user_id" text,
	"related_contact_id" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "request_stage_transitions" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"from_stage" "request_stage",
	"to_stage" "request_stage" NOT NULL,
	"from_status" "request_status",
	"to_status" "request_status" NOT NULL,
	"reason" text,
	"notes" text,
	"automatic_transition" boolean DEFAULT false,
	"stage_started_at" timestamp NOT NULL,
	"stage_ended_at" timestamp,
	"stage_duration" integer,
	"transitioned_by" text NOT NULL,
	"transitioned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"responsibilities" text,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"unassigned_at" timestamp,
	"can_edit" boolean DEFAULT true NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"can_assign_others" boolean DEFAULT false NOT NULL,
	"last_activity_at" timestamp,
	"total_time_spent" integer,
	"metadata" jsonb,
	CONSTRAINT "request_team_member_unique" UNIQUE("request_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_customer_id_business_entities_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."business_entities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_customer_contact_id_business_entity_contacts_id_fk" FOREIGN KEY ("customer_contact_id") REFERENCES "public"."business_entity_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_parent_request_id_requests_id_fk" FOREIGN KEY ("parent_request_id") REFERENCES "public"."requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_actions" ADD CONSTRAINT "request_actions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_actions" ADD CONSTRAINT "request_actions_follow_up_assigned_to_user_id_fk" FOREIGN KEY ("follow_up_assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_actions" ADD CONSTRAINT "request_actions_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_activities" ADD CONSTRAINT "request_activities_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_activities" ADD CONSTRAINT "request_activities_request_item_id_request_items_id_fk" FOREIGN KEY ("request_item_id") REFERENCES "public"."request_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_activities" ADD CONSTRAINT "request_activities_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_files" ADD CONSTRAINT "request_files_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_files" ADD CONSTRAINT "request_files_request_item_id_request_items_id_fk" FOREIGN KEY ("request_item_id") REFERENCES "public"."request_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_files" ADD CONSTRAINT "request_files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_notes" ADD CONSTRAINT "request_notes_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_notes" ADD CONSTRAINT "request_notes_request_item_id_request_items_id_fk" FOREIGN KEY ("request_item_id") REFERENCES "public"."request_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_notes" ADD CONSTRAINT "request_notes_related_user_id_user_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_notes" ADD CONSTRAINT "request_notes_related_contact_id_business_entity_contacts_id_fk" FOREIGN KEY ("related_contact_id") REFERENCES "public"."business_entity_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_notes" ADD CONSTRAINT "request_notes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_notes" ADD CONSTRAINT "request_notes_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_stage_transitions" ADD CONSTRAINT "request_stage_transitions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_stage_transitions" ADD CONSTRAINT "request_stage_transitions_transitioned_by_user_id_fk" FOREIGN KEY ("transitioned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_team_members" ADD CONSTRAINT "request_team_members_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_team_members" ADD CONSTRAINT "request_team_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_team_members" ADD CONSTRAINT "request_team_members_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "request_workspace_company_idx" ON "requests" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "request_status_idx" ON "requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "request_stage_idx" ON "requests" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "request_priority_idx" ON "requests" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "request_customer_idx" ON "requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "request_type_idx" ON "requests" USING btree ("type");--> statement-breakpoint
CREATE INDEX "request_category_idx" ON "requests" USING btree ("category");--> statement-breakpoint
CREATE INDEX "request_created_at_idx" ON "requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "request_response_deadline_idx" ON "requests" USING btree ("response_deadline");--> statement-breakpoint
CREATE INDEX "request_status_priority_idx" ON "requests" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "request_customer_status_idx" ON "requests" USING btree ("customer_id","status");--> statement-breakpoint
CREATE INDEX "request_stage_status_idx" ON "requests" USING btree ("stage","status");--> statement-breakpoint
CREATE INDEX "request_actions_request_idx" ON "request_actions" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_actions_type_idx" ON "request_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "request_actions_category_idx" ON "request_actions" USING btree ("action_category");--> statement-breakpoint
CREATE INDEX "request_actions_outcome_idx" ON "request_actions" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "request_actions_performed_by_idx" ON "request_actions" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "request_actions_scheduled_date_idx" ON "request_actions" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "request_actions_follow_up_idx" ON "request_actions" USING btree ("requires_follow_up","follow_up_date");--> statement-breakpoint
CREATE INDEX "request_activities_request_idx" ON "request_activities" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_activities_item_idx" ON "request_activities" USING btree ("request_item_id");--> statement-breakpoint
CREATE INDEX "request_activities_type_idx" ON "request_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "request_activities_category_idx" ON "request_activities" USING btree ("activity_category");--> statement-breakpoint
CREATE INDEX "request_activities_performed_by_idx" ON "request_activities" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "request_activities_performed_at_idx" ON "request_activities" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "request_files_request_idx" ON "request_files" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_files_item_idx" ON "request_files" USING btree ("request_item_id");--> statement-breakpoint
CREATE INDEX "request_files_type_idx" ON "request_files" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "request_files_category_idx" ON "request_files" USING btree ("category");--> statement-breakpoint
CREATE INDEX "request_files_uploaded_at_idx" ON "request_files" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "request_items_request_idx" ON "request_items" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_items_product_code_idx" ON "request_items" USING btree ("product_code");--> statement-breakpoint
CREATE INDEX "request_items_status_idx" ON "request_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "request_notes_request_idx" ON "request_notes" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_notes_item_idx" ON "request_notes" USING btree ("request_item_id");--> statement-breakpoint
CREATE INDEX "request_notes_type_idx" ON "request_notes" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "request_notes_created_at_idx" ON "request_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "request_notes_pinned_idx" ON "request_notes" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "request_transitions_request_idx" ON "request_stage_transitions" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_transitions_from_stage_idx" ON "request_stage_transitions" USING btree ("from_stage");--> statement-breakpoint
CREATE INDEX "request_transitions_to_stage_idx" ON "request_stage_transitions" USING btree ("to_stage");--> statement-breakpoint
CREATE INDEX "request_transitions_transitioned_at_idx" ON "request_stage_transitions" USING btree ("transitioned_at");--> statement-breakpoint
CREATE INDEX "request_team_request_idx" ON "request_team_members" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_team_user_idx" ON "request_team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "request_team_role_idx" ON "request_team_members" USING btree ("role");