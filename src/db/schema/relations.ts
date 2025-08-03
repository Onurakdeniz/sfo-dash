import { relations } from "drizzle-orm";
import { user } from "./tables/user";
import { account } from "./tables/account";
import { session } from "./tables/session";
import { workspace, workspaceCompany, workspaceMember } from "./tables/workspace";
import { company, department, unit } from "./tables/company";
import { invitation, invitationTemplate } from "./tables/invitation";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  ownedWorkspaces: many(workspace),
  workspaceMemberships: many(workspaceMember),
  managedDepartments: many(department),
  ledUnits: many(unit),
  sentInvitations: many(invitation, { relationName: "invitedBy" }),
  acceptedInvitations: many(invitation, { relationName: "acceptedBy" }),
}));

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  owner: one(user, {
    fields: [workspace.ownerId],
    references: [user.id],
  }),
  members: many(workspaceMember),
  companies: many(workspaceCompany),
  invitations: many(invitation),
  invitationTemplates: many(invitationTemplate),
}));

export const companyRelations = relations(company, ({ many, one }) => ({
  workspaces: many(workspaceCompany),
  departments: many(department),
  invitations: many(invitation),
  invitationTemplates: many(invitationTemplate),
  parentCompany: one(company, {
    fields: [company.parentCompanyId],
    references: [company.id],
    relationName: "companyHierarchy",
  }),
  childCompanies: many(company, {
    relationName: "companyHierarchy",
  }),
}));

export const workspaceCompanyRelations = relations(workspaceCompany, ({ one }) => ({
  workspace: one(workspace, {
    fields: [workspaceCompany.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [workspaceCompany.companyId],
    references: [company.id],
  }),
  addedByUser: one(user, {
    fields: [workspaceCompany.addedBy],
    references: [user.id],
  }),
}));

export const workspaceMemberRelations = relations(workspaceMember, ({ one }) => ({
  workspace: one(workspace, {
    fields: [workspaceMember.workspaceId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [workspaceMember.userId],
    references: [user.id],
  }),
  invitedByUser: one(user, {
    fields: [workspaceMember.invitedBy],
    references: [user.id],
  }),
}));

export const departmentRelations = relations(department, ({ one, many }) => ({
  company: one(company, {
    fields: [department.companyId],
    references: [company.id],
  }),
  manager: one(user, {
    fields: [department.managerId],
    references: [user.id],
  }),
  parentDepartment: one(department, {
    fields: [department.parentDepartmentId],
    references: [department.id],
    relationName: "departmentHierarchy",
  }),
  childDepartments: many(department, {
    relationName: "departmentHierarchy",
  }),
  units: many(unit),
}));

export const unitRelations = relations(unit, ({ one }) => ({
  department: one(department, {
    fields: [unit.departmentId],
    references: [department.id],
  }),
  lead: one(user, {
    fields: [unit.leadId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  workspace: one(workspace, {
    fields: [invitation.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [invitation.companyId],
    references: [company.id],
  }),
  invitedByUser: one(user, {
    fields: [invitation.invitedBy], 
    references: [user.id],
    relationName: "invitedBy",
  }),
  acceptedByUser: one(user, {
    fields: [invitation.acceptedBy],
    references: [user.id],
    relationName: "acceptedBy",
  }),
}));

export const invitationTemplateRelations = relations(invitationTemplate, ({ one }) => ({
  workspace: one(workspace, {
    fields: [invitationTemplate.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [invitationTemplate.companyId],
    references: [company.id],
  }),
}));