/**
 * System Module & Resource Management Schema
 * 
 * This module defines the core system structure for modules, resources, and permissions.
 * It provides a hierarchical organization where modules contain resources, and permissions
 * can be applied at various levels.
 * 
 * Tables:
 * - roles: User roles at workspace and company levels
 * - modules: System modules that group related functionality
 * - moduleResources: Resources within each module (pages, APIs, features)
 * - modulePermissions: Permission definitions for module resources
 * - roleModulePermissions: Actual permissions assigned to roles for module resources
 * - moduleAccessLog: Track access to sensitive resources
 * 
 * Constants:
 * - RESOURCE_TYPES: Types of resources (page, api, feature, report)
 * - PERMISSION_ACTIONS: Available permission actions (view, create, edit, delete, execute)
 */

import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, index, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspace } from "./workspace";
import { company } from "./company";
import { user } from "./user";

export const RESOURCE_TYPES = [
  "page",          // UI pages/screens
  "api",           // API endpoints
  "feature",       // Specific features
  "report",        // Reports
  "action",        // Specific actions
  "widget",        // Dashboard widgets
  "submodule"      // Logical submodule grouping under a module
] as const;

const SYSTEM_PERMISSION_ACTIONS = [
  "view",          // Read access
  "create",        // Create new items
  "edit",          // Update existing items
  "delete",        // Delete items
  "execute",       // Execute actions
  "export",        // Export data
  "import",        // Import data
  "approve",       // Approval rights
  "manage"         // Full management rights
] as const;

export type ResourceType = typeof RESOURCE_TYPES[number];
export type PermissionAction = typeof SYSTEM_PERMISSION_ACTIONS[number];

// Roles - Define user roles at workspace and company levels
export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull(), // e.g., "admin", "manager", "employee"
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }),
  isSystem: boolean("is_system").default(false).notNull(), // System roles cannot be deleted
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  metadata: jsonb("metadata").$type<{
    color?: string;
    icon?: string;
    defaultPermissions?: string[];
    [key: string]: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete
}, (table) => [
  index("roles_code_idx").on(table.code),
  index("roles_workspace_idx").on(table.workspaceId),
  index("roles_company_idx").on(table.companyId),
  index("roles_system_idx").on(table.isSystem),
  index("roles_active_idx").on(table.isActive),
  index("roles_sort_order_idx").on(table.sortOrder),
  index("roles_created_at_idx").on(table.createdAt),
  // Composite indexes for common query patterns
  index("roles_workspace_active_idx").on(table.workspaceId, table.isActive),
  index("roles_company_active_idx").on(table.companyId, table.isActive),
  unique("roles_workspace_code_unique").on(table.workspaceId, table.code),
  unique("roles_company_code_unique").on(table.companyId, table.code),
]);

// System Modules - Top-level organization of system functionality
export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // e.g., "hr", "finance", "inventory"
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  // Category kept to align with existing database and API validations
  category: varchar("category", { length: 20 }).notNull(),
  icon: varchar("icon", { length: 50 }), // Icon identifier for UI
  color: varchar("color", { length: 20 }), // Theme color for the module
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  settings: jsonb("settings").$type<Record<string, any>>(), // Module-specific settings
  metadata: jsonb("metadata").$type<{
    version?: string;
    author?: string;
    dependencies?: string[];
    [key: string]: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete
}, (table) => [
  index("modules_code_idx").on(table.code),
  index("modules_category_idx").on(table.category),
  index("modules_active_idx").on(table.isActive),
  index("modules_sort_order_idx").on(table.sortOrder),
]);

// Company Modules - per-company enable/disable and settings for modules
export const companyModules = pgTable("company_modules", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }).notNull(),
  moduleId: text("module_id").references(() => modules.id, { onDelete: "cascade" }).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  settings: jsonb("settings").$type<Record<string, any>>(),
  toggledBy: text("toggled_by").references(() => user.id),
  toggledAt: timestamp("toggled_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("company_modules_company_idx").on(table.companyId),
  index("company_modules_module_idx").on(table.moduleId),
  index("company_modules_enabled_idx").on(table.isEnabled),
  unique("company_modules_unique").on(table.companyId, table.moduleId),
]);

// Module Resources - Specific resources/features within each module
export const moduleResources: any = pgTable("module_resources", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").references(() => modules.id, { onDelete: "cascade" }).notNull(),
  code: varchar("code", { length: 100 }).notNull(), // e.g., "employees.list", "employees.create"
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  resourceType: varchar("resource_type", { length: 20 }).notNull(),
  path: varchar("path", { length: 255 }), // URL path or API endpoint
  parentResourceId: text("parent_resource_id"), // For nested resources - will be self-referenced in relations
  isActive: boolean("is_active").default(true).notNull(),
  isPublic: boolean("is_public").default(false).notNull(), // Publicly accessible without auth
  requiresApproval: boolean("requires_approval").default(false).notNull(), // Actions require approval
  sortOrder: integer("sort_order").default(0).notNull(),
  metadata: jsonb("metadata").$type<{
    method?: string; // For API resources: GET, POST, PUT, DELETE
    component?: string; // For page resources: component name
    allowedActions?: PermissionAction[];
    customFields?: Record<string, any>;
    [key: string]: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete
}, (table) => [
  index("module_resources_module_idx").on(table.moduleId),
  index("module_resources_code_idx").on(table.code),
  index("module_resources_type_idx").on(table.resourceType),
  index("module_resources_parent_idx").on(table.parentResourceId),
  index("module_resources_active_idx").on(table.isActive),
  unique("module_resources_module_code_unique").on(table.moduleId, table.code),
  check("module_resources_type_check", sql`resource_type IN ('page', 'api', 'feature', 'report', 'action', 'widget', 'submodule')`),
]);

