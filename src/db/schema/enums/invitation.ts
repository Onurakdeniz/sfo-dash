import { pgEnum } from "drizzle-orm/pg-core";

export const invitationTypeEnum = pgEnum("invitation_type", [
  "workspace", 
  "company"
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted", 
  "declined",
  "expired",
  "cancelled"
]);