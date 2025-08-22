import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check, boolean, decimal, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { productStatusEnum, productTypeEnum, productCategoryEnum, productUnitEnum, priceTypeEnum } from "../enums";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";
import { businessEntity } from "./businessEntity";

// Products table - stores product information with comprehensive details
export const product = pgTable('products', {
  /* Core identifier */
  id: text('id').primaryKey(),

  /* Workspace and company association */
  workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'cascade' }).notNull(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),

  /* Basic product information */
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  shortDescription: text('short_description'),
  sku: varchar('sku', { length: 100 }).notNull(), // Stock Keeping Unit
  barcode: varchar('barcode', { length: 100 }),
  qrCode: varchar('qr_code', { length: 255 }),
  
  /* Product classification */
  productType: productTypeEnum('product_type').default('physical').notNull(),
  productCategory: productCategoryEnum('product_category'),
  status: productStatusEnum('status').default('active').notNull(),
  
  /* Product codes and identifiers */
  internalCode: varchar('internal_code', { length: 100 }), // Internal product code
  manufacturerCode: varchar('manufacturer_code', { length: 100 }),
  supplierCode: varchar('supplier_code', { length: 100 }),
  customsCode: varchar('customs_code', { length: 50 }), // GTİP/HS Code
  
  /* Physical properties */
  unit: productUnitEnum('unit').default('piece').notNull(),
  weight: decimal('weight', { precision: 10, scale: 3 }), // Weight in kg
  width: decimal('width', { precision: 10, scale: 2 }), // Width in cm
  height: decimal('height', { precision: 10, scale: 2 }), // Height in cm
  depth: decimal('depth', { precision: 10, scale: 2 }), // Depth in cm
  volume: decimal('volume', { precision: 10, scale: 3 }), // Volume in m3
  
  /* Inventory and stock */
  trackInventory: boolean('track_inventory').default(true).notNull(),
  minStockLevel: integer('min_stock_level').default(0),
  maxStockLevel: integer('max_stock_level'),
  reorderPoint: integer('reorder_point'),
  reorderQuantity: integer('reorder_quantity'),
  leadTimeDays: integer('lead_time_days'), // Average lead time for procurement
  
  /* Pricing information */
  basePrice: decimal('base_price', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default(18), // KDV rate
  
  /* Manufacturing information */
  manufacturer: varchar('manufacturer', { length: 255 }),
  brand: varchar('brand', { length: 255 }),
  model: varchar('model', { length: 255 }),
  countryOfOrigin: varchar('country_of_origin', { length: 100 }),
  
  /* Product lifecycle */
  launchDate: date('launch_date'),
  discontinuedDate: date('discontinued_date'),
  expiryDate: date('expiry_date'),
  warrantyPeriod: integer('warranty_period'), // Warranty in months
  
  /* Images and media */
  primaryImageUrl: text('primary_image_url'),
  images: jsonb('images').default([]), // Array of image URLs
  documents: jsonb('documents').default([]), // Related documents
  
  /* Additional features */
  features: jsonb('features').default({}), // Key-value pairs for product features
  specifications: jsonb('specifications').default({}), // Technical specifications
  tags: jsonb('tags').default([]), // Array of tags
  
  /* Packaging information */
  packagingUnit: productUnitEnum('packaging_unit'),
  unitsPerPackage: integer('units_per_package'),
  packagesPerPallet: integer('packages_per_pallet'),
  
  /* Quality and certification */
  qualityGrade: varchar('quality_grade', { length: 50 }),
  certifications: jsonb('certifications').default([]), // Array of certification details
  
  /* Notes and metadata */
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  metadata: jsonb('metadata'),
  
  /* SEO fields */
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  seoKeywords: jsonb('seo_keywords').default([]),
  
  /* Audit fields */
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  // Performance indexes
  index('products_workspace_company_idx').on(table.workspaceId, table.companyId),
  index('products_name_idx').on(table.name),
  index('products_sku_idx').on(table.sku),
  index('products_barcode_idx').on(table.barcode),
  index('products_status_idx').on(table.status),
  index('products_type_idx').on(table.productType),
  index('products_category_idx').on(table.productCategory),
  index('products_manufacturer_idx').on(table.manufacturer),
  index('products_brand_idx').on(table.brand),
  index('products_created_at_idx').on(table.createdAt),
  index('products_updated_at_idx').on(table.updatedAt),
  
  // Composite indexes
  index('products_status_type_idx').on(table.status, table.productType),
  index('products_category_status_idx').on(table.productCategory, table.status),
  
  // Unique constraints
  unique('products_sku_unique').on(table.workspaceId, table.companyId, table.sku),
  unique('products_barcode_unique').on(table.workspaceId, table.companyId, table.barcode),
  
  // Validation constraints
  check('products_price_check', sql`base_price IS NULL OR base_price >= 0`),
  check('products_tax_rate_check', sql`tax_rate >= 0 AND tax_rate <= 100`),
  check('products_stock_levels_check', sql`min_stock_level >= 0 AND (max_stock_level IS NULL OR max_stock_level >= min_stock_level)`),
]);