// Company Module Resources - per-company enable/disable state for resources
export const companyModuleResources = pgTable("company_module_resources", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }).notNull(),
  resourceId: text("resource_id").references(() => moduleResources.id, { onDelete: "cascade" }).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  toggledBy: text("toggled_by").references(() => user.id),
  toggledAt: timestamp("toggled_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("company_module_resources_company_idx").on(table.companyId),
  index("company_module_resources_resource_idx").on(table.resourceId),
  index("company_module_resources_enabled_idx").on(table.isEnabled),
  unique("company_module_resources_unique").on(table.companyId, table.resourceId),
]);

// Module Permissions - Define what permissions are available for resources
export const modulePermissions = pgTable("module_permissions", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id").references(() => moduleResources.id, { onDelete: "cascade" }).notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  conditions: jsonb("conditions").$type<{
    // Define conditions for permission (e.g., own data only, department scope)
    scope?: "own" | "department" | "company" | "workspace";
    fields?: string[]; // Specific fields this permission applies to
    customConditions?: Record<string, any>;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("module_permissions_resource_idx").on(table.resourceId),
  index("module_permissions_action_idx").on(table.action),
  index("module_permissions_active_idx").on(table.isActive),
  index("module_permissions_created_at_idx").on(table.createdAt),
  // Composite indexes for common permission lookup patterns
  index("module_permissions_resource_active_idx").on(table.resourceId, table.isActive),
  index("module_permissions_action_active_idx").on(table.action, table.isActive),
  unique("module_permissions_resource_action_unique").on(table.resourceId, table.action),
  check("module_permissions_action_check", sql`action IN ('view', 'edit', 'approve', 'manage')`),
]);

// Role Module Permissions - Actual permission assignments to roles
export const roleModulePermissions = pgTable("role_module_permissions", {
  id: text("id").primaryKey(),
  roleId: text("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: text("permission_id").references(() => modulePermissions.id, { onDelete: "cascade" }).notNull(),
  // Scope fields - mutually exclusive (one must be null, one must be set)
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }),
  isGranted: boolean("is_granted").default(true).notNull(), // Can be used to explicitly deny
  grantedBy: text("granted_by").references(() => user.id, { onDelete: "set null" }), // User who granted this permission
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Temporary permissions
  conditions: jsonb("conditions").$type<{
    // Override conditions from modulePermissions
    scope?: "own" | "department" | "company" | "workspace";
    departments?: number[]; // Specific department IDs
    companies?: string[]; // Specific company IDs - adapted to text type
    customConditions?: Record<string, any>;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("role_module_permissions_role_idx").on(table.roleId),
  index("role_module_permissions_permission_idx").on(table.permissionId),
  index("role_module_permissions_workspace_idx").on(table.workspaceId),
  index("role_module_permissions_company_idx").on(table.companyId),
  index("role_module_permissions_expires_idx").on(table.expiresAt),
  // Ensure mutual exclusivity between workspace and company scope
  check("role_module_permissions_scope_exclusive_check", sql`(workspace_id IS NULL) != (company_id IS NULL)`),
  // Ensure at least one scope is defined
  check("role_module_permissions_scope_required_check", sql`workspace_id IS NOT NULL OR company_id IS NOT NULL`),
  // Updated unique constraint for the refined structure
  unique("role_module_permissions_scope_unique").on(table.roleId, table.permissionId, table.workspaceId, table.companyId),
]);

// Module Access Log - Track access to sensitive resources
export const moduleAccessLog = pgTable("module_access_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }).notNull(),
  resourceId: text("resource_id").references(() => moduleResources.id, { onDelete: "set null" }).notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
}, (table) => [
  index("module_access_log_user_idx").on(table.userId),
  index("module_access_log_resource_idx").on(table.resourceId),
  index("module_access_log_accessed_at_idx").on(table.accessedAt),
  index("module_access_log_action_idx").on(table.action),
]);

// User Roles - Assign system roles to specific users in a given scope
export const userRoles = pgTable("user_roles", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  roleId: text("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }).notNull(),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  assignedBy: text("assigned_by").references(() => user.id, { onDelete: "set null" }),
  assignedAt: timestamp("assigned_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_roles_user_idx").on(table.userId),
  index("user_roles_role_idx").on(table.roleId),
  index("user_roles_workspace_idx").on(table.workspaceId),
  index("user_roles_company_idx").on(table.companyId),
  unique("user_roles_unique").on(table.userId, table.roleId, table.workspaceId, table.companyId),
]);

// User Module Permissions - Direct permission grants to users
export const userModulePermissions = pgTable("user_module_permissions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  permissionId: text("permission_id").references(() => modulePermissions.id, { onDelete: "cascade" }).notNull(),
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }).notNull(),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }),
  isGranted: boolean("is_granted").default(true).notNull(),
  grantedBy: text("granted_by").references(() => user.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  conditions: jsonb("conditions").$type<{
    scope?: "own" | "department" | "company" | "workspace";
    fields?: string[];
    customConditions?: Record<string, any>;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_module_permissions_user_idx").on(table.userId),
  index("user_module_permissions_perm_idx").on(table.permissionId),
  index("user_module_permissions_workspace_idx").on(table.workspaceId),
  index("user_module_permissions_company_idx").on(table.companyId),
  unique("user_module_permissions_unique").on(table.userId, table.permissionId, table.workspaceId, table.companyId),
]);

