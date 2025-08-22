CREATE TYPE "public"."talep_category" AS ENUM('hardware', 'software', 'network', 'database', 'security', 'performance', 'integration', 'reporting', 'user_access', 'other');--> statement-breakpoint
CREATE TYPE "public"."talep_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."talep_status" AS ENUM('new', 'in_progress', 'waiting', 'resolved', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."talep_type" AS ENUM('technical_support', 'billing', 'general_inquiry', 'complaint', 'feature_request', 'bug_report', 'installation', 'training', 'maintenance', 'other');--> statement-breakpoint
CREATE TYPE "public"."supplier_category" AS ENUM('strategic', 'preferred', 'approved', 'standard', 'new', 'temporary');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('active', 'inactive', 'prospect', 'suspended', 'blacklisted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."supplier_type" AS ENUM('individual', 'corporate');--> statement-breakpoint
CREATE TABLE "talep" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"company_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" "talep_type" DEFAULT 'general_inquiry' NOT NULL,
	"category" "talep_category",
	"status" "talep_status" DEFAULT 'new' NOT NULL,
	"priority" "talep_priority" DEFAULT 'medium' NOT NULL,
	"customer_id" text NOT NULL,
	"assigned_to" text,
	"assigned_by" text,
	"contact_name" varchar(255),
	"contact_phone" varchar(20),
	"contact_email" varchar(255),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"deadline" timestamp,
	"estimated_hours" numeric(5, 2),
	"actual_hours" numeric(5, 2),
	"resolution" text,
	"resolution_date" timestamp,
	"estimated_cost" numeric(15, 2),
	"actual_cost" numeric(15, 2),
	"billing_status" varchar(50),
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "talep_email_check" CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	CONSTRAINT "talep_phone_check" CHECK (contact_phone IS NULL OR contact_phone ~* '^\+?[1-9]\d{1,14}$')
);
--> statement-breakpoint
CREATE TABLE "talep_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"talep_id" text NOT NULL,
	"activity_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"metadata" jsonb,
	"performed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talep_files" (
	"id" text PRIMARY KEY NOT NULL,
	"talep_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"blob_url" text NOT NULL,
	"blob_path" text,
	"content_type" varchar(255),
	"size" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_visible_to_customer" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"uploaded_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "talep_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"talep_id" text NOT NULL,
	"title" varchar(255),
	"content" text NOT NULL,
	"note_type" varchar(50) DEFAULT 'internal',
	"is_internal" boolean DEFAULT true NOT NULL,
	"is_visible_to_customer" boolean DEFAULT false NOT NULL,
	"priority" "talep_priority" DEFAULT 'medium',
	"related_contact_id" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"company_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" text,
	"supplier_logo_url" text,
	"supplier_type" "supplier_type" DEFAULT 'individual' NOT NULL,
	"supplier_category" "supplier_category",
	"status" "supplier_status" DEFAULT 'active' NOT NULL,
	"industry" varchar(100),
	"priority" varchar(20) DEFAULT 'medium',
	"phone" varchar(20),
	"email" varchar(255),
	"website" varchar(255),
	"fax" varchar(20),
	"address" text,
	"district" varchar(100),
	"city" varchar(100),
	"postal_code" varchar(10),
	"country" varchar(100) DEFAULT 'Türkiye' NOT NULL,
	"tax_office" varchar(100),
	"tax_number" varchar(50),
	"mersis_number" varchar(50),
	"trade_registry_number" varchar(100),
	"default_currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"credit_limit" numeric(15, 2),
	"payment_terms" varchar(100),
	"discount_rate" numeric(5, 2),
	"supplier_code" varchar(50),
	"lead_time_days" integer,
	"minimum_order_quantity" integer,
	"order_increment" integer,
	"quality_rating" numeric(3, 2),
	"delivery_rating" numeric(3, 2),
	"primary_contact_name" varchar(255),
	"primary_contact_title" varchar(100),
	"primary_contact_phone" varchar(20),
	"primary_contact_email" varchar(255),
	"additional_contacts" jsonb DEFAULT '[]'::jsonb,
	"parent_supplier_id" text,
	"supplier_group" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"internal_notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "suppliers_supplier_code_unique" UNIQUE("workspace_id","company_id","supplier_code")
);
--> statement-breakpoint
CREATE TABLE "supplier_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"address_type" varchar(50) DEFAULT 'billing' NOT NULL,
	"title" varchar(100),
	"address" text NOT NULL,
	"district" varchar(100),
	"city" varchar(100),
	"postal_code" varchar(10),
	"country" varchar(100) DEFAULT 'Türkiye' NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"contact_name" varchar(255),
	"contact_title" varchar(100),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "supplier_addresses_email_check" CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	CONSTRAINT "supplier_addresses_phone_check" CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
	CONSTRAINT "supplier_addresses_postal_code_check" CHECK (postal_code IS NULL OR postal_code ~* '^[0-9]{5}$')
);
--> statement-breakpoint
CREATE TABLE "supplier_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"title" varchar(100),
	"department" varchar(100),
	"phone" varchar(20),
	"mobile" varchar(20),
	"email" varchar(255),
	"fax" varchar(20),
	"role" varchar(50),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "supplier_contacts_email_check" CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	CONSTRAINT "supplier_contacts_phone_check" CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
	CONSTRAINT "supplier_contacts_mobile_check" CHECK (mobile IS NULL OR mobile ~* '^\+?[1-9]\d{1,14}$'),
	CONSTRAINT "supplier_contacts_fax_check" CHECK (fax IS NULL OR fax ~* '^\+?[1-9]\d{1,14}$')
);
--> statement-breakpoint
CREATE TABLE "supplier_files" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"blob_url" text NOT NULL,
	"blob_path" text,
	"content_type" varchar(255),
	"size" integer DEFAULT 0 NOT NULL,
	"description" text,
	"metadata" jsonb,
	"uploaded_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "supplier_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"title" varchar(255),
	"content" text NOT NULL,
	"note_type" varchar(50) DEFAULT 'general',
	"is_internal" boolean DEFAULT false NOT NULL,
	"priority" varchar(20) DEFAULT 'medium',
	"related_contact_id" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "supplier_performance" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"period_type" varchar(20) DEFAULT 'monthly' NOT NULL,
	"on_time_delivery_rate" numeric(5, 2),
	"quality_rating" numeric(3, 2),
	"response_time_hours" numeric(5, 2),
	"order_fulfillment_rate" numeric(5, 2),
	"total_orders" integer DEFAULT 0,
	"total_order_value" numeric(15, 2),
	"average_order_value" numeric(15, 2),
	"quality_issues" integer DEFAULT 0,
	"delivery_issues" integer DEFAULT 0,
	"communication_issues" integer DEFAULT 0,
	"overall_score" numeric(5, 2),
	"notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "supplier_performance_unique_period" UNIQUE("supplier_id","period_start","period_end","period_type")
);
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_workspace_company_tax_number_unique";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_workspace_company_email_unique";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_email_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_phone_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_fax_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_primary_contact_email_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_primary_contact_phone_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_currency_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_tax_number_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_mersis_number_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_postal_code_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_website_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_credit_limit_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_discount_rate_check";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_priority_check";--> statement-breakpoint
ALTER TABLE "customer_notes" ALTER COLUMN "is_internal" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_activities" ADD CONSTRAINT "talep_activities_talep_id_talep_id_fk" FOREIGN KEY ("talep_id") REFERENCES "public"."talep"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_activities" ADD CONSTRAINT "talep_activities_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_files" ADD CONSTRAINT "talep_files_talep_id_talep_id_fk" FOREIGN KEY ("talep_id") REFERENCES "public"."talep"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_files" ADD CONSTRAINT "talep_files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_files" ADD CONSTRAINT "talep_files_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_notes" ADD CONSTRAINT "talep_notes_talep_id_talep_id_fk" FOREIGN KEY ("talep_id") REFERENCES "public"."talep"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_notes" ADD CONSTRAINT "talep_notes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_notes" ADD CONSTRAINT "talep_notes_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_addresses" ADD CONSTRAINT "supplier_addresses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_addresses" ADD CONSTRAINT "supplier_addresses_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_addresses" ADD CONSTRAINT "supplier_addresses_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_files" ADD CONSTRAINT "supplier_files_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_files" ADD CONSTRAINT "supplier_files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_files" ADD CONSTRAINT "supplier_files_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_notes" ADD CONSTRAINT "supplier_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_notes" ADD CONSTRAINT "supplier_notes_related_contact_id_supplier_contacts_id_fk" FOREIGN KEY ("related_contact_id") REFERENCES "public"."supplier_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_notes" ADD CONSTRAINT "supplier_notes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_notes" ADD CONSTRAINT "supplier_notes_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_performance" ADD CONSTRAINT "supplier_performance_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_performance" ADD CONSTRAINT "supplier_performance_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_performance" ADD CONSTRAINT "supplier_performance_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "talep_workspace_company_idx" ON "talep" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "talep_title_idx" ON "talep" USING btree ("title");--> statement-breakpoint
CREATE INDEX "talep_status_idx" ON "talep" USING btree ("status");--> statement-breakpoint
CREATE INDEX "talep_type_idx" ON "talep" USING btree ("type");--> statement-breakpoint
CREATE INDEX "talep_category_idx" ON "talep" USING btree ("category");--> statement-breakpoint
CREATE INDEX "talep_priority_idx" ON "talep" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "talep_customer_idx" ON "talep" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "talep_assigned_to_idx" ON "talep" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "talep_assigned_by_idx" ON "talep" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "talep_deadline_idx" ON "talep" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "talep_created_by_idx" ON "talep" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "talep_created_at_idx" ON "talep" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "talep_updated_at_idx" ON "talep" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "talep_status_created_idx" ON "talep" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "talep_type_status_idx" ON "talep" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "talep_priority_status_idx" ON "talep" USING btree ("priority","status");--> statement-breakpoint
CREATE INDEX "talep_customer_status_idx" ON "talep" USING btree ("customer_id","status");--> statement-breakpoint
CREATE INDEX "talep_assigned_deadline_idx" ON "talep" USING btree ("assigned_to","deadline");--> statement-breakpoint
CREATE INDEX "talep_customer_type_idx" ON "talep" USING btree ("customer_id","type");--> statement-breakpoint
CREATE INDEX "talep_activities_talep_idx" ON "talep_activities" USING btree ("talep_id");--> statement-breakpoint
CREATE INDEX "talep_activities_type_idx" ON "talep_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "talep_activities_performed_by_idx" ON "talep_activities" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "talep_activities_created_at_idx" ON "talep_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "talep_files_talep_idx" ON "talep_files" USING btree ("talep_id");--> statement-breakpoint
CREATE INDEX "talep_files_category_idx" ON "talep_files" USING btree ("category");--> statement-breakpoint
CREATE INDEX "talep_files_created_at_idx" ON "talep_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "talep_files_visible_customer_idx" ON "talep_files" USING btree ("is_visible_to_customer");--> statement-breakpoint
CREATE INDEX "talep_notes_talep_idx" ON "talep_notes" USING btree ("talep_id");--> statement-breakpoint
CREATE INDEX "talep_notes_type_idx" ON "talep_notes" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "talep_notes_created_by_idx" ON "talep_notes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "talep_notes_created_at_idx" ON "talep_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "talep_notes_internal_idx" ON "talep_notes" USING btree ("is_internal");--> statement-breakpoint
CREATE INDEX "talep_notes_visible_customer_idx" ON "talep_notes" USING btree ("is_visible_to_customer");--> statement-breakpoint
CREATE INDEX "suppliers_workspace_company_idx" ON "suppliers" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "suppliers_name_idx" ON "suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "suppliers_email_idx" ON "suppliers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "suppliers_phone_idx" ON "suppliers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "suppliers_status_idx" ON "suppliers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "suppliers_type_idx" ON "suppliers" USING btree ("supplier_type");--> statement-breakpoint
CREATE INDEX "suppliers_category_idx" ON "suppliers" USING btree ("supplier_category");--> statement-breakpoint
CREATE INDEX "suppliers_priority_idx" ON "suppliers" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "suppliers_parent_idx" ON "suppliers" USING btree ("parent_supplier_id");--> statement-breakpoint
CREATE INDEX "suppliers_industry_idx" ON "suppliers" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "suppliers_city_idx" ON "suppliers" USING btree ("city");--> statement-breakpoint
CREATE INDEX "suppliers_supplier_group_idx" ON "suppliers" USING btree ("supplier_group");--> statement-breakpoint
CREATE INDEX "suppliers_supplier_code_idx" ON "suppliers" USING btree ("supplier_code");--> statement-breakpoint
CREATE INDEX "suppliers_created_by_idx" ON "suppliers" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "suppliers_created_at_idx" ON "suppliers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "suppliers_updated_at_idx" ON "suppliers" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "suppliers_status_created_idx" ON "suppliers" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "suppliers_type_status_idx" ON "suppliers" USING btree ("supplier_type","status");--> statement-breakpoint
CREATE INDEX "suppliers_priority_status_idx" ON "suppliers" USING btree ("priority","status");--> statement-breakpoint
CREATE INDEX "suppliers_industry_status_idx" ON "suppliers" USING btree ("industry","status");--> statement-breakpoint
CREATE INDEX "supplier_addresses_supplier_idx" ON "supplier_addresses" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_addresses_type_idx" ON "supplier_addresses" USING btree ("address_type");--> statement-breakpoint
CREATE INDEX "supplier_addresses_default_idx" ON "supplier_addresses" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "supplier_addresses_active_idx" ON "supplier_addresses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "supplier_contacts_supplier_idx" ON "supplier_contacts" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_contacts_email_idx" ON "supplier_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "supplier_contacts_phone_idx" ON "supplier_contacts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "supplier_contacts_role_idx" ON "supplier_contacts" USING btree ("role");--> statement-breakpoint
CREATE INDEX "supplier_contacts_primary_idx" ON "supplier_contacts" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "supplier_contacts_active_idx" ON "supplier_contacts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "supplier_files_supplier_idx" ON "supplier_files" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_files_category_idx" ON "supplier_files" USING btree ("category");--> statement-breakpoint
CREATE INDEX "supplier_files_created_at_idx" ON "supplier_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "supplier_notes_supplier_idx" ON "supplier_notes" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_notes_type_idx" ON "supplier_notes" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "supplier_notes_created_by_idx" ON "supplier_notes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "supplier_notes_created_at_idx" ON "supplier_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "supplier_performance_supplier_idx" ON "supplier_performance" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_performance_period_idx" ON "supplier_performance" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "supplier_performance_type_idx" ON "supplier_performance" USING btree ("period_type");--> statement-breakpoint
CREATE INDEX "supplier_performance_score_idx" ON "supplier_performance" USING btree ("overall_score");--> statement-breakpoint
CREATE INDEX "supplier_performance_created_at_idx" ON "supplier_performance" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "tessis_no";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "facility_security_level";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "security_clearances";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "project_codes";