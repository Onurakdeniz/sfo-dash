import { relations } from "drizzle-orm";
import { user } from "./tables/user";
import { account } from "./tables/account";
import { session } from "./tables/session";
import { workspace, workspaceCompany, workspaceMember } from "./tables/workspace";
import { company, department, unit } from "./tables/company";
import { invitation, invitationTemplate } from "./tables/invitation";
import { policies, policyAssignments } from "./tables/policies";
import { workspaceSettings, companySettings, featureFlags } from "./tables/settings";
import { roles, modules, moduleResources, modulePermissions, roleModulePermissions, moduleAccessLog } from "./tables/system";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  ownedWorkspaces: many(workspace),
  workspaceMemberships: many(workspaceMember),
  managedDepartments: many(department),
  ledUnits: many(unit),
  sentInvitations: many(invitation, { relationName: "invitedBy" }),
  acceptedInvitations: many(invitation, { relationName: "acceptedBy" }),
  // New relations
  createdPolicies: many(policies),
  assignedPolicies: many(policyAssignments),
  grantedPermissions: many(roleModulePermissions),
  accessLogs: many(moduleAccessLog),
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
  // New relations
  settings: one(workspaceSettings),
  policyAssignments: many(policyAssignments),
  featureFlags: many(featureFlags),
  roles: many(roles),
  rolePermissions: many(roleModulePermissions),
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
  // New relations
  settings: one(companySettings),
  policyAssignments: many(policyAssignments),
  featureFlags: many(featureFlags),
  roles: many(roles),
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

// ===== NEW TABLE RELATIONS =====

// Policies Relations
export const policiesRelations = relations(policies, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [policies.createdBy],
    references: [user.id],
  }),
  assignments: many(policyAssignments),
}));

export const policyAssignmentsRelations = relations(policyAssignments, ({ one }) => ({
  policy: one(policies, {
    fields: [policyAssignments.policyId],
    references: [policies.id],
  }),
  workspace: one(workspace, {
    fields: [policyAssignments.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [policyAssignments.companyId],
    references: [company.id],
  }),
  assignedByUser: one(user, {
    fields: [policyAssignments.assignedBy],
    references: [user.id],
  }),
}));

// Settings Relations
export const workspaceSettingsRelations = relations(workspaceSettings, ({ one }) => ({
  workspace: one(workspace, {
    fields: [workspaceSettings.workspaceId],
    references: [workspace.id],
  }),
}));

export const companySettingsRelations = relations(companySettings, ({ one }) => ({
  company: one(company, {
    fields: [companySettings.companyId],
    references: [company.id],
  }),
}));

export const featureFlagsRelations = relations(featureFlags, ({ one }) => ({
  workspace: one(workspace, {
    fields: [featureFlags.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [featureFlags.companyId],
    references: [company.id],
  }),
}));

// System Relations
export const rolesRelations = relations(roles, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [roles.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [roles.companyId],
    references: [company.id],
  }),
  permissions: many(roleModulePermissions),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  resources: many(moduleResources),
}));

export const moduleResourcesRelations = relations(moduleResources, ({ one, many }) => ({
  module: one(modules, {
    fields: [moduleResources.moduleId],
    references: [modules.id],
  }),
  parentResource: one(moduleResources, {
    fields: [moduleResources.parentResourceId],
    references: [moduleResources.id],
    relationName: "resourceHierarchy",
  }),
  childResources: many(moduleResources, {
    relationName: "resourceHierarchy",
  }),
  permissions: many(modulePermissions),
  accessLogs: many(moduleAccessLog),
}));

export const modulePermissionsRelations = relations(modulePermissions, ({ one, many }) => ({
  resource: one(moduleResources, {
    fields: [modulePermissions.resourceId],
    references: [moduleResources.id],
  }),
  rolePermissions: many(roleModulePermissions),
}));

export const roleModulePermissionsRelations = relations(roleModulePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [roleModulePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(modulePermissions, {
    fields: [roleModulePermissions.permissionId],
    references: [modulePermissions.id],
  }),
  workspace: one(workspace, {
    fields: [roleModulePermissions.workspaceId],
    references: [workspace.id],
  }),
  grantedByUser: one(user, {
    fields: [roleModulePermissions.grantedBy],
    references: [user.id],
  }),
}));

export const moduleAccessLogRelations = relations(moduleAccessLog, ({ one }) => ({
  user: one(user, {
    fields: [moduleAccessLog.userId],
    references: [user.id],
  }),
  resource: one(moduleResources, {
    fields: [moduleAccessLog.resourceId],
    references: [moduleResources.id],
  }),
}));