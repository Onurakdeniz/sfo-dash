import { relations } from "drizzle-orm";
import { user } from "./user";
import { workspaces, workspaceCompanies, workspaceMembers } from "./workspace";
import { companies, departments } from "./company";
import { session, account } from "./auth";

export const userRelations = relations(user, ({ many, one }) => ({
    sessions: many(session),
    accounts: many(account),
    ownedWorkspaces: many(workspaces),
    workspaceMemberships: many(workspaceMembers),
    manager: one(user, {
        fields: [user.managerId],
        references: [user.id],
        relationName: "userManager",
    }),
    subordinates: many(user, {
        relationName: "userManager",
    }),
}));

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
    owner: one(user, {
        fields: [workspaces.ownerId],
        references: [user.id],
    }),
    members: many(workspaceMembers),
    companies: many(workspaceCompanies),
    departments: many(departments),
}));

export const companyRelations = relations(companies, ({ many }) => ({
    workspaces: many(workspaceCompanies),
    departments: many(departments),
}));

export const workspaceCompanyRelations = relations(workspaceCompanies, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [workspaceCompanies.workspaceId],
        references: [workspaces.id],
    }),
    company: one(companies, {
        fields: [workspaceCompanies.companyId],
        references: [companies.id],
    }),
    addedByUser: one(user, {
        fields: [workspaceCompanies.addedBy],
        references: [user.id],
    }),
}));

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [workspaceMembers.workspaceId],
        references: [workspaces.id],
    }),
    user: one(user, {
        fields: [workspaceMembers.userId],
        references: [user.id],
    }),
    invitedByUser: one(user, {
        fields: [workspaceMembers.invitedBy],
        references: [user.id],
    }),
}));

export const departmentRelations = relations(departments, ({ one }) => ({
    company: one(companies, {
        fields: [departments.companyId],
        references: [companies.id],
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