/**
 * System Module & Resource Management Schema
 * 
 * This module defines the core system structure for modules, resources, and permissions.
 * It provides a hierarchical organization where modules contain resources, and permissions
 * can be applied at various levels.
 * 
 * Tables:
 * - modules: System modules that group related functionality
 * - moduleResources: Resources within each module (pages, APIs, features)
 * - modulePermissions: Permission definitions for module resources
 * - roleModulePermissions: Actual permissions assigned to roles for module resources
 * 
 * Constants:
 * - MODULE_CATEGORIES: Module categorization for organization
 * - RESOURCE_TYPES: Types of resources (page, api, feature, report)
 * - PERMISSION_ACTIONS: Available permission actions (view, create, edit, delete, execute)
 */

import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, index, unique, check, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspace";
import { companies } from "./company";

// Define constants for type safety
export const MODULE_CATEGORIES = [
  "core",           // Core system modules
  "hr",             // Human Resources
  "finance",        // Financial Management
  "inventory",      // Inventory & Stock
  "crm",           // Customer Relationship
  "project",       // Project Management
  "document",      // Document Management
  "reporting",     // Reports & Analytics
  "integration",   // External Integrations
  "security",      // Security & Access
  "settings"       // Configuration & Settings
] as const;

export const RESOURCE_TYPES = [
  "page",          // UI pages/screens
  "api",           // API endpoints
  "feature",       // Specific features
  "report",        // Reports
  "action",        // Specific actions
  "widget"         // Dashboard widgets
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

// TypeScript types
export type ModuleCategory = typeof MODULE_CATEGORIES[number];
export type ResourceType = typeof RESOURCE_TYPES[number];
export type PermissionAction = typeof SYSTEM_PERMISSION_ACTIONS[number];

// Roles - Define user roles at workspace and company levels
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull(), // e.g., "admin", "manager", "employee"
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
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
  unique("roles_workspace_code_unique").on(table.workspaceId, table.code),
  unique("roles_company_code_unique").on(table.companyId, table.code),
]);

// System Modules - Top-level organization of system functionality
export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(), // e.g., "hr", "finance", "inventory"
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }).notNull(),
  icon: varchar("icon", { length: 50 }), // Icon identifier for UI
  color: varchar("color", { length: 20 }), // Theme color for the module
  isActive: boolean("is_active").default(true).notNull(),
  isCore: boolean("is_core").default(false).notNull(), // Core modules cannot be disabled
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
  check("modules_category_check", sql`category IN ('core', 'hr', 'finance', 'inventory', 'crm', 'project', 'document', 'reporting', 'integration', 'security', 'settings')`),
]);

// Module Resources - Specific resources/features within each module
// @ts-expect-error circular self reference for self FK
export const moduleResources = pgTable("module_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").references(() => modules.id, { onDelete: "cascade" }).notNull(),
  code: varchar("code", { length: 100 }).notNull(), // e.g., "employees.list", "employees.create"
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  resourceType: varchar("resource_type", { length: 20 }).notNull(),
  path: varchar("path", { length: 255 }), // URL path or API endpoint
  // @ts-expect-error – self-referencing relation
  parentResourceId: uuid("parent_resource_id").references(() => moduleResources.id, { onDelete: "cascade" }), // For nested resources
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
  check("module_resources_type_check", sql`resource_type IN ('page', 'api', 'feature', 'report', 'action', 'widget')`),
]);

// Module Permissions - Define what permissions are available for resources
export const modulePermissions = pgTable("module_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  resourceId: uuid("resource_id").references(() => moduleResources.id, { onDelete: "cascade" }).notNull(),
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
  unique("module_permissions_resource_action_unique").on(table.resourceId, table.action),
  check("module_permissions_action_check", sql`action IN ('view', 'create', 'edit', 'delete', 'execute', 'export', 'import', 'approve', 'manage')`),
]);

// Role Module Permissions - Actual permission assignments to roles
export const roleModulePermissions = pgTable("role_module_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: uuid("permission_id").references(() => modulePermissions.id, { onDelete: "cascade" }).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  isGranted: boolean("is_granted").default(true).notNull(), // Can be used to explicitly deny
  grantedBy: uuid("granted_by").notNull(), // User who granted this permission
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Temporary permissions
  conditions: jsonb("conditions").$type<{
    // Override conditions from modulePermissions
    scope?: "own" | "department" | "company" | "workspace";
    departments?: number[]; // Specific department IDs
    companies?: number[]; // Specific company IDs
    customConditions?: Record<string, any>;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("role_module_permissions_role_idx").on(table.roleId),
  index("role_module_permissions_permission_idx").on(table.permissionId),
  index("role_module_permissions_workspace_idx").on(table.workspaceId),
  index("role_module_permissions_expires_idx").on(table.expiresAt),
  unique("role_module_permissions_unique").on(table.roleId, table.permissionId, table.workspaceId),
]);

// Module Access Log - Track access to sensitive resources
export const moduleAccessLog = pgTable("module_access_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  resourceId: uuid("resource_id").references(() => moduleResources.id).notNull(),
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