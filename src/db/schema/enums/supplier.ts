import { z } from "zod";

// Supplier status values
export const SUPPLIER_STATUS = [
  "active",
  "inactive",
  "prospect",
  "suspended",
  "blacklisted",
  "closed"
] as const;

// Supplier type values
export const SUPPLIER_TYPE = [
  "individual", // Bireysel tedarikçi
  "corporate" // Kurumsal tedarikçi
] as const;

// Supplier category values
export const SUPPLIER_CATEGORY = [
  "strategic", // Stratejik tedarikçi
  "preferred", // Tercih edilen tedarikçi
  "approved", // Onaylı tedarikçi
  "standard", // Standart tedarikçi
  "new", // Yeni tedarikçi
  "temporary" // Geçici tedarikçi
] as const;

// Zod schemas
export const supplierStatusSchema = z.enum(SUPPLIER_STATUS);
export const supplierTypeSchema = z.enum(SUPPLIER_TYPE);
export const supplierCategorySchema = z.enum(SUPPLIER_CATEGORY);

// Type exports
export type SupplierStatus = z.infer<typeof supplierStatusSchema>;
export type SupplierType = z.infer<typeof supplierTypeSchema>;
export type SupplierCategory = z.infer<typeof supplierCategorySchema>;

// Utility functions
export const getSupplierStatuses = (): SupplierStatus[] => [...SUPPLIER_STATUS];
export const getSupplierTypes = (): SupplierType[] => [...SUPPLIER_TYPE];
export const getSupplierCategories = (): SupplierCategory[] => [...SUPPLIER_CATEGORY];

// Validation helper
export const validateSupplierData = (data: unknown) => {
  const SupplierDataSchema = z.object({
    status: supplierStatusSchema,
    supplierType: supplierTypeSchema,
    supplierCategory: supplierCategorySchema.optional()
  });

  return SupplierDataSchema.safeParse(data);
};
