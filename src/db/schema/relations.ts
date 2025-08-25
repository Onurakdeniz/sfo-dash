import { relations } from "drizzle-orm";
import { user } from "./tables/user";
import { account } from "./tables/account";
import { session } from "./tables/session";
import { workspace, workspaceCompany, workspaceMember } from "./tables/workspace";
import { company, department, unit, companyFile, companyFileTemplate, companyFileVersion, companyFileAttachment, companyLocation } from "./tables/company";
import { employeeProfile, employeeFile, employeePositionChange } from "./tables/hr";
import { invitation, invitationTemplate } from "./tables/invitation";
import { policies, policyAssignments } from "./tables/policies";
import { workspaceSettings, companySettings, featureFlags } from "./tables/settings";
import { roles, modules, moduleResources, modulePermissions, roleModulePermissions, moduleAccessLog, userRoles, userModulePermissions } from "./tables/system";
// import { customer, customerAddress, customerContact, customerFile, customerNote } from "./tables/customers"; // Deprecated - use businessEntity
import { talep, talepNote, talepFile, talepActivity, talepProduct, talepAction } from "./tables/talep";
// import { supplier, supplierAddress, supplierContact, supplierFile, supplierNote, supplierPerformance } from "./tables/suppliers"; // Deprecated - use businessEntity
import { product, productVariant, businessEntityProduct, productPriceHistory, productInventory } from "./tables/products";
import { 
  businessEntity, 
  businessEntityAddress,
  businessEntityContact,
  businessEntityActivity,
  businessEntityFile,
  businessEntityNote,
  businessEntityPerformance
} from "./tables/businessEntity";

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
  systemRoles: many(userRoles),
  directPermissions: many(userModulePermissions),
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
  locations: many(companyLocation),
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
  files: many(companyFile),
  fileTemplates: many(companyFileTemplate),
}));

