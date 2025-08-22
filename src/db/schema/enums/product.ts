import { pgEnum } from "drizzle-orm/pg-core";

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "inactive",
  "draft",
  "discontinued",
  "out_of_stock",
  "coming_soon"
]);

export const productTypeEnum = pgEnum("product_type", [
  "physical", // Physical product
  "service", // Service
  "digital", // Digital product
  "bundle", // Product bundle
  "raw_material", // Raw material
  "consumable" // Consumable item
]);

export const productCategoryEnum = pgEnum("product_category", [
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
]);

export const productUnitEnum = pgEnum("product_unit", [
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
]);

export const priceTypeEnum = pgEnum("price_type", [
  "purchase", // Purchase price
  "selling", // Selling price
  "list", // List price
  "special", // Special price
  "contract", // Contract price
  "promotional" // Promotional price
]);