import { z } from 'zod';

// ============================================
// BUSINESS ENTITY TYPE
// ============================================

// Business entity type values
export const BUSINESS_ENTITY_TYPE = [
  "supplier",
  "customer",
  "both"
] as const;

// Business entity status values
export const BUSINESS_ENTITY_STATUS = [
  "active",
  "inactive",
  "pending",
  "suspended",
  "blocked"
] as const;

// Business entity category values
export const BUSINESS_ENTITY_CATEGORY = [
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
] as const;

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Business entity type - determines if entity is supplier, customer, or both
 */
export const businessEntityTypeSchema = z.enum(BUSINESS_ENTITY_TYPE);

/**
 * Business entity status
 */
export const businessEntityStatusSchema = z.enum(BUSINESS_ENTITY_STATUS);

/**
 * Business entity category - for defense industry categorization
 */
export const businessEntityCategorySchema = z.enum(BUSINESS_ENTITY_CATEGORY);

// ============================================
// TYPE EXPORTS
// ============================================

export type BusinessEntityType = z.infer<typeof businessEntityTypeSchema>;
export type BusinessEntityStatus = z.infer<typeof businessEntityStatusSchema>;
export type BusinessEntityCategory = z.infer<typeof businessEntityCategorySchema>;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all possible business entity types
 */
export const getBusinessEntityTypes = (): BusinessEntityType[] => [...BUSINESS_ENTITY_TYPE];

/**
 * Get all possible business entity statuses
 */
export const getBusinessEntityStatuses = (): BusinessEntityStatus[] => [...BUSINESS_ENTITY_STATUS];

/**
 * Get all possible business entity categories
 */
export const getBusinessEntityCategories = (): BusinessEntityCategory[] => [...BUSINESS_ENTITY_CATEGORY];

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate business entity data using Zod schemas
 */
export const validateBusinessEntityData = (data: unknown) => {
  const BusinessEntityDataSchema = z.object({
    entityType: businessEntityTypeSchema,
    status: businessEntityStatusSchema,
    entityCategory: businessEntityCategorySchema.optional()
  });

  return BusinessEntityDataSchema.safeParse(data);
};

/**
 * Serialize business entity data to JSON-compatible format
 */
export const serializeBusinessEntity = (entity: {
  entityType: BusinessEntityType;
  status: BusinessEntityStatus;
  entityCategory?: BusinessEntityCategory;
}) => {
  // Since we're using enums, the data is already JSON-compatible
  return {
    entityType: entity.entityType,
    status: entity.status,
    entityCategory: entity.entityCategory
  };
};