// Product variants table - for products with variations (size, color, etc.)
export const productVariant = pgTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => product.id, { onDelete: 'cascade' }).notNull(),
  
  /* Variant identification */
  variantName: varchar('variant_name', { length: 255 }).notNull(),
  variantSku: varchar('variant_sku', { length: 100 }).notNull(),
  variantBarcode: varchar('variant_barcode', { length: 100 }),
  
  /* Variant attributes */
  attributes: jsonb('attributes').default({}), // e.g., { color: "Red", size: "L" }
  
  /* Pricing for this variant */
  price: decimal('price', { precision: 15, scale: 2 }),
  compareAtPrice: decimal('compare_at_price', { precision: 15, scale: 2 }),
  costPrice: decimal('cost_price', { precision: 15, scale: 2 }),
  
  /* Physical properties override */
  weight: decimal('weight', { precision: 10, scale: 3 }),
  width: decimal('width', { precision: 10, scale: 2 }),
  height: decimal('height', { precision: 10, scale: 2 }),
  depth: decimal('depth', { precision: 10, scale: 2 }),
  
  /* Stock specific to variant */
  trackInventory: boolean('track_inventory').default(true),
  stockQuantity: integer('stock_quantity').default(0),
  
  /* Images */
  imageUrl: text('image_url'),
  images: jsonb('images').default([]),
  
  /* Status and ordering */
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0),
  
  /* Metadata */
  metadata: jsonb('metadata'),
  
  /* Audit fields */
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('product_variants_product_idx').on(table.productId),
  index('product_variants_sku_idx').on(table.variantSku),
  index('product_variants_barcode_idx').on(table.variantBarcode),
  index('product_variants_active_idx').on(table.isActive),
  
  unique('product_variants_sku_unique').on(table.productId, table.variantSku),
]);

// Business entity products table - products offered by business entities (suppliers)
export const businessEntityProduct = pgTable('business_entity_products', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').references(() => businessEntity.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').references(() => product.id, { onDelete: 'cascade' }).notNull(),
  
  /* Entity specific codes */
  entitySku: varchar('entity_sku', { length: 100 }),
  entityProductName: varchar('entity_product_name', { length: 255 }),
  
  /* Pricing */
  price: decimal('price', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
  priceValidFrom: date('price_valid_from'),
  priceValidTo: date('price_valid_to'),
  
  /* Supply/Purchase terms */
  minimumOrderQuantity: integer('minimum_order_quantity').default(1),
  orderIncrement: integer('order_increment').default(1),
  leadTimeDays: integer('lead_time_days'),
  
  /* Packaging from entity */
  packagingUnit: productUnitEnum('packaging_unit'),
  unitsPerPackage: integer('units_per_package'),
  
  /* Status and priority */
  isActive: boolean('is_active').default(true).notNull(),
  isPreferred: boolean('is_preferred').default(false).notNull(),
  priority: integer('priority').default(0), // Lower number = higher priority
  
  /* Quality and ratings */
  qualityRating: decimal('quality_rating', { precision: 3, scale: 2 }),
  reliabilityRating: decimal('reliability_rating', { precision: 3, scale: 2 }),
  
  /* Contract information */
  contractNumber: varchar('contract_number', { length: 100 }),
  contractStartDate: date('contract_start_date'),
  contractEndDate: date('contract_end_date'),
  
  /* Notes */
  notes: text('notes'),
  metadata: jsonb('metadata'),
  
  /* Audit fields */
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('business_entity_products_entity_idx').on(table.entityId),
  index('business_entity_products_product_idx').on(table.productId),
  index('business_entity_products_active_idx').on(table.isActive),
  index('business_entity_products_preferred_idx').on(table.isPreferred),
  index('business_entity_products_priority_idx').on(table.priority),
  
  unique('business_entity_products_unique').on(table.entityId, table.productId),
]);

