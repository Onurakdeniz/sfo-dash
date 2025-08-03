/**
 * User Activity Log Schema
 * 
 * This module defines the user activity tracking system for audit logging,
 * security monitoring, and usage analytics. It captures all significant
 * user actions across the system with detailed context and metadata.
 * 
 * Tables:
 * - userActivities: Main activity log with action details and context
 * - activityTypes: Predefined activity types for categorization
 */

import { pgTable, uuid, varchar, text, timestamp, jsonb, inet, integer, boolean, index, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";
import { workspaces } from "./workspace";
import { companies } from "./company";

// Activity categories for better organization
export const ACTIVITY_CATEGORIES = [
  "auth",        // Login, logout, password changes
  "user",        // Profile updates, settings changes
  "workspace",   // Workspace creation, member management
  "company",     // Company CRUD operations
  "permission",  // Permission grants/revokes
  "data",        // General data operations
  "system",      // System-level activities
  "security"     // Security-related events
] as const;

export type ActivityCategory = typeof ACTIVITY_CATEGORIES[number];

// Activity types table - predefined activity types for consistency
export const activityTypes = pgTable("activity_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(), // e.g., "user.login", "company.create"
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }).notNull(),
  severity: varchar("severity", { length: 20 }).default("info").notNull(), // info, warning, error, critical
  isActive: boolean("is_active").default(true).notNull(),
  
  // Retention policy
  retentionDays: integer("retention_days").default(90).notNull(), // How long to keep these activities
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("activity_types_name_idx").on(table.name),
  index("activity_types_category_idx").on(table.category),
  index("activity_types_severity_idx").on(table.severity),
 
]);

// Main user activities table - comprehensive activity logging
export const userActivities = pgTable("user_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Actor information
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // Can be null for system activities
  userEmail: varchar("user_email", { length: 255 }), // Denormalized for historical accuracy
  userName: varchar("user_name", { length: 255 }), // Denormalized for historical accuracy
  
  // Activity details
  activityTypeId: uuid("activity_type_id").references(() => activityTypes.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "create", "update", "delete", "login"
  
  // Context
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
  
  // Target resource
  resourceType: varchar("resource_type", { length: 50 }), // e.g., "user", "company", "invoice"
  resourceId: varchar("resource_id", { length: 255 }), // ID of the affected resource
  resourceName: varchar("resource_name", { length: 255 }), // Denormalized resource name
  
  
  // Activity metadata
  metadata: jsonb("metadata").$type<{
    before?: Record<string, any>; // State before change
    after?: Record<string, any>;  // State after change
    changes?: Record<string, any>; // Diff of changes
    reason?: string;              // Reason for action
    additionalInfo?: Record<string, any>;
  }>(),
  
  // Status and result
  status: varchar("status", { length: 20 }).default("success").notNull(), // success, failed, pending
  errorMessage: text("error_message"), // If status is failed
  duration: integer("duration"), // Operation duration in milliseconds
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Data retention
  expiresAt: timestamp("expires_at"), // When this record should be deleted
}, (table) => [
  // Performance indexes
  index("user_activities_user_idx").on(table.userId),
  index("user_activities_type_idx").on(table.activityTypeId),
  index("user_activities_workspace_idx").on(table.workspaceId),
  index("user_activities_company_idx").on(table.companyId),
  index("user_activities_resource_idx").on(table.resourceType, table.resourceId),
  index("user_activities_created_idx").on(table.createdAt),
  index("user_activities_status_idx").on(table.status),
  
  // Composite indexes for common queries
  index("user_activities_user_date_idx").on(table.userId, table.createdAt),
  index("user_activities_workspace_date_idx").on(table.workspaceId, table.createdAt),
  
  
]);

// Activity summary view - for dashboard and reporting
export const activitySummaryView = sql`
CREATE OR REPLACE VIEW activity_summary AS
SELECT 
  DATE(ua.created_at) as activity_date,
  ua.workspace_id,
  ua.company_id,
  at.category,
  at.name as activity_type,
  ua.status,
  COUNT(*) as activity_count,
  COUNT(DISTINCT ua.user_id) as unique_users
FROM user_activities ua
JOIN activity_types at ON ua.activity_type_id = at.id
WHERE ua.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1, 2, 3, 4, 5, 6
ORDER BY activity_date DESC, activity_count DESC;
`;

// Common activity type seeds
export const commonActivityTypes = [
  // Auth activities
  { name: "auth.login", displayName: "User Login", category: "auth", severity: "info" },
  { name: "auth.logout", displayName: "User Logout", category: "auth", severity: "info" },
  { name: "auth.failed_login", displayName: "Failed Login Attempt", category: "auth", severity: "warning" },
  { name: "auth.password_change", displayName: "Password Changed", category: "auth", severity: "warning" },
  { name: "auth.password_reset", displayName: "Password Reset", category: "auth", severity: "warning" },
  
  // User activities
  { name: "user.create", displayName: "User Created", category: "user", severity: "info" },
  { name: "user.update", displayName: "User Updated", category: "user", severity: "info" },
  { name: "user.delete", displayName: "User Deleted", category: "user", severity: "warning" },
  { name: "user.settings_update", displayName: "User Settings Updated", category: "user", severity: "info" },
  
  // Workspace activities
  { name: "workspace.create", displayName: "Workspace Created", category: "workspace", severity: "info" },
  { name: "workspace.update", displayName: "Workspace Updated", category: "workspace", severity: "info" },
  { name: "workspace.delete", displayName: "Workspace Deleted", category: "workspace", severity: "critical" },
  { name: "workspace.member_add", displayName: "Member Added to Workspace", category: "workspace", severity: "info" },
  { name: "workspace.member_remove", displayName: "Member Removed from Workspace", category: "workspace", severity: "warning" },
  
  // Company activities
  { name: "company.create", displayName: "Company Created", category: "company", severity: "info" },
  { name: "company.update", displayName: "Company Updated", category: "company", severity: "info" },
  { name: "company.delete", displayName: "Company Deleted", category: "company", severity: "warning" },
  
  // Permission activities
  { name: "permission.grant", displayName: "Permission Granted", category: "permission", severity: "warning" },
  { name: "permission.revoke", displayName: "Permission Revoked", category: "permission", severity: "warning" },
  { name: "permission.role_change", displayName: "User Role Changed", category: "permission", severity: "warning" },
  
  // Security activities
  { name: "security.suspicious_activity", displayName: "Suspicious Activity Detected", category: "security", severity: "critical" },
  { name: "security.access_denied", displayName: "Access Denied", category: "security", severity: "warning" },
  { name: "security.data_export", displayName: "Data Exported", category: "security", severity: "warning" },
];