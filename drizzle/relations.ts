import { relations } from "drizzle-orm/relations";
import { user, session, companies, departments, units, workspaces, invitations, account, invitationTemplates, companySettings, featureFlags, workspaceSettings, policies, policyAssignments, modules, moduleResources, modulePermissions, moduleAccessLog, roles, roleModulePermissions, workspaceCompanies, workspaceMembers } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	departments: many(departments),
	units: many(units),
	workspaces: many(workspaces),
	invitations_invitedBy: many(invitations, {
		relationName: "invitations_invitedBy_user_id"
	}),
	invitations_acceptedBy: many(invitations, {
		relationName: "invitations_acceptedBy_user_id"
	}),
	accounts: many(account),
	policies: many(policies),
	policyAssignments: many(policyAssignments),
	moduleAccessLogs: many(moduleAccessLog),
	roleModulePermissions: many(roleModulePermissions),
	workspaceCompanies: many(workspaceCompanies),
	workspaceMembers_userId: many(workspaceMembers, {
		relationName: "workspaceMembers_userId_user_id"
	}),
	workspaceMembers_invitedBy: many(workspaceMembers, {
		relationName: "workspaceMembers_invitedBy_user_id"
	}),
}));

export const departmentsRelations = relations(departments, ({one, many}) => ({
	company: one(companies, {
		fields: [departments.companyId],
		references: [companies.id]
	}),
	user: one(user, {
		fields: [departments.managerId],
		references: [user.id]
	}),
	units: many(units),
}));

export const companiesRelations = relations(companies, ({many}) => ({
	departments: many(departments),
	invitations: many(invitations),
	invitationTemplates: many(invitationTemplates),
	companySettings: many(companySettings),
	featureFlags: many(featureFlags),
	policyAssignments: many(policyAssignments),
	roles: many(roles),
	workspaceCompanies: many(workspaceCompanies),
}));

export const unitsRelations = relations(units, ({one}) => ({
	department: one(departments, {
		fields: [units.departmentId],
		references: [departments.id]
	}),
	user: one(user, {
		fields: [units.leadId],
		references: [user.id]
	}),
}));

