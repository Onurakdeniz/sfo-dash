/**
 * Simple Policy Management Schema
 * 
 * This module defines a simplified database schema for managing organizational policies
 * such as privacy policies, KVKV compliance, and terms of service.
 */

import { pgTable, varchar, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";

// Main policies table
export const policies = pgTable("policies", {
  id: text("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Audit fields - adapted to match existing schema ID types
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("policies_type_idx").on(table.type),
  index("policies_status_idx").on(table.status),
]);

// Policy assignments - links policies to workspaces or companies
export const policyAssignments = pgTable("policy_assignments", {
  id: text("id").primaryKey(),
  policyId: text("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
  
  // Assignment target (either workspace or company) - adapted to match existing schema ID types
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }),
  
  // Audit fields - adapted to match existing schema ID types
  assignedBy: text("assigned_by").notNull().references(() => user.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => [
  index("policy_assignments_policy_idx").on(table.policyId),
  index("policy_assignments_workspace_idx").on(table.workspaceId),
  index("policy_assignments_company_idx").on(table.companyId),
]);