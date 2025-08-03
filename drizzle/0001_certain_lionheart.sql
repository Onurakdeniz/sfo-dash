CREATE TYPE "public"."company_status" AS ENUM('active', 'inactive', 'onboarding', 'suspended', 'lead');--> statement-breakpoint
CREATE TYPE "public"."workspace_member_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invitation_type" AS ENUM('workspace', 'company');--> statement-breakpoint
ALTER TYPE "public"."gender" ADD VALUE 'other';--> statement-breakpoint
ALTER TYPE "public"."gender" ADD VALUE 'prefer_not_to_say';--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" text,
	"company_logo_url" text,
	"status" "company_status" DEFAULT 'active' NOT NULL,
	"industry" varchar(100),
	"phone" varchar(20),
	"email" varchar(255),
	"website" varchar(255),
	"address" text,
	"district" varchar(100),
	"city" varchar(100),
	"postal_code" varchar(10),
	"tax_office" varchar(100),
	"tax_number" varchar(50),
	"mersis_number" varchar(50),
	"default_currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"parent_company_id" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "companies_tax_number_unique" UNIQUE("tax_number"),
	CONSTRAINT "companies_mersis_number_unique" UNIQUE("mersis_number"),
	CONSTRAINT "companies_email_check" CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	CONSTRAINT "companies_phone_check" CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
	CONSTRAINT "companies_currency_check" CHECK (default_currency ~* '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"parent_department_id" text,
	"code" varchar(20),
	"name" varchar(255) NOT NULL,
	"description" text,
	"responsibility_area" text,
	"goals" jsonb DEFAULT '{"shortTerm":null,"mediumTerm":null,"longTerm":null}'::jsonb NOT NULL,
	"manager_id" text,
	"mail_address" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "departments_company_name_unique" UNIQUE("company_id","name"),
	CONSTRAINT "departments_company_code_unique" UNIQUE("company_id","code")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"department_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"staff_count" integer DEFAULT 0 NOT NULL,
	"lead_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "units_department_name_unique" UNIQUE("department_id","name")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"slug" varchar(256) NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"owner_id" text NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workspace_companies" (
	"workspace_id" text NOT NULL,
	"company_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"added_by" text,
	CONSTRAINT "workspace_companies_workspace_id_company_id_pk" PRIMARY KEY("workspace_id","company_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "workspace_member_role" DEFAULT 'member' NOT NULL,
	"invited_by" text,
	"invite_status" varchar(50) DEFAULT 'accepted',
	"invite_token" text,
	"invite_expires_at" timestamp,
	"permissions" jsonb,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp,
	CONSTRAINT "workspace_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"type" "invitation_type" NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"role" "workspace_member_role",
	"workspace_id" text,
	"company_id" text,
	"team_id" text,
	"invited_by" text NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"responded_at" timestamp,
	"accepted_by" text,
	"message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "invitations_token_unique" UNIQUE("token"),
	CONSTRAINT "invitations_workspace_email_unique" UNIQUE("workspace_id","email","status"),
	CONSTRAINT "invitations_company_email_unique" UNIQUE("company_id","email","status")
);
--> statement-breakpoint
CREATE TABLE "invitation_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "invitation_type" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text NOT NULL,
	"workspace_id" text,
	"company_id" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "invitation_templates_workspace_type_default_unique" UNIQUE("workspace_id","type","is_default"),
	CONSTRAINT "invitation_templates_company_type_default_unique" UNIQUE("company_id","type","is_default")
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"policy_id" text NOT NULL,
	"workspace_id" text,
	"company_id" text,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"fiscal_year_start" varchar(10) DEFAULT '01/01' NOT NULL,
	"tax_rate" varchar(10) DEFAULT '18' NOT NULL,
	"invoice_prefix" varchar(10) DEFAULT 'INV' NOT NULL,
	"invoice_numbering" varchar(20) DEFAULT 'sequential' NOT NULL,
	"working_hours_start" varchar(10),
	"working_hours_end" varchar(10),
	"working_days" jsonb,
	"public_holidays" jsonb,
	"custom_settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "company_settings_company_id_unique" UNIQUE("company_id"),
	CONSTRAINT "company_settings_invoice_numbering_check" CHECK (invoice_numbering IN ('sequential', 'yearly', 'monthly'))
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"workspace_id" text,
	"company_id" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"rollout_percentage" integer DEFAULT 0 NOT NULL,
	"category" varchar(20) DEFAULT 'general' NOT NULL,
	"enabled_at" timestamp,
	"disabled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "feature_flags_workspace_name_unique" UNIQUE("workspace_id","name"),
	CONSTRAINT "feature_flags_company_name_unique" UNIQUE("company_id","name"),
	CONSTRAINT "feature_flags_category_check" CHECK (category IN ('hr', 'finance', 'inventory', 'crm', 'project', 'document', 'reporting', 'integration', 'security', 'general'))
);
--> statement-breakpoint
CREATE TABLE "workspace_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"timezone" varchar(100) DEFAULT 'Europe/Istanbul',
	"currency" varchar(10) DEFAULT 'TRY',
	"language" varchar(10) DEFAULT 'tr',
	"date_format" varchar(20) DEFAULT 'DD/MM/YYYY',
	"working_hours_start" varchar(10) DEFAULT '09:00',
	"working_hours_end" varchar(10) DEFAULT '18:00',
	"working_days" jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
	"public_holidays" jsonb DEFAULT '[]'::jsonb,
	"custom_settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "workspace_settings_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "module_access_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"action" varchar(20) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"success" boolean NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"accessed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"action" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"conditions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "module_permissions_resource_action_unique" UNIQUE("resource_id","action"),
	CONSTRAINT "module_permissions_action_check" CHECK (action IN ('view', 'create', 'edit', 'delete', 'execute', 'export', 'import', 'approve', 'manage'))
);
--> statement-breakpoint
CREATE TABLE "module_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"resource_type" varchar(20) NOT NULL,
	"path" varchar(255),
	"parent_resource_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "module_resources_module_code_unique" UNIQUE("module_id","code"),
	CONSTRAINT "module_resources_type_check" CHECK (resource_type IN ('page', 'api', 'feature', 'report', 'action', 'widget'))
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(20) NOT NULL,
	"icon" varchar(50),
	"color" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_core" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"settings" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "modules_code_unique" UNIQUE("code"),
	CONSTRAINT "modules_category_check" CHECK (category IN ('core', 'hr', 'finance', 'inventory', 'crm', 'project', 'document', 'reporting', 'integration', 'security', 'settings'))
);
--> statement-breakpoint
CREATE TABLE "role_module_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"is_granted" boolean DEFAULT true NOT NULL,
	"granted_by" text NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"conditions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_module_permissions_unique" UNIQUE("role_id","permission_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"workspace_id" text,
	"company_id" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "roles_workspace_code_unique" UNIQUE("workspace_id","code"),
	CONSTRAINT "roles_company_code_unique" UNIQUE("company_id","code")
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_department_id_departments_id_fk" FOREIGN KEY ("parent_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_lead_id_user_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_companies" ADD CONSTRAINT "workspace_companies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_companies" ADD CONSTRAINT "workspace_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_companies" ADD CONSTRAINT "workspace_companies_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_templates" ADD CONSTRAINT "invitation_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_templates" ADD CONSTRAINT "invitation_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_assignments" ADD CONSTRAINT "policy_assignments_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_assignments" ADD CONSTRAINT "policy_assignments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_assignments" ADD CONSTRAINT "policy_assignments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_assignments" ADD CONSTRAINT "policy_assignments_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_access_log" ADD CONSTRAINT "module_access_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_access_log" ADD CONSTRAINT "module_access_log_resource_id_module_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."module_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_permissions" ADD CONSTRAINT "module_permissions_resource_id_module_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."module_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_resources" ADD CONSTRAINT "module_resources_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_resources" ADD CONSTRAINT "module_resources_parent_resource_id_module_resources_id_fk" FOREIGN KEY ("parent_resource_id") REFERENCES "public"."module_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_permission_id_module_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."module_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companies_name_idx" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "companies_email_idx" ON "companies" USING btree ("email");--> statement-breakpoint
CREATE INDEX "companies_status_idx" ON "companies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "companies_parent_idx" ON "companies" USING btree ("parent_company_id");--> statement-breakpoint
CREATE INDEX "departments_company_idx" ON "departments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "departments_parent_idx" ON "departments" USING btree ("parent_department_id");--> statement-breakpoint
CREATE INDEX "departments_code_idx" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE INDEX "departments_name_idx" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "departments_manager_idx" ON "departments" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "units_department_idx" ON "units" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "units_name_idx" ON "units" USING btree ("name");--> statement-breakpoint
CREATE INDEX "units_lead_idx" ON "units" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "workspace_member_user_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_member_invite_token_idx" ON "workspace_members" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitations_status_idx" ON "invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invitations_type_idx" ON "invitations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "invitations_workspace_idx" ON "invitations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "invitations_company_idx" ON "invitations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "invitations_invited_by_idx" ON "invitations" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "invitations_expires_idx" ON "invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "invitations_email_status_idx" ON "invitations" USING btree ("email","status");--> statement-breakpoint
CREATE INDEX "invitations_workspace_status_idx" ON "invitations" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "invitations_company_status_idx" ON "invitations" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "invitation_templates_name_idx" ON "invitation_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "invitation_templates_type_idx" ON "invitation_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "invitation_templates_workspace_idx" ON "invitation_templates" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "invitation_templates_company_idx" ON "invitation_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "invitation_templates_default_idx" ON "invitation_templates" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "invitation_templates_active_idx" ON "invitation_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "policies_type_idx" ON "policies" USING btree ("type");--> statement-breakpoint
CREATE INDEX "policies_status_idx" ON "policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "policy_assignments_policy_idx" ON "policy_assignments" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "policy_assignments_workspace_idx" ON "policy_assignments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "policy_assignments_company_idx" ON "policy_assignments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_settings_company_idx" ON "company_settings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "feature_flags_name_idx" ON "feature_flags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "feature_flags_workspace_idx" ON "feature_flags" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "feature_flags_company_idx" ON "feature_flags" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "feature_flags_category_idx" ON "feature_flags" USING btree ("category");--> statement-breakpoint
CREATE INDEX "module_access_log_user_idx" ON "module_access_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "module_access_log_resource_idx" ON "module_access_log" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "module_access_log_accessed_at_idx" ON "module_access_log" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX "module_access_log_action_idx" ON "module_access_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "module_permissions_resource_idx" ON "module_permissions" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "module_permissions_action_idx" ON "module_permissions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "module_permissions_active_idx" ON "module_permissions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "module_resources_module_idx" ON "module_resources" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "module_resources_code_idx" ON "module_resources" USING btree ("code");--> statement-breakpoint
CREATE INDEX "module_resources_type_idx" ON "module_resources" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "module_resources_parent_idx" ON "module_resources" USING btree ("parent_resource_id");--> statement-breakpoint
CREATE INDEX "module_resources_active_idx" ON "module_resources" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "modules_code_idx" ON "modules" USING btree ("code");--> statement-breakpoint
CREATE INDEX "modules_category_idx" ON "modules" USING btree ("category");--> statement-breakpoint
CREATE INDEX "modules_active_idx" ON "modules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "modules_sort_order_idx" ON "modules" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "role_module_permissions_role_idx" ON "role_module_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_module_permissions_permission_idx" ON "role_module_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "role_module_permissions_workspace_idx" ON "role_module_permissions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "role_module_permissions_expires_idx" ON "role_module_permissions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "roles_code_idx" ON "roles" USING btree ("code");--> statement-breakpoint
CREATE INDEX "roles_workspace_idx" ON "roles" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "roles_company_idx" ON "roles" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "roles_system_idx" ON "roles" USING btree ("is_system");--> statement-breakpoint
CREATE INDEX "roles_active_idx" ON "roles" USING btree ("is_active");