import { z } from "zod";

// Product status values
export const PRODUCT_STATUS = [
  "active",
  "inactive",
  "draft",
  "discontinued",
  "out_of_stock",
  "coming_soon"
] as const;

// Product type values
export const PRODUCT_TYPE = [
  "physical", // Physical product
  "service", // Service
  "digital", // Digital product
  "bundle", // Product bundle
  "raw_material", // Raw material
  "consumable" // Consumable item
] as const;

// Product category values
export const PRODUCT_CATEGORY = [
  "electronics",
  "clothing",
  "food_beverage",
  "raw_materials",
  "office_supplies",
  "machinery",
  "chemicals",
  "packaging",
  "tools_equipment",
  "furniture",
  "medical_supplies",
  "automotive",
  "construction",
  "other"
] as const;

// Product unit values
export const PRODUCT_UNIT = [
  "piece", // Adet
  "kg", // Kilogram
  "g", // Gram
  "ton", // Ton
  "lt", // Litre
  "ml", // Mililitre
  "m", // Metre
  "m2", // Metrekare
  "m3", // Metreküp
  "cm", // Santimetre
  "mm", // Milimetre
  "box", // Kutu
  "package", // Paket
  "pallet", // Palet
  "container", // Konteyner
  "hour", // Saat
  "day", // Gün
  "month", // Ay
  "year", // Yıl
  "set", // Set/Takım
  "roll", // Rulo
  "sheet", // Tabaka
  "barrel", // Varil
  "other" // Diğer
] as const;

// Price type values
export const PRICE_TYPE = [
  "purchase", // Purchase price
  "selling", // Selling price
  "list", // List price
  "special", // Special price
  "contract", // Contract price
  "promotional" // Promotional price
] as const;

// Zod schemas
export const productStatusSchema = z.enum(PRODUCT_STATUS);
export const productTypeSchema = z.enum(PRODUCT_TYPE);
export const productCategorySchema = z.enum(PRODUCT_CATEGORY);
export const productUnitSchema = z.enum(PRODUCT_UNIT);
export const priceTypeSchema = z.enum(PRICE_TYPE);

// Type exports
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type ProductType = z.infer<typeof productTypeSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type ProductUnit = z.infer<typeof productUnitSchema>;
export type PriceType = z.infer<typeof priceTypeSchema>;
