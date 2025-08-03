import { pgTable, varchar, timestamp, text, jsonb, boolean, primaryKey, index } from "drizzle-orm/pg-core";
import { workspaceMemberRoleEnum } from "..";
import { user } from "./user";
import { company } from "./company";

// Workspace settings type - you may want to define this in a separate types file
interface WorkspaceSettings {
  theme?: string;
  notifications?: boolean;
  [key: string]: any;
}

// ----------------------------------------------------
// Workspaces
// ----------------------------------------------------
export const workspace = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  settings: jsonb("settings").$type<WorkspaceSettings>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ownerId: text("owner_id").references(() => user.id).notNull(),
});

// ----------------------------------------------------
// Workspace ⇄ Company many-to-many junction
// ----------------------------------------------------
export const workspaceCompany = pgTable("workspace_companies", {
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }).notNull(),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedBy: text("added_by").references(() => user.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.workspaceId, table.companyId] }),
}));

// ----------------------------------------------------
// Workspace members
// ----------------------------------------------------
export const workspaceMember = pgTable("workspace_members", {
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  role: workspaceMemberRoleEnum("role").default("member").notNull(),
  invitedBy: text("invited_by").references(() => user.id),
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

export type WorkspaceType = typeof workspace.$inferSelect;
export type WorkspaceCompanyType = typeof workspaceCompany.$inferSelect;
export type WorkspaceMemberType = typeof workspaceMember.$inferSelect;