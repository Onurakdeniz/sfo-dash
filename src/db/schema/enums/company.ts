import { pgEnum } from "drizzle-orm/pg-core";

export const companyStatusEnum = pgEnum("company_status", [
  "active", 
  "inactive", 
  "onboarding", 
  "suspended", 
  "lead"
]);