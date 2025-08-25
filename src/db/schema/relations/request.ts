import { relations } from "drizzle-orm";
import {
  request,
  requestItem,
  requestFile,
  requestNote,
  requestTeamMember,
  requestActivity,
  requestAction,
  requestStageTransition
} from "../tables/request";
import { user } from "../tables/user";
import { workspace } from "../tables/workspace";
import { company } from "../tables/company";
import { businessEntity, businessEntityContact } from "../tables/businessEntity";

// Request relations
export const requestRelations = relations(request, ({ one, many }) => ({
  // Parent entities
  workspace: one(workspace, {
    fields: [request.workspaceId],
    references: [workspace.id],
  }),
  company: one(company, {
    fields: [request.companyId],
    references: [company.id],
  }),
  
  // Customer relationship
  customer: one(businessEntity, {
    fields: [request.customerId],
    references: [businessEntity.id],
    relationName: "requestCustomer",
  }),
  customerContact: one(businessEntityContact, {
    fields: [request.customerContactId],
    references: [businessEntityContact.id],
    relationName: "requestCustomerContact",
  }),
  
  // Parent request (for follow-ups)
  parentRequest: one(request, {
    fields: [request.parentRequestId],
    references: [request.id],
    relationName: "parentRequest",
  }),
  
  // Child requests (follow-ups)
  childRequests: many(request, {
    relationName: "parentRequest",
  }),
  
  // User relationships
  creator: one(user, {
    fields: [request.createdBy],
    references: [user.id],
    relationName: "requestCreator",
  }),
  updater: one(user, {
    fields: [request.updatedBy],
    references: [user.id],
    relationName: "requestUpdater",
  }),
  approver: one(user, {
    fields: [request.approvedBy],
    references: [user.id],
    relationName: "requestApprover",
  }),
  
  // Child entities
  items: many(requestItem),
  files: many(requestFile),
  notes: many(requestNote),
  teamMembers: many(requestTeamMember),
  activities: many(requestActivity),
  actions: many(requestAction),
  stageTransitions: many(requestStageTransition),
}));

// Request item relations
export const requestItemRelations = relations(requestItem, ({ one, many }) => ({
  request: one(request, {
    fields: [requestItem.requestId],
    references: [request.id],
  }),
  
  creator: one(user, {
    fields: [requestItem.createdBy],
    references: [user.id],
    relationName: "requestItemCreator",
  }),
  updater: one(user, {
    fields: [requestItem.updatedBy],
    references: [user.id],
    relationName: "requestItemUpdater",
  }),
  
  // Related files and notes
  files: many(requestFile),
  notes: many(requestNote),
  activities: many(requestActivity),
}));

// Request file relations
export const requestFileRelations = relations(requestFile, ({ one }) => ({
  request: one(request, {
    fields: [requestFile.requestId],
    references: [request.id],
  }),
  
  requestItem: one(requestItem, {
    fields: [requestFile.requestItemId],
    references: [requestItem.id],
  }),
  
  uploader: one(user, {
    fields: [requestFile.uploadedBy],
    references: [user.id],
    relationName: "requestFileUploader",
  }),
}));

// Request note relations
export const requestNoteRelations = relations(requestNote, ({ one }) => ({
  request: one(request, {
    fields: [requestNote.requestId],
    references: [request.id],
  }),
  
  requestItem: one(requestItem, {
    fields: [requestNote.requestItemId],
    references: [requestItem.id],
  }),
  
  creator: one(user, {
    fields: [requestNote.createdBy],
    references: [user.id],
    relationName: "requestNoteCreator",
  }),
  updater: one(user, {
    fields: [requestNote.updatedBy],
    references: [user.id],
    relationName: "requestNoteUpdater",
  }),
  
  relatedUser: one(user, {
    fields: [requestNote.relatedUserId],
    references: [user.id],
    relationName: "requestNoteRelatedUser",
  }),
  
  relatedContact: one(businessEntityContact, {
    fields: [requestNote.relatedContactId],
    references: [businessEntityContact.id],
    relationName: "requestNoteRelatedContact",
  }),
}));

// Request team member relations
export const requestTeamMemberRelations = relations(requestTeamMember, ({ one }) => ({
  request: one(request, {
    fields: [requestTeamMember.requestId],
    references: [request.id],
  }),
  
  user: one(user, {
    fields: [requestTeamMember.userId],
    references: [user.id],
    relationName: "requestTeamMemberUser",
  }),
  
  assignedByUser: one(user, {
    fields: [requestTeamMember.assignedBy],
    references: [user.id],
    relationName: "requestTeamMemberAssignedBy",
  }),
}));

// Request activity relations
export const requestActivityRelations = relations(requestActivity, ({ one }) => ({
  request: one(request, {
    fields: [requestActivity.requestId],
    references: [request.id],
  }),
  
  requestItem: one(requestItem, {
    fields: [requestActivity.requestItemId],
    references: [requestItem.id],
  }),
  
  performedBy: one(user, {
    fields: [requestActivity.performedBy],
    references: [user.id],
    relationName: "requestActivityPerformedBy",
  }),
}));

// Request action relations
export const requestActionRelations = relations(requestAction, ({ one }) => ({
  request: one(request, {
    fields: [requestAction.requestId],
    references: [request.id],
  }),
  
  performedBy: one(user, {
    fields: [requestAction.performedBy],
    references: [user.id],
    relationName: "requestActionPerformedBy",
  }),
  
  followUpAssignee: one(user, {
    fields: [requestAction.followUpAssignedTo],
    references: [user.id],
    relationName: "requestActionFollowUpAssignee",
  }),
}));

// Request stage transition relations
export const requestStageTransitionRelations = relations(requestStageTransition, ({ one }) => ({
  request: one(request, {
    fields: [requestStageTransition.requestId],
    references: [request.id],
  }),
  
  transitionedBy: one(user, {
    fields: [requestStageTransition.transitionedBy],
    references: [user.id],
    relationName: "requestStageTransitionPerformedBy",
  }),
}));