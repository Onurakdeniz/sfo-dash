import { z } from 'zod';
import { pgEnum } from "drizzle-orm/pg-core";

// ============================================
// DATABASE ENUMS (for backward compatibility)
// ============================================

/**
 * @deprecated Database-level enum. Consider migrating to text/varchar columns with Zod validation.
 */
export const businessEntityTypeEnum = pgEnum("business_entity_type", [
  "supplier",
  "customer",
  "both"
]);

/**
 * @deprecated Database-level enum. Consider migrating to text/varchar columns with Zod validation.
 */
export const businessEntityStatusEnum = pgEnum("business_entity_status", [
  "active",
  "inactive",
  "pending",
  "suspended",
  "blocked"
]);

/**
 * @deprecated Database-level enum. Consider migrating to text/varchar columns with Zod validation.
 */
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

// ============================================
// BUSINESS ENTITY TYPE SCHEMA
// ============================================

/**
 * Business entity type - determines if entity is supplier, customer, or both
 * Using Zod literal union for JSON-compatible enum values
 */
export const BusinessEntityTypeSchema = z.union([
  z.literal("supplier"),
  z.literal("customer"),
  z.literal("both") // Entity can act as both supplier and customer
]);

export type BusinessEntityType = z.infer<typeof BusinessEntityTypeSchema>;

// ============================================
// BUSINESS ENTITY STATUS SCHEMA
// ============================================

/**
 * Business entity status
 * Using Zod literal union for JSON-compatible enum values
 */
export const BusinessEntityStatusSchema = z.union([
  z.literal("active"),
  z.literal("inactive"),
  z.literal("pending"),
  z.literal("suspended"),
  z.literal("blocked")
]);

export type BusinessEntityStatus = z.infer<typeof BusinessEntityStatusSchema>;

// ============================================
// BUSINESS ENTITY CATEGORY SCHEMA
// ============================================

/**
 * Business entity category - for defense industry categorization
 * Using Zod literal union for JSON-compatible enum values
 */
export const BusinessEntityCategorySchema = z.union([
  z.literal("manufacturer"),
  z.literal("distributor"),
  z.literal("reseller"),
  z.literal("service_provider"),
  z.literal("government"),
  z.literal("defense_contractor"),
  z.literal("sub_contractor"),
  z.literal("consultant"),
  z.literal("logistics"),
  z.literal("other")
]);

export type BusinessEntityCategory = z.infer<typeof BusinessEntityCategorySchema>;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all possible business entity types
 */
export const getBusinessEntityTypes = (): BusinessEntityType[] => [
  "supplier",
  "customer",
  "both"
];

/**
 * Get all possible business entity statuses
 */
export const getBusinessEntityStatuses = (): BusinessEntityStatus[] => [
  "active",
  "inactive",
  "pending",
  "suspended",
  "blocked"
];

/**
 * Get all possible business entity categories
 */
export const getBusinessEntityCategories = (): BusinessEntityCategory[] => [
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
];

// ============================================
// VALIDATION EXAMPLES
// ============================================

/**
 * Example: Validate business entity data using Zod schemas
 */
export const validateBusinessEntityData = (data: unknown) => {
  const BusinessEntityDataSchema = z.object({
    entityType: BusinessEntityTypeSchema,
    status: BusinessEntityStatusSchema,
    entityCategory: BusinessEntityCategorySchema.optional()
  });

  return BusinessEntityDataSchema.safeParse(data);
};

/**
 * Example: Serialize business entity data to JSON-compatible format
 */
export const serializeBusinessEntity = (entity: {
  entityType: BusinessEntityType;
  status: BusinessEntityStatus;
  entityCategory?: BusinessEntityCategory;
}) => {
  // Since we're using literal unions, the data is already JSON-compatible
  return {
    entityType: entity.entityType,
    status: entity.status,
    entityCategory: entity.entityCategory
  };
};