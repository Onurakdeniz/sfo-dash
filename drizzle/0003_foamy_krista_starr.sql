CREATE TYPE "public"."price_type" AS ENUM('purchase', 'selling', 'list', 'special', 'contract', 'promotional');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('electronics', 'clothing', 'food_beverage', 'raw_materials', 'office_supplies', 'machinery', 'chemicals', 'packaging', 'tools_equipment', 'furniture', 'medical_supplies', 'automotive', 'construction', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive', 'draft', 'discontinued', 'out_of_stock', 'coming_soon');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('physical', 'service', 'digital', 'bundle', 'raw_material', 'consumable');--> statement-breakpoint
CREATE TYPE "public"."product_unit" AS ENUM('piece', 'kg', 'g', 'ton', 'lt', 'ml', 'm', 'm2', 'm3', 'cm', 'mm', 'box', 'package', 'pallet', 'container', 'hour', 'day', 'month', 'year', 'set', 'roll', 'sheet', 'barrel', 'other');--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"company_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"short_description" text,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"qr_code" varchar(255),
	"product_type" "product_type" DEFAULT 'physical' NOT NULL,
	"product_category" "product_category",
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"internal_code" varchar(100),
	"manufacturer_code" varchar(100),
	"supplier_code" varchar(100),
	"customs_code" varchar(50),
	"unit" "product_unit" DEFAULT 'piece' NOT NULL,
	"weight" numeric(10, 3),
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"depth" numeric(10, 2),
	"volume" numeric(10, 3),
	"track_inventory" boolean DEFAULT true NOT NULL,
	"min_stock_level" integer DEFAULT 0,
	"max_stock_level" integer,
	"reorder_point" integer,
	"reorder_quantity" integer,
	"lead_time_days" integer,
	"base_price" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT 18,
	"manufacturer" varchar(255),
	"brand" varchar(255),
	"model" varchar(255),
	"country_of_origin" varchar(100),
	"launch_date" date,
	"discontinued_date" date,
	"expiry_date" date,
	"warranty_period" integer,
	"primary_image_url" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"documents" jsonb DEFAULT '[]'::jsonb,
	"features" jsonb DEFAULT '{}'::jsonb,
	"specifications" jsonb DEFAULT '{}'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"packaging_unit" "product_unit",
	"units_per_package" integer,
	"packages_per_pallet" integer,
	"quality_grade" varchar(50),
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"internal_notes" text,
	"metadata" jsonb,
	"seo_title" varchar(255),
	"seo_description" text,
	"seo_keywords" jsonb DEFAULT '[]'::jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "products_sku_unique" UNIQUE("workspace_id","company_id","sku"),
	CONSTRAINT "products_barcode_unique" UNIQUE("workspace_id","company_id","barcode"),
	CONSTRAINT "products_price_check" CHECK (base_price IS NULL OR base_price >= 0),
	CONSTRAINT "products_tax_rate_check" CHECK (tax_rate >= 0 AND tax_rate <= 100),
	CONSTRAINT "products_stock_levels_check" CHECK (min_stock_level >= 0 AND (max_stock_level IS NULL OR max_stock_level >= min_stock_level))
);
--> statement-breakpoint
CREATE TABLE "product_inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"warehouse_id" text,
	"location" varchar(100),
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"quantity_available" integer DEFAULT 0 NOT NULL,
	"quantity_reserved" integer DEFAULT 0 NOT NULL,
	"quantity_incoming" integer DEFAULT 0 NOT NULL,
	"quantity_outgoing" integer DEFAULT 0 NOT NULL,
	"average_cost" numeric(15, 2),
	"last_purchase_price" numeric(15, 2),
	"total_value" numeric(15, 2),
	"last_received_date" timestamp,
	"last_sold_date" timestamp,
	"last_counted_date" timestamp,
	"low_stock_alert" boolean DEFAULT false,
	"out_of_stock_alert" boolean DEFAULT false,
	"batch_number" varchar(100),
	"serial_number" varchar(100),
	"expiry_date" date,
	"metadata" jsonb,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_inventory_unique" UNIQUE("product_id","variant_id","warehouse_id","location")
);
--> statement-breakpoint
CREATE TABLE "product_price_history" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"price_type" "price_type" NOT NULL,
	"old_price" numeric(15, 2),
	"new_price" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"change_reason" text,
	"change_percentage" numeric(5, 2),
	"effective_from" timestamp NOT NULL,
	"effective_to" timestamp,
	"supplier_id" text,
	"metadata" jsonb,
	"changed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"variant_name" varchar(255) NOT NULL,
	"variant_sku" varchar(100) NOT NULL,
	"variant_barcode" varchar(100),
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"price" numeric(15, 2),
	"compare_at_price" numeric(15, 2),
	"cost_price" numeric(15, 2),
	"weight" numeric(10, 3),
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"depth" numeric(10, 2),
	"track_inventory" boolean DEFAULT true,
	"stock_quantity" integer DEFAULT 0,
	"image_url" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("product_id","variant_sku")
);
--> statement-breakpoint
CREATE TABLE "supplier_products" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"product_id" text NOT NULL,
	"supplier_sku" varchar(100),
	"supplier_product_name" varchar(255),
	"purchase_price" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"price_valid_from" date,
	"price_valid_to" date,
	"minimum_order_quantity" integer DEFAULT 1,
	"order_increment" integer DEFAULT 1,
	"lead_time_days" integer,
	"supplier_packaging_unit" "product_unit",
	"units_per_supplier_package" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0,
	"quality_rating" numeric(3, 2),
	"reliability_rating" numeric(3, 2),
	"contract_number" varchar(100),
	"contract_start_date" date,
	"contract_end_date" date,
	"notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "supplier_products_unique" UNIQUE("supplier_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_workspace_company_idx" ON "products" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_barcode_idx" ON "products" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_type_idx" ON "products" USING btree ("product_type");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("product_category");--> statement-breakpoint
