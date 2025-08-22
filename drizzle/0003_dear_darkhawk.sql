CREATE TYPE "public"."price_type" AS ENUM('purchase', 'selling', 'list', 'special', 'contract', 'promotional');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('electronics', 'clothing', 'food_beverage', 'raw_materials', 'office_supplies', 'machinery', 'chemicals', 'packaging', 'tools_equipment', 'furniture', 'medical_supplies', 'automotive', 'construction', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive', 'draft', 'discontinued', 'out_of_stock', 'coming_soon');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('physical', 'service', 'digital', 'bundle', 'raw_material', 'consumable');--> statement-breakpoint
CREATE TYPE "public"."product_unit" AS ENUM('piece', 'kg', 'g', 'ton', 'lt', 'ml', 'm', 'm2', 'm3', 'cm', 'mm', 'box', 'package', 'pallet', 'container', 'hour', 'day', 'month', 'year', 'set', 'roll', 'sheet', 'barrel', 'other');--> statement-breakpoint
CREATE TYPE "public"."business_entity_category" AS ENUM('manufacturer', 'distributor', 'reseller', 'service_provider', 'government', 'defense_contractor', 'sub_contractor', 'consultant', 'logistics', 'other');--> statement-breakpoint
CREATE TYPE "public"."business_entity_status" AS ENUM('active', 'inactive', 'pending', 'suspended', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."business_entity_type" AS ENUM('supplier', 'customer', 'both');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'preparing', 'ready', 'shipped', 'in_transit', 'delivered', 'failed', 'returned');--> statement-breakpoint
CREATE TYPE "public"."order_priority" AS ENUM('low', 'medium', 'high', 'urgent', 'critical');--> statement-breakpoint
CREATE TYPE "public"."order_source" AS ENUM('direct', 'website', 'email', 'phone', 'talep', 'exhibition', 'referral');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('standard', 'urgent', 'sample', 'replacement', 'warranty', 'government', 'export');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'partial', 'paid', 'overdue', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TABLE "business_entities" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"company_id" text NOT NULL,
	"entity_type" "business_entity_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" text,
	"logo_url" text,
	"entity_category" "business_entity_category",
	"business_type" varchar(50) DEFAULT 'company' NOT NULL,
	"status" "business_entity_status" DEFAULT 'active' NOT NULL,
	"industry" varchar(100),
	"priority" varchar(20) DEFAULT 'medium',
	"phone" varchar(20),
	"email" varchar(255),
	"website" varchar(255),
	"fax" varchar(20),
	"address" text,
	"district" varchar(100),
	"city" varchar(100),
	"postal_code" varchar(10),
	"country" varchar(100) DEFAULT 'Türkiye' NOT NULL,
	"tax_office" varchar(100),
	"tax_number" varchar(50),
	"mersis_number" varchar(50),
	"trade_registry_number" varchar(100),
	"default_currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"credit_limit" numeric(15, 2),
	"payment_terms" varchar(100),
	"discount_rate" numeric(5, 2),
	"entity_code" varchar(50),
	"supplier_code" varchar(50),
	"customer_code" varchar(50),
	"lead_time_days" integer,
	"minimum_order_quantity" integer,
	"order_increment" integer,
	"quality_rating" numeric(3, 2),
	"delivery_rating" numeric(3, 2),
	"defense_contractor" boolean DEFAULT false,
	"export_license" boolean DEFAULT false,
	"security_clearance" varchar(50),
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"primary_contact_name" varchar(255),
	"primary_contact_title" varchar(100),
	"primary_contact_phone" varchar(20),
	"primary_contact_email" varchar(255),
	"parent_entity_id" text,
	"entity_group" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"internal_notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "business_entities_entity_code_unique" UNIQUE("workspace_id","company_id","entity_code"),
	CONSTRAINT "business_entities_supplier_code_unique" UNIQUE("workspace_id","company_id","supplier_code"),
	CONSTRAINT "business_entities_customer_code_unique" UNIQUE("workspace_id","company_id","customer_code")
);
--> statement-breakpoint
CREATE TABLE "business_entity_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"activity_type" varchar(100) NOT NULL,
	"activity_category" varchar(50),
	"title" varchar(255) NOT NULL,
	"description" text,
	"activity_date" timestamp DEFAULT now() NOT NULL,
	"duration" integer,
	"outcome" varchar(100),
	"contact_id" text,
	"related_order_id" text,
	"related_talep_id" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_notes" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"performed_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_entity_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"address_type" varchar(50) DEFAULT 'billing' NOT NULL,
	"title" varchar(100),
	"address" text NOT NULL,
	"district" varchar(100),
	"city" varchar(100),
	"postal_code" varchar(10),
	"country" varchar(100) DEFAULT 'Türkiye' NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"contact_name" varchar(255),
	"contact_title" varchar(100),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "business_entity_addresses_email_check" CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	CONSTRAINT "business_entity_addresses_phone_check" CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
	CONSTRAINT "business_entity_addresses_postal_code_check" CHECK (postal_code IS NULL OR postal_code ~* '^[0-9]{5}$')
);
--> statement-breakpoint
CREATE TABLE "business_entity_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"title" varchar(100),
	"department" varchar(100),
	"phone" varchar(20),
	"mobile" varchar(20),
	"email" varchar(255),
	"fax" varchar(20),
	"role" varchar(50),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "business_entity_contacts_email_check" CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	CONSTRAINT "business_entity_contacts_phone_check" CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
	CONSTRAINT "business_entity_contacts_mobile_check" CHECK (mobile IS NULL OR mobile ~* '^\+?[1-9]\d{1,14}$'),
	CONSTRAINT "business_entity_contacts_fax_check" CHECK (fax IS NULL OR fax ~* '^\+?[1-9]\d{1,14}$')
);
--> statement-breakpoint
CREATE TABLE "business_entity_files" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"blob_url" text NOT NULL,
	"blob_path" text,
	"content_type" varchar(255),
	"size" integer DEFAULT 0 NOT NULL,
	"description" text,
	"metadata" jsonb,
	"uploaded_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "business_entity_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"title" varchar(255),
	"content" text NOT NULL,
	"note_type" varchar(50) DEFAULT 'general',
	"is_internal" boolean DEFAULT false NOT NULL,
	"priority" varchar(20) DEFAULT 'medium',
	"related_contact_id" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "business_entity_performance" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"period_type" varchar(20) DEFAULT 'monthly' NOT NULL,
	"on_time_delivery_rate" numeric(5, 2),
	"quality_rating" numeric(3, 2),
	"response_time_hours" numeric(5, 2),
	"order_fulfillment_rate" numeric(5, 2),
	"total_orders" integer DEFAULT 0,
	"total_order_value" numeric(15, 2),
	"average_order_value" numeric(15, 2),
	"payment_on_time_rate" numeric(5, 2),
	"quality_issues" integer DEFAULT 0,
	"delivery_issues" integer DEFAULT 0,
	"communication_issues" integer DEFAULT 0,
	"payment_issues" integer DEFAULT 0,
	"overall_score" numeric(5, 2),
	"notes" text,
	"metadata" jsonb,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "business_entity_performance_unique_period" UNIQUE("entity_id","period_start","period_end","period_type")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"workspace_id" text NOT NULL,
	"company_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"order_type" "order_type" DEFAULT 'standard' NOT NULL,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"priority" "order_priority" DEFAULT 'medium' NOT NULL,
	"order_source" "order_source" DEFAULT 'direct' NOT NULL,
	"customer_id" text NOT NULL,
	"customer_po_number" varchar(100),
	"supplier_id" text,
	"supplier_so_number" varchar(100),
	"talep_id" text,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"expected_delivery_date" timestamp,
	"actual_delivery_date" timestamp,
	"deadline_date" timestamp,
	"customer_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"customer_subtotal" numeric(15, 2) NOT NULL,
	"customer_tax_amount" numeric(15, 2) DEFAULT 0,
	"customer_discount_amount" numeric(15, 2) DEFAULT 0,
	"customer_shipping_amount" numeric(15, 2) DEFAULT 0,
	"customer_total_amount" numeric(15, 2) NOT NULL,
	"supplier_currency" varchar(3) DEFAULT 'USD',
	"supplier_subtotal" numeric(15, 2),
	"supplier_tax_amount" numeric(15, 2),
	"supplier_discount_amount" numeric(15, 2),
	"supplier_shipping_amount" numeric(15, 2),
	"supplier_total_amount" numeric(15, 2),
	"profit_margin" numeric(5, 2),
	"profit_amount" numeric(15, 2),
	"customer_payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"customer_payment_terms" varchar(100),
	"customer_payment_due_date" timestamp,
	"supplier_payment_status" "payment_status" DEFAULT 'pending',
	"supplier_payment_terms" varchar(100),
	"supplier_payment_due_date" timestamp,
	"delivery_status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"shipping_method" varchar(100),
	"tracking_number" varchar(255),
	"billing_address_id" text,
	"shipping_address_id" text,
	"export_controlled" boolean DEFAULT false,
	"export_license_number" varchar(100),
	"end_user_certificate" boolean DEFAULT false,
	"end_user_certificate_number" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"public_notes" text,
	"internal_notes" text,
	"created_by" text,
	"updated_by" text,
	"approved_by" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp,
	"completed_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "orders_order_number_unique" UNIQUE("workspace_id","company_id","order_number"),
	CONSTRAINT "orders_customer_total_check" CHECK (customer_total_amount >= 0),
	CONSTRAINT "orders_supplier_total_check" CHECK (supplier_total_amount IS NULL OR supplier_total_amount >= 0),
	CONSTRAINT "orders_profit_margin_check" CHECK (profit_margin IS NULL OR (profit_margin >= -100 AND profit_margin <= 1000))
);
--> statement-breakpoint
CREATE TABLE "order_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"blob_url" text NOT NULL,
	"blob_path" text,
	"content_type" varchar(255),
	"size" integer DEFAULT 0 NOT NULL,
	"document_number" varchar(100),
	"document_date" date,
	"is_customer_visible" boolean DEFAULT false NOT NULL,
	"is_supplier_document" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_code" varchar(100),
	"product_name" varchar(255) NOT NULL,
	"product_description" text,
	"manufacturer" varchar(255),
	"part_number" varchar(100),
	"quantity" numeric(15, 3) NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'piece' NOT NULL,
	"customer_unit_price" numeric(15, 2) NOT NULL,
	"customer_discount_percent" numeric(5, 2) DEFAULT 0,
	"customer_discount_amount" numeric(15, 2) DEFAULT 0,
	"customer_tax_rate" numeric(5, 2) DEFAULT 0,
	"customer_tax_amount" numeric(15, 2) DEFAULT 0,
	"customer_line_total" numeric(15, 2) NOT NULL,
	"supplier_unit_price" numeric(15, 2),
	"supplier_discount_percent" numeric(5, 2),
	"supplier_discount_amount" numeric(15, 2),
	"supplier_tax_rate" numeric(5, 2),
	"supplier_tax_amount" numeric(15, 2),
	"supplier_line_total" numeric(15, 2),
	"item_profit_margin" numeric(5, 2),
	"item_profit_amount" numeric(15, 2),
	"specifications" jsonb,
	"certification_required" jsonb,
	"export_controlled" boolean DEFAULT false,
	"status" varchar(50) DEFAULT 'pending',
	"delivered_quantity" numeric(15, 3) DEFAULT 0,
	"notes" text,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_check" CHECK (quantity > 0),
	CONSTRAINT "order_items_customer_price_check" CHECK (customer_unit_price >= 0),
	CONSTRAINT "order_items_supplier_price_check" CHECK (supplier_unit_price IS NULL OR supplier_unit_price >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"payment_type" varchar(50) NOT NULL,
	"payment_method" varchar(50),
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"transaction_id" varchar(255),
	"transaction_date" timestamp NOT NULL,
	"reference_number" varchar(100),
	"bank_name" varchar(255),
	"account_number" varchar(100),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"processed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_payments_amount_check" CHECK (amount > 0)
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"reason" text,
	"notes" text,
	"related_document_url" text,
	"metadata" jsonb,
	"changed_by" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_entity_products" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"product_id" text NOT NULL,
	"entity_sku" varchar(100),
	"entity_product_name" varchar(255),
	"price" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"price_valid_from" date,
	"price_valid_to" date,
	"minimum_order_quantity" integer DEFAULT 1,
	"order_increment" integer DEFAULT 1,
	"lead_time_days" integer,
	"packaging_unit" "product_unit",
	"units_per_package" integer,
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
	CONSTRAINT "business_entity_products_unique" UNIQUE("entity_id","product_id")
);
--> statement-breakpoint
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
	"entity_id" text,
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
ALTER TABLE "talep" RENAME COLUMN "customer_id" TO "entity_id";--> statement-breakpoint
ALTER TABLE "talep" RENAME COLUMN "customer_contact_id" TO "entity_contact_id";--> statement-breakpoint
ALTER TABLE "talep_files" RENAME COLUMN "is_visible_to_customer" TO "is_visible_to_entity";--> statement-breakpoint
ALTER TABLE "talep_notes" RENAME COLUMN "is_visible_to_customer" TO "is_visible_to_entity";--> statement-breakpoint
ALTER TABLE "talep" DROP CONSTRAINT "talep_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "talep" DROP CONSTRAINT "talep_customer_contact_id_customer_contacts_id_fk";
--> statement-breakpoint
DROP INDEX "talep_customer_idx";--> statement-breakpoint
DROP INDEX "talep_customer_contact_idx";--> statement-breakpoint
DROP INDEX "talep_customer_status_idx";--> statement-breakpoint
DROP INDEX "talep_customer_type_idx";--> statement-breakpoint
DROP INDEX "talep_files_visible_customer_idx";--> statement-breakpoint
DROP INDEX "talep_notes_visible_customer_idx";--> statement-breakpoint
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_activities" ADD CONSTRAINT "business_entity_activities_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_activities" ADD CONSTRAINT "business_entity_activities_contact_id_business_entity_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."business_entity_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_activities" ADD CONSTRAINT "business_entity_activities_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_addresses" ADD CONSTRAINT "business_entity_addresses_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_addresses" ADD CONSTRAINT "business_entity_addresses_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_addresses" ADD CONSTRAINT "business_entity_addresses_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_contacts" ADD CONSTRAINT "business_entity_contacts_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_contacts" ADD CONSTRAINT "business_entity_contacts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_contacts" ADD CONSTRAINT "business_entity_contacts_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_files" ADD CONSTRAINT "business_entity_files_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_files" ADD CONSTRAINT "business_entity_files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_files" ADD CONSTRAINT "business_entity_files_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_notes" ADD CONSTRAINT "business_entity_notes_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_notes" ADD CONSTRAINT "business_entity_notes_related_contact_id_business_entity_contacts_id_fk" FOREIGN KEY ("related_contact_id") REFERENCES "public"."business_entity_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_notes" ADD CONSTRAINT "business_entity_notes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_notes" ADD CONSTRAINT "business_entity_notes_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_performance" ADD CONSTRAINT "business_entity_performance_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_performance" ADD CONSTRAINT "business_entity_performance_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_performance" ADD CONSTRAINT "business_entity_performance_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_business_entities_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."business_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_business_entities_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."business_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_talep_id_talep_id_fk" FOREIGN KEY ("talep_id") REFERENCES "public"."talep"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_documents" ADD CONSTRAINT "order_documents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_documents" ADD CONSTRAINT "order_documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_products" ADD CONSTRAINT "business_entity_products_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_products" ADD CONSTRAINT "business_entity_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_products" ADD CONSTRAINT "business_entity_products_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entity_products" ADD CONSTRAINT "business_entity_products_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_entities_workspace_company_idx" ON "business_entities" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "business_entities_entity_type_idx" ON "business_entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "business_entities_name_idx" ON "business_entities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "business_entities_email_idx" ON "business_entities" USING btree ("email");--> statement-breakpoint
CREATE INDEX "business_entities_phone_idx" ON "business_entities" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "business_entities_status_idx" ON "business_entities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "business_entities_business_type_idx" ON "business_entities" USING btree ("business_type");--> statement-breakpoint
CREATE INDEX "business_entities_category_idx" ON "business_entities" USING btree ("entity_category");--> statement-breakpoint
CREATE INDEX "business_entities_priority_idx" ON "business_entities" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "business_entities_parent_idx" ON "business_entities" USING btree ("parent_entity_id");--> statement-breakpoint
CREATE INDEX "business_entities_industry_idx" ON "business_entities" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "business_entities_city_idx" ON "business_entities" USING btree ("city");--> statement-breakpoint
CREATE INDEX "business_entities_entity_group_idx" ON "business_entities" USING btree ("entity_group");--> statement-breakpoint
CREATE INDEX "business_entities_entity_code_idx" ON "business_entities" USING btree ("entity_code");--> statement-breakpoint
CREATE INDEX "business_entities_supplier_code_idx" ON "business_entities" USING btree ("supplier_code");--> statement-breakpoint
CREATE INDEX "business_entities_customer_code_idx" ON "business_entities" USING btree ("customer_code");--> statement-breakpoint
CREATE INDEX "business_entities_created_by_idx" ON "business_entities" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "business_entities_created_at_idx" ON "business_entities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "business_entities_updated_at_idx" ON "business_entities" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "business_entities_type_status_idx" ON "business_entities" USING btree ("entity_type","status");--> statement-breakpoint
CREATE INDEX "business_entities_priority_status_idx" ON "business_entities" USING btree ("priority","status");--> statement-breakpoint
CREATE INDEX "business_entities_industry_status_idx" ON "business_entities" USING btree ("industry","status");--> statement-breakpoint
CREATE INDEX "business_entity_activities_entity_idx" ON "business_entity_activities" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "business_entity_activities_type_idx" ON "business_entity_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "business_entity_activities_category_idx" ON "business_entity_activities" USING btree ("activity_category");--> statement-breakpoint
CREATE INDEX "business_entity_activities_date_idx" ON "business_entity_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "business_entity_activities_performed_by_idx" ON "business_entity_activities" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "business_entity_activities_follow_up_idx" ON "business_entity_activities" USING btree ("follow_up_required","follow_up_date");--> statement-breakpoint
CREATE INDEX "business_entity_addresses_entity_idx" ON "business_entity_addresses" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "business_entity_addresses_type_idx" ON "business_entity_addresses" USING btree ("address_type");--> statement-breakpoint
CREATE INDEX "business_entity_addresses_default_idx" ON "business_entity_addresses" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "business_entity_addresses_active_idx" ON "business_entity_addresses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "business_entity_contacts_entity_idx" ON "business_entity_contacts" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "business_entity_contacts_email_idx" ON "business_entity_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "business_entity_contacts_phone_idx" ON "business_entity_contacts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "business_entity_contacts_role_idx" ON "business_entity_contacts" USING btree ("role");--> statement-breakpoint
CREATE INDEX "business_entity_contacts_primary_idx" ON "business_entity_contacts" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "business_entity_contacts_active_idx" ON "business_entity_contacts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "business_entity_files_entity_idx" ON "business_entity_files" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "business_entity_files_category_idx" ON "business_entity_files" USING btree ("category");--> statement-breakpoint
CREATE INDEX "business_entity_files_created_at_idx" ON "business_entity_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "business_entity_notes_entity_idx" ON "business_entity_notes" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "business_entity_notes_type_idx" ON "business_entity_notes" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "business_entity_notes_created_by_idx" ON "business_entity_notes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "business_entity_notes_created_at_idx" ON "business_entity_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "business_entity_performance_entity_idx" ON "business_entity_performance" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "business_entity_performance_period_idx" ON "business_entity_performance" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "business_entity_performance_type_idx" ON "business_entity_performance" USING btree ("period_type");--> statement-breakpoint
CREATE INDEX "business_entity_performance_score_idx" ON "business_entity_performance" USING btree ("overall_score");--> statement-breakpoint
CREATE INDEX "business_entity_performance_created_at_idx" ON "business_entity_performance" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_workspace_company_idx" ON "orders" USING btree ("workspace_id","company_id");--> statement-breakpoint
CREATE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_type_idx" ON "orders" USING btree ("order_type");--> statement-breakpoint
CREATE INDEX "orders_priority_idx" ON "orders" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_supplier_idx" ON "orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "orders_talep_idx" ON "orders" USING btree ("talep_id");--> statement-breakpoint
CREATE INDEX "orders_order_date_idx" ON "orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "orders_expected_delivery_idx" ON "orders" USING btree ("expected_delivery_date");--> statement-breakpoint
CREATE INDEX "orders_customer_payment_status_idx" ON "orders" USING btree ("customer_payment_status");--> statement-breakpoint
CREATE INDEX "orders_supplier_payment_status_idx" ON "orders" USING btree ("supplier_payment_status");--> statement-breakpoint
CREATE INDEX "orders_delivery_status_idx" ON "orders" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX "orders_created_by_idx" ON "orders" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_customer_status_idx" ON "orders" USING btree ("customer_id","status");--> statement-breakpoint
CREATE INDEX "orders_supplier_status_idx" ON "orders" USING btree ("supplier_id","status");--> statement-breakpoint
CREATE INDEX "orders_status_date_idx" ON "orders" USING btree ("status","order_date");--> statement-breakpoint
CREATE INDEX "order_documents_order_idx" ON "order_documents" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_documents_type_idx" ON "order_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "order_documents_customer_visible_idx" ON "order_documents" USING btree ("is_customer_visible");--> statement-breakpoint
CREATE INDEX "order_documents_created_at_idx" ON "order_documents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_code_idx" ON "order_items" USING btree ("product_code");--> statement-breakpoint
CREATE INDEX "order_items_status_idx" ON "order_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_items_sort_order_idx" ON "order_items" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "order_payments_order_idx" ON "order_payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_payments_type_idx" ON "order_payments" USING btree ("payment_type");--> statement-breakpoint
CREATE INDEX "order_payments_status_idx" ON "order_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_payments_transaction_date_idx" ON "order_payments" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "order_status_history_order_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_to_status_idx" ON "order_status_history" USING btree ("to_status");--> statement-breakpoint
CREATE INDEX "order_status_history_changed_at_idx" ON "order_status_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "order_status_history_changed_by_idx" ON "order_status_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "business_entity_products_entity_idx" ON "business_entity_products" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "business_entity_products_product_idx" ON "business_entity_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "business_entity_products_active_idx" ON "business_entity_products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "business_entity_products_preferred_idx" ON "business_entity_products" USING btree ("is_preferred");--> statement-breakpoint
CREATE INDEX "business_entity_products_priority_idx" ON "business_entity_products" USING btree ("priority");--> statement-breakpoint
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
CREATE INDEX "product_price_history_entity_idx" ON "product_price_history" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_sku_idx" ON "product_variants" USING btree ("variant_sku");--> statement-breakpoint
CREATE INDEX "product_variants_barcode_idx" ON "product_variants" USING btree ("variant_barcode");--> statement-breakpoint
CREATE INDEX "product_variants_active_idx" ON "product_variants" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."business_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_entity_contact_id_business_entity_contacts_id_fk" FOREIGN KEY ("entity_contact_id") REFERENCES "public"."business_entity_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "talep_entity_idx" ON "talep" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "talep_entity_contact_idx" ON "talep" USING btree ("entity_contact_id");--> statement-breakpoint
CREATE INDEX "talep_entity_status_idx" ON "talep" USING btree ("entity_id","status");--> statement-breakpoint
CREATE INDEX "talep_entity_type_idx" ON "talep" USING btree ("entity_id","type");--> statement-breakpoint
CREATE INDEX "talep_files_visible_entity_idx" ON "talep_files" USING btree ("is_visible_to_entity");--> statement-breakpoint
CREATE INDEX "talep_notes_visible_entity_idx" ON "talep_notes" USING btree ("is_visible_to_entity");