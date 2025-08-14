import { pgTable, foreignKey, unique, text, timestamp, index, varchar, jsonb, integer, check, boolean, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const companyStatus = pgEnum("company_status", ['active', 'inactive', 'onboarding', 'suspended', 'lead'])
export const companyType = pgEnum("company_type", ['anonim_sirket', 'limited_sirket', 'kolektif_sirket', 'komandit_sirket', 'sermayesi_paylara_bolunmus_komandit_sirket', 'kooperatif', 'dernek', 'vakif', 'sahis_isletmesi', 'diger'])
export const invitationStatus = pgEnum("invitation_status", ['pending', 'accepted', 'declined', 'expired', 'cancelled'])
export const invitationType = pgEnum("invitation_type", ['workspace', 'company'])
export const role = pgEnum("role", ['admin', 'member'])
export const workspaceMemberRole = pgEnum("workspace_member_role", ['owner', 'admin', 'member', 'viewer'])


export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const departments = pgTable("departments", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	parentDepartmentId: text("parent_department_id"),
	code: varchar({ length: 20 }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	responsibilityArea: text("responsibility_area"),
	goals: jsonb().default({"longTerm":null,"shortTerm":null,"mediumTerm":null}).notNull(),
	managerId: text("manager_id"),
	mailAddress: varchar("mail_address", { length: 255 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("departments_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("departments_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("departments_manager_idx").using("btree", table.managerId.asc().nullsLast().op("text_ops")),
	index("departments_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("departments_parent_idx").using("btree", table.parentDepartmentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "departments_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.managerId],
			foreignColumns: [user.id],
			name: "departments_manager_id_user_id_fk"
		}),
	unique("departments_company_name_unique").on(table.companyId, table.name),
	unique("departments_company_code_unique").on(table.companyId, table.code),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const units = pgTable("units", {
	id: text().primaryKey().notNull(),
	departmentId: text("department_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	staffCount: integer("staff_count").default(0).notNull(),
	leadId: text("lead_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("units_department_idx").using("btree", table.departmentId.asc().nullsLast().op("text_ops")),
	index("units_lead_idx").using("btree", table.leadId.asc().nullsLast().op("text_ops")),
	index("units_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "units_department_id_departments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [user.id],
			name: "units_lead_id_user_id_fk"
		}),
	unique("units_department_name_unique").on(table.departmentId, table.name),
]);

export const workspaces = pgTable("workspaces", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 256 }).notNull(),
	slug: varchar({ length: 256 }).notNull(),
	settings: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ownerId: text("owner_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "workspaces_owner_id_user_id_fk"
		}),
	unique("workspaces_slug_unique").on(table.slug),
]);

export const companies = pgTable("companies", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	fullName: text("full_name"),
	companyLogoUrl: text("company_logo_url"),
	status: companyStatus().default('active').notNull(),
	industry: varchar({ length: 100 }),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	website: varchar({ length: 255 }),
	address: text(),
	district: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	postalCode: varchar("postal_code", { length: 10 }),
	taxOffice: varchar("tax_office", { length: 100 }),
	taxNumber: varchar("tax_number", { length: 50 }),
	mersisNumber: varchar("mersis_number", { length: 50 }),
	defaultCurrency: varchar("default_currency", { length: 3 }).default('TRY').notNull(),
	parentCompanyId: text("parent_company_id"),
	notes: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	companyType: companyType("company_type"),
}, (table) => [
	index("companies_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("companies_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("companies_parent_idx").using("btree", table.parentCompanyId.asc().nullsLast().op("text_ops")),
	index("companies_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	unique("companies_tax_number_unique").on(table.taxNumber),
	unique("companies_mersis_number_unique").on(table.mersisNumber),
	check("companies_email_check", sql`(email IS NULL) OR ((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)`),
	check("companies_phone_check", sql`(phone IS NULL) OR ((phone)::text ~* '^\+?[1-9]\d{1,14}$'::text)`),
	check("companies_currency_check", sql`(default_currency)::text ~* '^[A-Z]{3}$'::text`),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	username: text(),
	displayUsername: text("display_username"),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	role: role().default('member').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	unique("user_username_unique").on(table.username),
	unique("user_email_unique").on(table.email),
]);

export const invitations = pgTable("invitations", {
	id: text().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	type: invitationType().notNull(),
	status: invitationStatus().default('pending').notNull(),
	role: workspaceMemberRole(),
	workspaceId: text("workspace_id"),
	companyId: text("company_id"),
	teamId: text("team_id"),
	invitedBy: text("invited_by").notNull(),
	invitedAt: timestamp("invited_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	acceptedBy: text("accepted_by"),
	message: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("invitations_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("invitations_company_status_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("invitations_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("invitations_email_status_idx").using("btree", table.email.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("invitations_expires_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("invitations_invited_by_idx").using("btree", table.invitedBy.asc().nullsLast().op("text_ops")),
	index("invitations_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("invitations_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("invitations_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("invitations_workspace_idx").using("btree", table.workspaceId.asc().nullsLast().op("text_ops")),
	index("invitations_workspace_status_idx").using("btree", table.workspaceId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "invitations_workspace_id_workspaces_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "invitations_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [user.id],
			name: "invitations_invited_by_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.acceptedBy],
			foreignColumns: [user.id],
			name: "invitations_accepted_by_user_id_fk"
		}).onDelete("set null"),
	unique("invitations_workspace_email_unique").on(table.email, table.status, table.workspaceId),
	unique("invitations_company_email_unique").on(table.email, table.status, table.companyId),
	unique("invitations_token_unique").on(table.token),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}),
]);

export const invitationTemplates = pgTable("invitation_templates", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: invitationType().notNull(),
	subject: varchar({ length: 255 }).notNull(),
	htmlContent: text("html_content").notNull(),
	textContent: text("text_content").notNull(),
	workspaceId: text("workspace_id"),
	companyId: text("company_id"),
	isDefault: boolean("is_default").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("invitation_templates_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("invitation_templates_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("invitation_templates_default_idx").using("btree", table.isDefault.asc().nullsLast().op("bool_ops")),
	index("invitation_templates_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("invitation_templates_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("invitation_templates_workspace_idx").using("btree", table.workspaceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "invitation_templates_workspace_id_workspaces_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "invitation_templates_company_id_companies_id_fk"
		}).onDelete("cascade"),
	unique("invitation_templates_workspace_type_default_unique").on(table.type, table.workspaceId, table.isDefault),
	unique("invitation_templates_company_type_default_unique").on(table.type, table.companyId, table.isDefault),
]);

export const companySettings = pgTable("company_settings", {
	id: text().primaryKey().notNull(),
	companyId: text("company_id").notNull(),
	fiscalYearStart: varchar("fiscal_year_start", { length: 10 }).default('01/01').notNull(),
	taxRate: varchar("tax_rate", { length: 10 }).default('18').notNull(),
	invoicePrefix: varchar("invoice_prefix", { length: 10 }).default('INV').notNull(),
	invoiceNumbering: varchar("invoice_numbering", { length: 20 }).default('sequential').notNull(),
	workingHoursStart: varchar("working_hours_start", { length: 10 }),
	workingHoursEnd: varchar("working_hours_end", { length: 10 }),
	workingDays: jsonb("working_days"),
	publicHolidays: jsonb("public_holidays"),
	customSettings: jsonb("custom_settings"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("company_settings_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "company_settings_company_id_companies_id_fk"
		}).onDelete("cascade"),
	unique("company_settings_company_id_unique").on(table.companyId),
	check("company_settings_invoice_numbering_check", sql`(invoice_numbering)::text = ANY ((ARRAY['sequential'::character varying, 'yearly'::character varying, 'monthly'::character varying])::text[])`),
]);

export const featureFlags = pgTable("feature_flags", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	workspaceId: text("workspace_id"),
	companyId: text("company_id"),
	isEnabled: boolean("is_enabled").default(false).notNull(),
	rolloutPercentage: integer("rollout_percentage").default(0).notNull(),
	category: varchar({ length: 20 }).default('general').notNull(),
	enabledAt: timestamp("enabled_at", { mode: 'string' }),
	disabledAt: timestamp("disabled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("feature_flags_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("feature_flags_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("feature_flags_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("feature_flags_workspace_idx").using("btree", table.workspaceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "feature_flags_workspace_id_workspaces_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "feature_flags_company_id_companies_id_fk"
		}).onDelete("cascade"),
	unique("feature_flags_workspace_name_unique").on(table.name, table.workspaceId),
	unique("feature_flags_company_name_unique").on(table.name, table.companyId),
	check("feature_flags_category_check", sql`(category)::text = ANY ((ARRAY['hr'::character varying, 'finance'::character varying, 'inventory'::character varying, 'crm'::character varying, 'project'::character varying, 'document'::character varying, 'reporting'::character varying, 'integration'::character varying, 'security'::character varying, 'general'::character varying])::text[])`),
]);

export const workspaceSettings = pgTable("workspace_settings", {
	id: text().primaryKey().notNull(),
	workspaceId: text("workspace_id").notNull(),
	timezone: varchar({ length: 100 }).default('Europe/Istanbul'),
	currency: varchar({ length: 10 }).default('TRY'),
	language: varchar({ length: 10 }).default('tr'),
	dateFormat: varchar("date_format", { length: 20 }).default('DD/MM/YYYY'),
	workingHoursStart: varchar("working_hours_start", { length: 10 }).default('09:00'),
	workingHoursEnd: varchar("working_hours_end", { length: 10 }).default('18:00'),
	workingDays: jsonb("working_days").default(["monday","tuesday","wednesday","thursday","friday"]),
	publicHolidays: jsonb("public_holidays").default([]),
	customSettings: jsonb("custom_settings"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "workspace_settings_workspace_id_workspaces_id_fk"
		}).onDelete("cascade"),
	unique("workspace_settings_workspace_id_unique").on(table.workspaceId),
]);

export const policies = pgTable("policies", {
	id: text().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	content: text().notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("policies_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("policies_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "policies_created_by_user_id_fk"
		}),
]);

export const policyAssignments = pgTable("policy_assignments", {
	id: text().primaryKey().notNull(),
	policyId: text("policy_id").notNull(),
	workspaceId: text("workspace_id"),
	companyId: text("company_id"),
	assignedBy: text("assigned_by").notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("policy_assignments_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("policy_assignments_policy_idx").using("btree", table.policyId.asc().nullsLast().op("text_ops")),
	index("policy_assignments_workspace_idx").using("btree", table.workspaceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.policyId],
			foreignColumns: [policies.id],
			name: "policy_assignments_policy_id_policies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "policy_assignments_workspace_id_workspaces_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "policy_assignments_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [user.id],
			name: "policy_assignments_assigned_by_user_id_fk"
		}),
]);

export const moduleResources = pgTable("module_resources", {
	id: text().primaryKey().notNull(),
	moduleId: text("module_id").notNull(),
	code: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	description: text(),
	resourceType: varchar("resource_type", { length: 20 }).notNull(),
	path: varchar({ length: 255 }),
	parentResourceId: text("parent_resource_id"),
	isActive: boolean("is_active").default(true).notNull(),
	isPublic: boolean("is_public").default(false).notNull(),
	requiresApproval: boolean("requires_approval").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("module_resources_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("module_resources_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("module_resources_module_idx").using("btree", table.moduleId.asc().nullsLast().op("text_ops")),
	index("module_resources_parent_idx").using("btree", table.parentResourceId.asc().nullsLast().op("text_ops")),
	index("module_resources_type_idx").using("btree", table.resourceType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: "module_resources_module_id_modules_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentResourceId],
			foreignColumns: [table.id],
			name: "module_resources_parent_resource_id_module_resources_id_fk"
		}).onDelete("cascade"),
	unique("module_resources_module_code_unique").on(table.moduleId, table.code),
	check("module_resources_type_check", sql`(resource_type)::text = ANY ((ARRAY['page'::character varying, 'api'::character varying, 'feature'::character varying, 'report'::character varying, 'action'::character varying, 'widget'::character varying])::text[])`),
]);

export const modulePermissions = pgTable("module_permissions", {
	id: text().primaryKey().notNull(),
	resourceId: text("resource_id").notNull(),
	action: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	conditions: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("module_permissions_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("module_permissions_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("module_permissions_resource_idx").using("btree", table.resourceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [moduleResources.id],
			name: "module_permissions_resource_id_module_resources_id_fk"
		}).onDelete("cascade"),
	unique("module_permissions_resource_action_unique").on(table.resourceId, table.action),
	check("module_permissions_action_check", sql`(action)::text = ANY ((ARRAY['view'::character varying, 'create'::character varying, 'edit'::character varying, 'delete'::character varying, 'execute'::character varying, 'export'::character varying, 'import'::character varying, 'approve'::character varying, 'manage'::character varying])::text[])`),
]);

export const moduleAccessLog = pgTable("module_access_log", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	resourceId: text("resource_id").notNull(),
	action: varchar({ length: 20 }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	success: boolean().notNull(),
	errorMessage: text("error_message"),
	metadata: jsonb(),
	accessedAt: timestamp("accessed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("module_access_log_accessed_at_idx").using("btree", table.accessedAt.asc().nullsLast().op("timestamp_ops")),
	index("module_access_log_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("module_access_log_resource_idx").using("btree", table.resourceId.asc().nullsLast().op("text_ops")),
	index("module_access_log_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "module_access_log_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [moduleResources.id],
			name: "module_access_log_resource_id_module_resources_id_fk"
		}),
]);

export const modules = pgTable("modules", {
	id: text().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	description: text(),
	icon: varchar({ length: 50 }),
	color: varchar({ length: 20 }),
	isActive: boolean("is_active").default(true).notNull(),
	isCore: boolean("is_core").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	settings: jsonb(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("modules_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("modules_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("modules_sort_order_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	unique("modules_code_unique").on(table.code),
]);

export const roles = pgTable("roles", {
	id: text().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	description: text(),
	workspaceId: text("workspace_id"),
	companyId: text("company_id"),
	isSystem: boolean("is_system").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("roles_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("roles_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("roles_company_idx").using("btree", table.companyId.asc().nullsLast().op("text_ops")),
	index("roles_system_idx").using("btree", table.isSystem.asc().nullsLast().op("bool_ops")),
	index("roles_workspace_idx").using("btree", table.workspaceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "roles_workspace_id_workspaces_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "roles_company_id_companies_id_fk"
		}).onDelete("cascade"),
	unique("roles_workspace_code_unique").on(table.code, table.workspaceId),
	unique("roles_company_code_unique").on(table.code, table.companyId),
]);

export const roleModulePermissions = pgTable("role_module_permissions", {
	id: text().primaryKey().notNull(),
	roleId: text("role_id").notNull(),
	permissionId: text("permission_id").notNull(),
	workspaceId: text("workspace_id").notNull(),
	isGranted: boolean("is_granted").default(true).notNull(),
	grantedBy: text("granted_by").notNull(),
	grantedAt: timestamp("granted_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	conditions: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("role_module_permissions_expires_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("role_module_permissions_permission_idx").using("btree", table.permissionId.asc().nullsLast().op("text_ops")),
	index("role_module_permissions_role_idx").using("btree", table.roleId.asc().nullsLast().op("text_ops")),
	index("role_module_permissions_workspace_idx").using("btree", table.workspaceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_module_permissions_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [modulePermissions.id],
			name: "role_module_permissions_permission_id_module_permissions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "role_module_permissions_workspace_id_workspaces_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.grantedBy],
			foreignColumns: [user.id],
			name: "role_module_permissions_granted_by_user_id_fk"
		}),
	unique("role_module_permissions_unique").on(table.roleId, table.permissionId, table.workspaceId),
]);

export const workspaceCompanies = pgTable("workspace_companies", {
	workspaceId: text("workspace_id").notNull(),
	companyId: text("company_id").notNull(),
	addedAt: timestamp("added_at", { mode: 'string' }).defaultNow().notNull(),
	addedBy: text("added_by"),
}, (table) => [
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "workspace_companies_workspace_id_workspaces_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "workspace_companies_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.addedBy],
			foreignColumns: [user.id],
			name: "workspace_companies_added_by_user_id_fk"
		}),
	primaryKey({ columns: [table.workspaceId, table.companyId], name: "workspace_companies_workspace_id_company_id_pk"}),
]);

export const workspaceMembers = pgTable("workspace_members", {
	workspaceId: text("workspace_id").notNull(),
	userId: text("user_id").notNull(),
	role: workspaceMemberRole().default('member').notNull(),
	invitedBy: text("invited_by"),
	inviteStatus: varchar("invite_status", { length: 50 }).default('accepted'),
	inviteToken: text("invite_token"),
	inviteExpiresAt: timestamp("invite_expires_at", { mode: 'string' }),
	permissions: jsonb(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }),
}, (table) => [
	index("workspace_member_invite_token_idx").using("btree", table.inviteToken.asc().nullsLast().op("text_ops")),
	index("workspace_member_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "workspace_members_workspace_id_workspaces_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "workspace_members_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [user.id],
			name: "workspace_members_invited_by_user_id_fk"
		}),
	primaryKey({ columns: [table.workspaceId, table.userId], name: "workspace_members_workspace_id_user_id_pk"}),
]);
