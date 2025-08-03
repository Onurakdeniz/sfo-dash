import { pgTable, varchar, text, timestamp, jsonb, boolean, index, unique } from "drizzle-orm/pg-core";
import { invitationTypeEnum, invitationStatusEnum, workspaceMemberRoleEnum } from "..";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";

// Main invitations table - handles secure email-based invitations
export const invitation = pgTable("invitations", {
  id: text("id").primaryKey(),
  
  // Invitation details
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(), // Secure random token for email links
  type: invitationTypeEnum("type").notNull(),
  status: invitationStatusEnum("status").default("pending").notNull(),

  // Role to be granted upon acceptance (nullable for company invites)
  role: workspaceMemberRoleEnum("role"),
  
  // Target references (one will be null based on type)
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }),
  // Team support for Better Auth organization plugin
  teamId: text("team_id"),
  
  // Invitation metadata
  invitedBy: text("invited_by").references(() => user.id, { onDelete: "set null" }).notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Default 7 days from creation
  
  // Response tracking
  respondedAt: timestamp("responded_at"),
  acceptedBy: text("accepted_by").references(() => user.id, { onDelete: "set null" }),
  
  // Additional data
  message: text("message"), // Optional personal message from inviter
  metadata: jsonb("metadata"), // Additional invitation context
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete field
}, (table) => [
  // Performance indexes
  index("invitations_email_idx").on(table.email),
  index("invitations_token_idx").on(table.token),
  index("invitations_status_idx").on(table.status),
  index("invitations_type_idx").on(table.type),
  index("invitations_workspace_idx").on(table.workspaceId),
  index("invitations_company_idx").on(table.companyId),
  index("invitations_invited_by_idx").on(table.invitedBy),
  index("invitations_expires_idx").on(table.expiresAt),
  
  // Composite indexes for common queries
  index("invitations_email_status_idx").on(table.email, table.status),
  index("invitations_workspace_status_idx").on(table.workspaceId, table.status),
  index("invitations_company_status_idx").on(table.companyId, table.status),
  
  // Unique constraints to prevent duplicate pending invitations
  unique("invitations_workspace_email_unique").on(table.workspaceId, table.email, table.status),
  unique("invitations_company_email_unique").on(table.companyId, table.email, table.status),
]);

// Invitation templates table - for customizable invitation emails
export const invitationTemplate = pgTable("invitation_templates", {
  id: text("id").primaryKey(),
  
  // Template details
  name: varchar("name", { length: 100 }).notNull(),
  type: invitationTypeEnum("type").notNull(),
  
  // Template content
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  
  // Scope (workspace or company specific, or global)
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }),
  
  // Template metadata
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete field
}, (table) => [
  // Performance indexes
  index("invitation_templates_name_idx").on(table.name),
  index("invitation_templates_type_idx").on(table.type),
  index("invitation_templates_workspace_idx").on(table.workspaceId),
  index("invitation_templates_company_idx").on(table.companyId),
  index("invitation_templates_default_idx").on(table.isDefault),
  index("invitation_templates_active_idx").on(table.isActive),
  
  // Unique constraints for default templates
  unique("invitation_templates_workspace_type_default_unique").on(table.workspaceId, table.type, table.isDefault),
  unique("invitation_templates_company_type_default_unique").on(table.companyId, table.type, table.isDefault),
]);

export type InvitationType = typeof invitation.$inferSelect;
export type InvitationTemplateType = typeof invitationTemplate.$inferSelect;