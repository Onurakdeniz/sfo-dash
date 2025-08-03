import { pgTable, uuid, varchar, timestamp, text, jsonb, boolean, primaryKey, index, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./user";
import { companies } from "./company";
import type { WorkspaceSettings } from "../types";

/**
 * Workspace-related schema (workspaces, members, and workspace-company relations).
 * Company and department tables live in their own dedicated modules to avoid
 * duplicate exports. This file therefore imports the `companies` table from
 * `company.ts` instead of declaring it again.
 */

// ----------------------------------------------------
// Workspaces
// ----------------------------------------------------
export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  settings: jsonb("settings").$type<WorkspaceSettings>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ownerId: text("owner_id").references(() => users.id).notNull(),
});

// ----------------------------------------------------
// Workspace ⇄ Company many-to-many junction
// ----------------------------------------------------
export const workspaceCompanies = pgTable("workspace_companies", {
  workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedBy: text("added_by").references(() => users.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.workspaceId, table.companyId] }),
}));

// ----------------------------------------------------
// Workspace members
// ----------------------------------------------------
export const workspaceMemberRoleEnum = pgEnum("workspace_member_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const workspaceMembers = pgTable("workspace_members", {
  workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: workspaceMemberRoleEnum("role").default("member").notNull(),
  invitedBy: text("invited_by").references(() => users.id),
  inviteStatus: varchar("invite_status", { length: 50 }).default("accepted"), // pending, accepted, rejected
  inviteToken: text("invite_token"),
  inviteExpiresAt: timestamp("invite_expires_at"),
  permissions: jsonb("permissions").$type<string[]>(), // Fine-grained permissions
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at"),
}, (table) => ({
  pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
  userIdx: index("workspace_member_user_idx").on(table.userId),
  inviteTokenIdx: index("workspace_member_invite_token_idx").on(table.inviteToken),
}));
