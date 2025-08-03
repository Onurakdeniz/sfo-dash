/**
 * Simple Policy Management Schema
 * 
 * This module defines a simplified database schema for managing organizational policies
 * such as privacy policies, KVKV compliance, and terms of service.
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, index, integer } from "drizzle-orm/pg-core";
import { users } from "./user";
import { workspaces } from "./workspace";
import { companies } from "./company";



// Main policies table
export const policies = pgTable("policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Audit fields
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("policies_type_idx").on(table.type),
  index("policies_status_idx").on(table.status),
]);

// Policy assignments - links policies to workspaces or companies
export const policyAssignments = pgTable("policy_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
  
  // Assignment target (either workspace or company)
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  
  // Audit fields
  assignedBy: uuid("assigned_by").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => [
  index("policy_assignments_policy_idx").on(table.policyId),
  index("policy_assignments_workspace_idx").on(table.workspaceId),
  index("policy_assignments_company_idx").on(table.companyId),
]);