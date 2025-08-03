import { pgEnum } from "drizzle-orm/pg-core";

export const workspaceMemberRoleEnum = pgEnum("workspace_member_role", [
  "owner",
  "admin", 
  "member",
  "viewer"
]);