export const workspacesRelations = relations(workspaces, ({one, many}) => ({
	user: one(user, {
		fields: [workspaces.ownerId],
		references: [user.id]
	}),
	invitations: many(invitations),
	invitationTemplates: many(invitationTemplates),
	featureFlags: many(featureFlags),
	workspaceSettings: many(workspaceSettings),
	policyAssignments: many(policyAssignments),
	roles: many(roles),
	roleModulePermissions: many(roleModulePermissions),
	workspaceCompanies: many(workspaceCompanies),
	workspaceMembers: many(workspaceMembers),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	workspace: one(workspaces, {
		fields: [invitations.workspaceId],
		references: [workspaces.id]
	}),
	company: one(companies, {
		fields: [invitations.companyId],
		references: [companies.id]
	}),
	user_invitedBy: one(user, {
		fields: [invitations.invitedBy],
		references: [user.id],
		relationName: "invitations_invitedBy_user_id"
	}),
	user_acceptedBy: one(user, {
		fields: [invitations.acceptedBy],
		references: [user.id],
		relationName: "invitations_acceptedBy_user_id"
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const invitationTemplatesRelations = relations(invitationTemplates, ({one}) => ({
	workspace: one(workspaces, {
		fields: [invitationTemplates.workspaceId],
		references: [workspaces.id]
	}),
	company: one(companies, {
		fields: [invitationTemplates.companyId],
		references: [companies.id]
	}),
}));

export const companySettingsRelations = relations(companySettings, ({one}) => ({
	company: one(companies, {
		fields: [companySettings.companyId],
		references: [companies.id]
	}),
}));

export const featureFlagsRelations = relations(featureFlags, ({one}) => ({
	workspace: one(workspaces, {
		fields: [featureFlags.workspaceId],
		references: [workspaces.id]
	}),
	company: one(companies, {
		fields: [featureFlags.companyId],
		references: [companies.id]
	}),
}));

export const workspaceSettingsRelations = relations(workspaceSettings, ({one}) => ({
	workspace: one(workspaces, {
		fields: [workspaceSettings.workspaceId],
		references: [workspaces.id]
	}),
}));

export const policiesRelations = relations(policies, ({one, many}) => ({
	user: one(user, {
		fields: [policies.createdBy],
		references: [user.id]
	}),
	policyAssignments: many(policyAssignments),
}));

export const policyAssignmentsRelations = relations(policyAssignments, ({one}) => ({
	policy: one(policies, {
		fields: [policyAssignments.policyId],
		references: [policies.id]
	}),
	workspace: one(workspaces, {
		fields: [policyAssignments.workspaceId],
		references: [workspaces.id]
	}),
	company: one(companies, {
		fields: [policyAssignments.companyId],
		references: [companies.id]
	}),
	user: one(user, {
		fields: [policyAssignments.assignedBy],
		references: [user.id]
	}),
}));

export const moduleResourcesRelations = relations(moduleResources, ({one, many}) => ({
	module: one(modules, {
		fields: [moduleResources.moduleId],
		references: [modules.id]
	}),
	moduleResource: one(moduleResources, {
		fields: [moduleResources.parentResourceId],
		references: [moduleResources.id],
		relationName: "moduleResources_parentResourceId_moduleResources_id"
	}),
	moduleResources: many(moduleResources, {
		relationName: "moduleResources_parentResourceId_moduleResources_id"
	}),
	modulePermissions: many(modulePermissions),
	moduleAccessLogs: many(moduleAccessLog),
}));

export const modulesRelations = relations(modules, ({many}) => ({
	moduleResources: many(moduleResources),
}));

export const modulePermissionsRelations = relations(modulePermissions, ({one, many}) => ({
	moduleResource: one(moduleResources, {
		fields: [modulePermissions.resourceId],
		references: [moduleResources.id]
	}),
	roleModulePermissions: many(roleModulePermissions),
}));

export const moduleAccessLogRelations = relations(moduleAccessLog, ({one}) => ({
	user: one(user, {
		fields: [moduleAccessLog.userId],
		references: [user.id]
	}),
	moduleResource: one(moduleResources, {
		fields: [moduleAccessLog.resourceId],
		references: [moduleResources.id]
	}),
}));

export const rolesRelations = relations(roles, ({one, many}) => ({
	workspace: one(workspaces, {
		fields: [roles.workspaceId],
		references: [workspaces.id]
	}),
	company: one(companies, {
		fields: [roles.companyId],
		references: [companies.id]
	}),
	roleModulePermissions: many(roleModulePermissions),
}));

export const roleModulePermissionsRelations = relations(roleModulePermissions, ({one}) => ({
	role: one(roles, {
		fields: [roleModulePermissions.roleId],
		references: [roles.id]
	}),
	modulePermission: one(modulePermissions, {
		fields: [roleModulePermissions.permissionId],
		references: [modulePermissions.id]
	}),
	workspace: one(workspaces, {
		fields: [roleModulePermissions.workspaceId],
		references: [workspaces.id]
	}),
	user: one(user, {
		fields: [roleModulePermissions.grantedBy],
		references: [user.id]
	}),
}));

export const workspaceCompaniesRelations = relations(workspaceCompanies, ({one}) => ({
	workspace: one(workspaces, {
		fields: [workspaceCompanies.workspaceId],
		references: [workspaces.id]
	}),
	company: one(companies, {
		fields: [workspaceCompanies.companyId],
		references: [companies.id]
	}),
	user: one(user, {
		fields: [workspaceCompanies.addedBy],
		references: [user.id]
	}),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({one}) => ({
	workspace: one(workspaces, {
		fields: [workspaceMembers.workspaceId],
		references: [workspaces.id]
	}),
	user_userId: one(user, {
		fields: [workspaceMembers.userId],
		references: [user.id],
		relationName: "workspaceMembers_userId_user_id"
	}),
	user_invitedBy: one(user, {
		fields: [workspaceMembers.invitedBy],
		references: [user.id],
		relationName: "workspaceMembers_invitedBy_user_id"
	}),
}));