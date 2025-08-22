import { pgEnum } from "drizzle-orm/pg-core";

// Entity type enum - determines if entity is supplier, customer, or both
export const businessEntityTypeEnum = pgEnum("business_entity_type", [
  "supplier",
  "customer",
  "both" // Entity can act as both supplier and customer
]);

// Entity status enum
export const businessEntityStatusEnum = pgEnum("business_entity_status", [
  "active",
  "inactive",
  "pending",
  "suspended",
  "blocked"
]);

// Entity category enum - for defense industry categorization
export const businessEntityCategoryEnum = pgEnum("business_entity_category", [
  "manufacturer",
  "distributor",
  "reseller",
  "service_provider",
  "government",
  "defense_contractor",
  "sub_contractor",
  "consultant",
  "logistics",
  "other"
]);