export const companyLocationRelations = relations(companyLocation, ({ one }) => ({
  company: one(company, {
    fields: [companyLocation.companyId],
    references: [company.id],
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
  location: one(companyLocation, {
    fields: [department.locationId],
    references: [companyLocation.id],
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

export const companyFileRelations = relations(companyFile, ({ one }) => ({
  company: one(company, {
    fields: [companyFile.companyId],
    references: [company.id],
  }),
  uploader: one(user, {
    fields: [companyFile.uploadedBy],
    references: [user.id],
  }),
  updater: one(user, {
    fields: [companyFile.updatedBy],
    references: [user.id],
  }),
}));

export const companyFileTemplateRelations = relations(companyFileTemplate, ({ one, many }) => ({
  company: one(company, {
    fields: [companyFileTemplate.companyId],
    references: [company.id],
  }),
  createdByUser: one(user, {
    fields: [companyFileTemplate.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [companyFileTemplate.updatedBy],
    references: [user.id],
  }),
  versions: many(companyFileVersion),
}));

export const companyFileVersionRelations = relations(companyFileVersion, ({ one, many }) => ({
  template: one(companyFileTemplate, {
    fields: [companyFileVersion.templateId],
    references: [companyFileTemplate.id],
  }),
  createdByUser: one(user, {
    fields: [companyFileVersion.createdBy],
    references: [user.id],
  }),
  attachments: many(companyFileAttachment),
}));

export const companyFileAttachmentRelations = relations(companyFileAttachment, ({ one }) => ({
  version: one(companyFileVersion, {
    fields: [companyFileAttachment.versionId],
    references: [companyFileVersion.id],
  }),
  createdByUser: one(user, {
    fields: [companyFileAttachment.createdBy],
    references: [user.id],
  }),
}));

// Employee Profile Relations
export const employeeProfileRelations = relations(employeeProfile, ({ one }) => ({
  workspace: one(workspace, {
    fields: [employeeProfile.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [employeeProfile.companyId],
    references: [company.id],
  }),
  user: one(user, {
    fields: [employeeProfile.userId],
    references: [user.id],
  }),
  department: one(department, {
    fields: [employeeProfile.departmentId],
    references: [department.id],
  }),
  unit: one(unit, {
    fields: [employeeProfile.unitId],
    references: [unit.id],
  }),
  manager: one(user, {
    fields: [employeeProfile.managerId],
    references: [user.id],
  }),
}));

// Employee File Relations
export const employeeFileRelations = relations(employeeFile, ({ one }) => ({
  workspace: one(workspace, {
    fields: [employeeFile.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [employeeFile.companyId],
    references: [company.id],
  }),
  user: one(user, {
    fields: [employeeFile.userId],
    references: [user.id],
  }),
}));

// Employee Position Change Relations
export const employeePositionChangeRelations = relations(employeePositionChange, ({ one }) => ({
  workspace: one(workspace, {
    fields: [employeePositionChange.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [employeePositionChange.companyId],
    references: [company.id],
  }),
  user: one(user, {
    fields: [employeePositionChange.userId],
    references: [user.id],
  }),
  previousDepartment: one(department, {
    fields: [employeePositionChange.previousDepartmentId],
    references: [department.id],
  }),
  newDepartment: one(department, {
    fields: [employeePositionChange.newDepartmentId],
    references: [department.id],
  }),
  previousUnit: one(unit, {
    fields: [employeePositionChange.previousUnitId],
    references: [unit.id],
  }),
  newUnit: one(unit, {
    fields: [employeePositionChange.newUnitId],
    references: [unit.id],
  }),
  createdByUser: one(user, {
    fields: [employeePositionChange.createdBy],
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

// ===== BUSINESS ENTITY RELATIONS =====

// Business Entity Relations
export const businessEntityRelations = relations(businessEntity, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [businessEntity.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [businessEntity.companyId],
    references: [company.id],
  }),
  parentEntity: one(businessEntity, {
    fields: [businessEntity.parentEntityId],
    references: [businessEntity.id],
    relationName: "entityHierarchy",
  }),
  childEntities: many(businessEntity, {
    relationName: "entityHierarchy",
  }),
  addresses: many(businessEntityAddress),
  contacts: many(businessEntityContact),
  activities: many(businessEntityActivity),
  files: many(businessEntityFile),
  notes: many(businessEntityNote),
  performance: many(businessEntityPerformance),
  products: many(businessEntityProduct),
  createdByUser: one(user, {
    fields: [businessEntity.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [businessEntity.updatedBy],
    references: [user.id],
  }),
}));

// Business Entity Address Relations
export const businessEntityAddressRelations = relations(businessEntityAddress, ({ one }) => ({
  entity: one(businessEntity, {
    fields: [businessEntityAddress.entityId],
    references: [businessEntity.id],
  }),
  createdByUser: one(user, {
    fields: [businessEntityAddress.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [businessEntityAddress.updatedBy],
    references: [user.id],
  }),
}));

// Business Entity Contact Relations
export const businessEntityContactRelations = relations(businessEntityContact, ({ one, many }) => ({
  entity: one(businessEntity, {
    fields: [businessEntityContact.entityId],
    references: [businessEntity.id],
  }),
  notes: many(businessEntityNote),
  createdByUser: one(user, {
    fields: [businessEntityContact.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [businessEntityContact.updatedBy],
    references: [user.id],
  }),
}));

// Business Entity Activity Relations
export const businessEntityActivityRelations = relations(businessEntityActivity, ({ one }) => ({
  entity: one(businessEntity, {
    fields: [businessEntityActivity.entityId],
    references: [businessEntity.id],
  }),
  contact: one(businessEntityContact, {
    fields: [businessEntityActivity.contactId],
    references: [businessEntityContact.id],
  }),
  performedByUser: one(user, {
    fields: [businessEntityActivity.performedBy],
    references: [user.id],
  }),
}));

// Business Entity File Relations
export const businessEntityFileRelations = relations(businessEntityFile, ({ one }) => ({
  entity: one(businessEntity, {
    fields: [businessEntityFile.entityId],
    references: [businessEntity.id],
  }),
  uploadedByUser: one(user, {
    fields: [businessEntityFile.uploadedBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [businessEntityFile.updatedBy],
    references: [user.id],
  }),
}));

// Business Entity Note Relations
export const businessEntityNoteRelations = relations(businessEntityNote, ({ one }) => ({
  entity: one(businessEntity, {
    fields: [businessEntityNote.entityId],
    references: [businessEntity.id],
  }),
  relatedContact: one(businessEntityContact, {
    fields: [businessEntityNote.relatedContactId],
    references: [businessEntityContact.id],
  }),
  createdByUser: one(user, {
    fields: [businessEntityNote.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [businessEntityNote.updatedBy],
    references: [user.id],
  }),
}));

// Business Entity Performance Relations
export const businessEntityPerformanceRelations = relations(businessEntityPerformance, ({ one }) => ({
  entity: one(businessEntity, {
    fields: [businessEntityPerformance.entityId],
    references: [businessEntity.id],
  }),
  createdByUser: one(user, {
    fields: [businessEntityPerformance.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [businessEntityPerformance.updatedBy],
    references: [user.id],
  }),
}));

// ===== CUSTOMER RELATIONS (DEPRECATED) =====
// @deprecated Use businessEntityRelations instead

// Customer Relations
/* Commented out - use businessEntityRelations instead
export const customerRelations = relations(customer, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [customer.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [customer.companyId],
    references: [company.id],
  }),
  parentCustomer: one(customer, {
    fields: [customer.parentCustomerId],
    references: [customer.id],
    relationName: "customerHierarchy",
  }),
  childCustomers: many(customer, {
    relationName: "customerHierarchy",
  }),
  addresses: many(customerAddress),
  contacts: many(customerContact),
  files: many(customerFile),
  notes: many(customerNote),
  createdByUser: one(user, {
    fields: [customer.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [customer.updatedBy],
    references: [user.id],
  }),
}));
*/

// Customer Address Relations
/* Commented out - use businessEntityAddressRelations instead
export const customerAddressRelations = relations(customerAddress, ({ one }) => ({
  customer: one(customer, {
    fields: [customerAddress.customerId],
    references: [customer.id],
  }),
  createdByUser: one(user, {
    fields: [customerAddress.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [customerAddress.updatedBy],
    references: [user.id],
  }),
}));
*/

// Customer Contact Relations
/* Commented out - use businessEntityContactRelations instead
export const customerContactRelations = relations(customerContact, ({ one }) => ({
  customer: one(customer, {
    fields: [customerContact.customerId],
    references: [customer.id],
  }),
  createdByUser: one(user, {
    fields: [customerContact.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [customerContact.updatedBy],
    references: [user.id],
  }),
}));
*/

// Customer File Relations
/* Commented out - use businessEntityFileRelations instead
export const customerFileRelations = relations(customerFile, ({ one }) => ({
  customer: one(customer, {
    fields: [customerFile.customerId],
    references: [customer.id],
  }),
  uploadedByUser: one(user, {
    fields: [customerFile.uploadedBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [customerFile.updatedBy],
    references: [user.id],
  }),
}));
*/

// Customer Note Relations
/* Commented out - use businessEntityNoteRelations instead
export const customerNoteRelations = relations(customerNote, ({ one }) => ({
  customer: one(customer, {
    fields: [customerNote.customerId],
    references: [customer.id],
  }),
  relatedContact: one(customerContact, {
    fields: [customerNote.relatedContactId],
    references: [customerContact.id],
  }),
  createdByUser: one(user, {
    fields: [customerNote.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [customerNote.updatedBy],
    references: [user.id],
  }),
}));
*/

// ===== TALEP RELATIONS =====

// Talep Relations
export const talepRelations = relations(talep, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [talep.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [talep.companyId],
    references: [company.id],
  }),
  entity: one(businessEntity, {
    fields: [talep.entityId],
    references: [businessEntity.id],
  }),
  entityContact: one(businessEntityContact, {
    fields: [talep.entityContactId],
    references: [businessEntityContact.id],
  }),
  assignedToUser: one(user, {
    fields: [talep.assignedTo],
    references: [user.id],
    relationName: "assignedTo",
  }),
  assignedByUser: one(user, {
    fields: [talep.assignedBy],
    references: [user.id],
    relationName: "assignedBy",
  }),
  createdByUser: one(user, {
    fields: [talep.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [talep.updatedBy],
    references: [user.id],
  }),
  notes: many(talepNote),
  files: many(talepFile),
  activities: many(talepActivity),
  products: many(talepProduct),
  actions: many(talepAction),
}));

// Talep Note Relations
export const talepNoteRelations = relations(talepNote, ({ one }) => ({
  talep: one(talep, {
    fields: [talepNote.talepId],
    references: [talep.id],
  }),
  createdByUser: one(user, {
    fields: [talepNote.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [talepNote.updatedBy],
    references: [user.id],
  }),
}));

// Talep File Relations
export const talepFileRelations = relations(talepFile, ({ one }) => ({
  talep: one(talep, {
    fields: [talepFile.talepId],
    references: [talep.id],
  }),
  uploadedByUser: one(user, {
    fields: [talepFile.uploadedBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [talepFile.updatedBy],
    references: [user.id],
  }),
}));

// Talep Activity Relations
export const talepActivityRelations = relations(talepActivity, ({ one }) => ({
  talep: one(talep, {
    fields: [talepActivity.talepId],
    references: [talep.id],
  }),
  performedByUser: one(user, {
    fields: [talepActivity.performedBy],
    references: [user.id],
  }),
}));

// Talep Product Relations
export const talepProductRelations = relations(talepProduct, ({ one }) => ({
  talep: one(talep, {
    fields: [talepProduct.talepId],
    references: [talep.id],
  }),
  createdByUser: one(user, {
    fields: [talepProduct.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [talepProduct.updatedBy],
    references: [user.id],
  }),
}));

// Talep Action Relations
export const talepActionRelations = relations(talepAction, ({ one }) => ({
  talep: one(talep, {
    fields: [talepAction.talepId],
    references: [talep.id],
  }),
  performedByUser: one(user, {
    fields: [talepAction.performedBy],
    references: [user.id],
  }),
}));

// ===== SUPPLIER RELATIONS (DEPRECATED) =====
// @deprecated Use businessEntityRelations instead

// Supplier Relations
export const supplierRelations = relations(supplier, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [supplier.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [supplier.companyId],
    references: [company.id],
  }),
  parentSupplier: one(supplier, {
    fields: [supplier.parentSupplierId],
    references: [supplier.id],
    relationName: "supplierHierarchy",
  }),
  childSuppliers: many(supplier, {
    relationName: "supplierHierarchy",
  }),
  addresses: many(supplierAddress),
  contacts: many(supplierContact),
  files: many(supplierFile),
  notes: many(supplierNote),
  performance: many(supplierPerformance),
  // supplierProducts relation removed - should be handled through businessEntity
  createdByUser: one(user, {
    fields: [supplier.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [supplier.updatedBy],
    references: [user.id],
  }),
}));

// Supplier Address Relations
export const supplierAddressRelations = relations(supplierAddress, ({ one }) => ({
  supplier: one(supplier, {
    fields: [supplierAddress.supplierId],
    references: [supplier.id],
  }),
  createdByUser: one(user, {
    fields: [supplierAddress.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [supplierAddress.updatedBy],
    references: [user.id],
  }),
}));

// Supplier Contact Relations
export const supplierContactRelations = relations(supplierContact, ({ one }) => ({
  supplier: one(supplier, {
    fields: [supplierContact.supplierId],
    references: [supplier.id],
  }),
  createdByUser: one(user, {
    fields: [supplierContact.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [supplierContact.updatedBy],
    references: [user.id],
  }),
}));

// Supplier File Relations
export const supplierFileRelations = relations(supplierFile, ({ one }) => ({
  supplier: one(supplier, {
    fields: [supplierFile.supplierId],
    references: [supplier.id],
  }),
  uploadedByUser: one(user, {
    fields: [supplierFile.uploadedBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [supplierFile.updatedBy],
    references: [user.id],
  }),
}));

// Supplier Note Relations
export const supplierNoteRelations = relations(supplierNote, ({ one }) => ({
  supplier: one(supplier, {
    fields: [supplierNote.supplierId],
    references: [supplier.id],
  }),
  relatedContact: one(supplierContact, {
    fields: [supplierNote.relatedContactId],
    references: [supplierContact.id],
  }),
  createdByUser: one(user, {
    fields: [supplierNote.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [supplierNote.updatedBy],
    references: [user.id],
  }),
}));

// Supplier Performance Relations
export const supplierPerformanceRelations = relations(supplierPerformance, ({ one }) => ({
  supplier: one(supplier, {
    fields: [supplierPerformance.supplierId],
    references: [supplier.id],
  }),
  createdByUser: one(user, {
    fields: [supplierPerformance.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [supplierPerformance.updatedBy],
    references: [user.id],
  }),
}));

// Product Relations
export const productRelations = relations(product, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [product.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [product.companyId],
    references: [company.id],
  }),
  createdByUser: one(user, {
    fields: [product.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [product.updatedBy],
    references: [user.id],
  }),
  variants: many(productVariant),
  businessEntityProducts: many(businessEntityProduct),
  priceHistory: many(productPriceHistory),
  inventory: many(productInventory),
}));

// Product Variant Relations
export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
  product: one(product, {
    fields: [productVariant.productId],
    references: [product.id],
  }),
  createdByUser: one(user, {
    fields: [productVariant.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [productVariant.updatedBy],
    references: [user.id],
  }),
  priceHistory: many(productPriceHistory),
  inventory: many(productInventory),
}));

// Business Entity Product Relations
export const businessEntityProductRelations = relations(businessEntityProduct, ({ one }) => ({
  businessEntity: one(businessEntity, {
    fields: [businessEntityProduct.entityId],
    references: [businessEntity.id],
  }),
  product: one(product, {
    fields: [businessEntityProduct.productId],
    references: [product.id],
  }),
  createdByUser: one(user, {
    fields: [businessEntityProduct.createdBy],
    references: [user.id],
  }),
  updatedByUser: one(user, {
    fields: [businessEntityProduct.updatedBy],
    references: [user.id],
  }),
}));

// Product Price History Relations
export const productPriceHistoryRelations = relations(productPriceHistory, ({ one }) => ({
  product: one(product, {
    fields: [productPriceHistory.productId],
    references: [product.id],
  }),
  variant: one(productVariant, {
    fields: [productPriceHistory.variantId],
    references: [productVariant.id],
  }),
  entity: one(businessEntity, {
    fields: [productPriceHistory.entityId],
    references: [businessEntity.id],
  }),
  changedByUser: one(user, {
    fields: [productPriceHistory.changedBy],
    references: [user.id],
  }),
}));

// Product Inventory Relations
export const productInventoryRelations = relations(productInventory, ({ one }) => ({
  product: one(product, {
    fields: [productInventory.productId],
    references: [product.id],
  }),
  variant: one(productVariant, {
    fields: [productInventory.variantId],
    references: [productVariant.id],
  }),
  updatedByUser: one(user, {
    fields: [productInventory.updatedBy],
    references: [user.id],
  }),
}));