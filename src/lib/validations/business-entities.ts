import { z } from "zod";
import {
  companyStatusSchema,
  companyTypeSchema,
  type CompanyStatus,
  type CompanyType
} from "@/db/schema/enums/company";
import {
  customerStatusSchema,
  customerTypeSchema,
  customerCategorySchema,
  type CustomerStatus,
  type CustomerType,
  type CustomerCategory
} from "@/db/schema/enums/customer";
import {
  supplierStatusSchema,
  supplierTypeSchema,
  supplierCategorySchema,
  type SupplierStatus,
  type SupplierType,
  type SupplierCategory
} from "@/db/schema/enums/supplier";
import {
  productStatusSchema,
  productTypeSchema,
  productCategorySchema,
  productUnitSchema,
  priceTypeSchema,
  type ProductStatus,
  type ProductType,
  type ProductCategory,
  type ProductUnit,
  type PriceType
} from "@/db/schema/enums/product";
import {
  businessEntityTypeSchema,
  businessEntityStatusSchema,
  businessEntityCategorySchema,
  type BusinessEntityType,
  type BusinessEntityStatus,
  type BusinessEntityCategory
} from "@/db/schema/enums/businessEntity";

// ============================================
// COMPANY VALIDATION SCHEMAS
// ============================================

export const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  fullName: z.string().optional(),
  companyType: companyTypeSchema.optional(),
  status: companyStatusSchema.default("active"),
  industry: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  district: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  taxOffice: z.string().max(100).optional(),
  taxNumber: z.string().max(50).optional(),
  mersisNumber: z.string().max(50).optional(),
  defaultCurrency: z.string().length(3).default("TRY"),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const updateCompanySchema = createCompanySchema.partial();

// ============================================
// CUSTOMER VALIDATION SCHEMAS
// ============================================

export const createCustomerSchema = z.object({
  workspaceId: z.string(),
  companyId: z.string(),
  name: z.string().min(1).max(255),
  fullName: z.string().optional(),
  customerType: customerTypeSchema.default("individual"),
  customerCategory: customerCategorySchema.optional(),
  status: customerStatusSchema.default("active"),
  industry: z.string().max(100).optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  fax: z.string().max(20).optional(),
  address: z.string().optional(),
  district: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  country: z.string().max(100).default("Türkiye"),
  taxOffice: z.string().max(100).optional(),
  taxNumber: z.string().max(50).optional(),
  mersisNumber: z.string().max(50).optional(),
  tradeRegistryNumber: z.string().max(100).optional(),
  defaultCurrency: z.string().length(3).default("TRY"),
  creditLimit: z.number().positive().optional(),
  paymentTerms: z.string().max(100).optional(),
  discountRate: z.number().min(0).max(100).optional(),
  primaryContactName: z.string().max(255).optional(),
  primaryContactTitle: z.string().max(100).optional(),
  primaryContactPhone: z.string().max(20).optional(),
  primaryContactEmail: z.string().email().optional(),
  additionalContacts: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional()
  })).default([]),
  parentCustomerId: z.string().optional(),
  customerGroup: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ============================================
// SUPPLIER VALIDATION SCHEMAS
// ============================================

export const createSupplierSchema = z.object({
  workspaceId: z.string(),
  companyId: z.string(),
  name: z.string().min(1).max(255),
  fullName: z.string().optional(),
  supplierType: supplierTypeSchema.default("individual"),
  supplierCategory: supplierCategorySchema.optional(),
  status: supplierStatusSchema.default("active"),
  industry: z.string().max(100).optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  fax: z.string().max(20).optional(),
  address: z.string().optional(),
  district: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  country: z.string().max(100).default("Türkiye"),
  taxOffice: z.string().max(100).optional(),
  taxNumber: z.string().max(50).optional(),
  mersisNumber: z.string().max(50).optional(),
  tradeRegistryNumber: z.string().max(100).optional(),
  defaultCurrency: z.string().length(3).default("TRY"),
  creditLimit: z.number().positive().optional(),
  paymentTerms: z.string().max(100).optional(),
  discountRate: z.number().min(0).max(100).optional(),
  supplierCode: z.string().max(50).optional(),
  leadTimeDays: z.number().int().positive().optional(),
  minimumOrderQuantity: z.number().int().positive().optional(),
  orderIncrement: z.number().int().positive().optional(),
  qualityRating: z.number().min(0).max(5).optional(),
  deliveryRating: z.number().min(0).max(5).optional(),
  primaryContactName: z.string().max(255).optional(),
  primaryContactTitle: z.string().max(100).optional(),
  primaryContactPhone: z.string().max(20).optional(),
  primaryContactEmail: z.string().email().optional(),
  additionalContacts: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional()
  })).default([]),
  parentSupplierId: z.string().optional(),
  supplierGroup: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ============================================