CREATE INDEX "products_manufacturer_idx" ON "products" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand");--> statement-breakpoint
CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "products_status_type_idx" ON "products" USING btree ("status","product_type");--> statement-breakpoint
CREATE INDEX "products_category_status_idx" ON "products" USING btree ("product_category","status");--> statement-breakpoint
CREATE INDEX "product_inventory_product_idx" ON "product_inventory" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_inventory_variant_idx" ON "product_inventory" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "product_inventory_warehouse_idx" ON "product_inventory" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "product_inventory_batch_idx" ON "product_inventory" USING btree ("batch_number");--> statement-breakpoint
CREATE INDEX "product_inventory_expiry_idx" ON "product_inventory" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "product_inventory_low_stock_idx" ON "product_inventory" USING btree ("low_stock_alert");--> statement-breakpoint
CREATE INDEX "product_price_history_product_idx" ON "product_price_history" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_price_history_variant_idx" ON "product_price_history" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "product_price_history_type_idx" ON "product_price_history" USING btree ("price_type");--> statement-breakpoint
CREATE INDEX "product_price_history_effective_idx" ON "product_price_history" USING btree ("effective_from");--> statement-breakpoint
CREATE INDEX "product_price_history_supplier_idx" ON "product_price_history" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_sku_idx" ON "product_variants" USING btree ("variant_sku");--> statement-breakpoint
CREATE INDEX "product_variants_barcode_idx" ON "product_variants" USING btree ("variant_barcode");--> statement-breakpoint
CREATE INDEX "product_variants_active_idx" ON "product_variants" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "supplier_products_supplier_idx" ON "supplier_products" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_products_product_idx" ON "supplier_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "supplier_products_active_idx" ON "supplier_products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "supplier_products_preferred_idx" ON "supplier_products" USING btree ("is_preferred");--> statement-breakpoint
CREATE INDEX "supplier_products_priority_idx" ON "supplier_products" USING btree ("priority");