// Product price history table - tracks price changes over time
export const productPriceHistory = pgTable('product_price_history', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => product.id, { onDelete: 'cascade' }).notNull(),
  variantId: text('variant_id').references(() => productVariant.id, { onDelete: 'cascade' }),
  
  /* Price information */
  priceType: priceTypeEnum('price_type').notNull(),
  oldPrice: decimal('old_price', { precision: 15, scale: 2 }),
  newPrice: decimal('new_price', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('TRY').notNull(),
  
  /* Change details */
  changeReason: text('change_reason'),
  changePercentage: decimal('change_percentage', { precision: 5, scale: 2 }),
  
  /* Validity period */
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
  
  /* Related business entity (for purchase/sale prices) */
  entityId: text('entity_id').references(() => businessEntity.id),
  
  /* Metadata */
  metadata: jsonb('metadata'),
  
  /* Audit fields */
  changedBy: text('changed_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('product_price_history_product_idx').on(table.productId),
  index('product_price_history_variant_idx').on(table.variantId),
  index('product_price_history_type_idx').on(table.priceType),
  index('product_price_history_effective_idx').on(table.effectiveFrom),
  index('product_price_history_entity_idx').on(table.entityId),
]);

// Product inventory table - tracks current stock levels
export const productInventory = pgTable('product_inventory', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => product.id, { onDelete: 'cascade' }).notNull(),
  variantId: text('variant_id').references(() => productVariant.id, { onDelete: 'cascade' }),
  
  /* Location information */
  warehouseId: text('warehouse_id'), // Reference to warehouse if applicable
  location: varchar('location', { length: 100 }), // Specific location in warehouse
  
  /* Stock quantities */
  quantityOnHand: integer('quantity_on_hand').default(0).notNull(),
  quantityAvailable: integer('quantity_available').default(0).notNull(), // On hand - reserved
  quantityReserved: integer('quantity_reserved').default(0).notNull(),
  quantityIncoming: integer('quantity_incoming').default(0).notNull(), // On order
  quantityOutgoing: integer('quantity_outgoing').default(0).notNull(), // Committed to orders
  
  /* Stock values */
  averageCost: decimal('average_cost', { precision: 15, scale: 2 }),
  lastPurchasePrice: decimal('last_purchase_price', { precision: 15, scale: 2 }),
  totalValue: decimal('total_value', { precision: 15, scale: 2 }),
  
  /* Last movement dates */
  lastReceivedDate: timestamp('last_received_date'),
  lastSoldDate: timestamp('last_sold_date'),
  lastCountedDate: timestamp('last_counted_date'),
  
  /* Stock alerts */
  lowStockAlert: boolean('low_stock_alert').default(false),
  outOfStockAlert: boolean('out_of_stock_alert').default(false),
  
  /* Batch/Lot information */
  batchNumber: varchar('batch_number', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  expiryDate: date('expiry_date'),
  
  /* Metadata */
  metadata: jsonb('metadata'),
  
  /* Audit fields */
  updatedBy: text('updated_by').references(() => user.id),
  
  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('product_inventory_product_idx').on(table.productId),
  index('product_inventory_variant_idx').on(table.variantId),
  index('product_inventory_warehouse_idx').on(table.warehouseId),
  index('product_inventory_batch_idx').on(table.batchNumber),
  index('product_inventory_expiry_idx').on(table.expiryDate),
  index('product_inventory_low_stock_idx').on(table.lowStockAlert),
  
  unique('product_inventory_unique').on(table.productId, table.variantId, table.warehouseId, table.location),
]);

// Type exports
export type ProductType = typeof product.$inferSelect;
export type ProductVariantType = typeof productVariant.$inferSelect;
export type BusinessEntityProductType = typeof businessEntityProduct.$inferSelect;
export type ProductPriceHistoryType = typeof productPriceHistory.$inferSelect;
export type ProductInventoryType = typeof productInventory.$inferSelect;