// PRODUCT VALIDATION SCHEMAS
// ============================================

export const createProductSchema = z.object({
  workspaceId: z.string(),
  companyId: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(100).optional(),
  qrCode: z.string().max(255).optional(),
  productType: productTypeSchema.default("physical"),
  productCategory: productCategorySchema.optional(),
  status: productStatusSchema.default("active"),
  internalCode: z.string().max(100).optional(),
  manufacturerCode: z.string().max(100).optional(),
  supplierCode: z.string().max(100).optional(),
  customsCode: z.string().max(50).optional(),
  unit: productUnitSchema.default("piece"),
  weight: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  volume: z.number().positive().optional(),
  trackInventory: z.boolean().default(true),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().positive().optional(),
  reorderPoint: z.number().int().positive().optional(),
  reorderQuantity: z.number().int().positive().optional(),
  leadTimeDays: z.number().int().positive().optional(),
  basePrice: z.number().positive().optional(),
  currency: z.string().length(3).default("TRY"),
  taxRate: z.number().min(0).max(100).default(18),
  manufacturer: z.string().max(255).optional(),
  brand: z.string().max(255).optional(),
  model: z.string().max(255).optional(),
  countryOfOrigin: z.string().max(100).optional(),
  launchDate: z.string().optional(),
  discontinuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  warrantyPeriod: z.number().int().positive().optional(),
  primaryImageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  documents: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string().optional()
  })).default([]),
  features: z.record(z.any()).default({}),
  specifications: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
  packagingUnit: productUnitSchema.optional(),
  unitsPerPackage: z.number().int().positive().optional(),
  packagesPerPallet: z.number().int().positive().optional(),
  qualityGrade: z.string().max(50).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string().optional(),
    validUntil: z.string().optional(),
    documentUrl: z.string().url().optional()
  })).default([]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([])
});

export const updateProductSchema = createProductSchema.partial();

// ============================================
// BUSINESS ENTITY VALIDATION SCHEMAS
// ============================================

export const createBusinessEntitySchema = z.object({
  workspaceId: z.string(),
  companyId: z.string(),
  entityType: businessEntityTypeSchema,
  name: z.string().min(1).max(255),
  fullName: z.string().optional(),
  logoUrl: z.string().url().optional(),
  entityCategory: businessEntityCategorySchema.optional(),
  businessType: z.enum(["company", "individual", "government"]).default("company"),
  status: businessEntityStatusSchema.default("active"),
  industry: z.string().max(100).optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  fax: z.string().max(20).optional(),
  address: z.string().optional(),
  district: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  country: z.string().max(100).default("Türkiye"),
  taxOffice: z.string().max(100).optional(),
  taxNumber: z.string().max(50).optional(),
  mersisNumber: z.string().max(50).optional(),
  tradeRegistryNumber: z.string().max(100).optional(),
  defaultCurrency: z.string().length(3).default("TRY"),
  creditLimit: z.number().positive().optional(),
  paymentTerms: z.string().max(100).optional(),
  discountRate: z.number().min(0).max(100).optional(),
  entityCode: z.string().max(50).optional(),
  leadTimeDays: z.number().int().positive().optional(),
  minimumOrderQuantity: z.number().int().positive().optional(),
  orderIncrement: z.number().int().positive().optional(),
  qualityRating: z.number().min(0).max(5).optional(),
  deliveryRating: z.number().min(0).max(5).optional(),
  primaryContactName: z.string().max(255).optional(),
  primaryContactTitle: z.string().max(100).optional(),
  primaryContactPhone: z.string().max(20).optional(),
  primaryContactEmail: z.string().email().optional(),
  additionalContacts: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional()
  })).default([]),
  parentEntityId: z.string().optional(),
  entityGroup: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const updateBusinessEntitySchema = createBusinessEntitySchema.partial();

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export type CreateBusinessEntityInput = z.infer<typeof createBusinessEntitySchema>;
export type UpdateBusinessEntityInput = z.infer<typeof updateBusinessEntitySchema>;