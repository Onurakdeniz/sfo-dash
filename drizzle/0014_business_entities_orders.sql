-- Create business entity enums
CREATE TYPE "business_entity_type" AS ENUM ('supplier', 'customer', 'both');
CREATE TYPE "business_entity_status" AS ENUM ('active', 'inactive', 'pending', 'suspended', 'blocked');
CREATE TYPE "business_entity_category" AS ENUM ('manufacturer', 'distributor', 'reseller', 'service_provider', 'government', 'defense_contractor', 'sub_contractor', 'consultant', 'logistics', 'other');

-- Create order enums
CREATE TYPE "order_status" AS ENUM ('draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'on_hold');
CREATE TYPE "order_type" AS ENUM ('standard', 'urgent', 'sample', 'replacement', 'warranty', 'government', 'export');
CREATE TYPE "order_priority" AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
CREATE TYPE "payment_status" AS ENUM ('pending', 'partial', 'paid', 'overdue', 'refunded', 'cancelled');
CREATE TYPE "delivery_status" AS ENUM ('pending', 'preparing', 'ready', 'shipped', 'in_transit', 'delivered', 'failed', 'returned');
CREATE TYPE "order_source" AS ENUM ('direct', 'website', 'email', 'phone', 'talep', 'exhibition', 'referral');

-- Create business entities table
CREATE TABLE IF NOT EXISTS "business_entities" (
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
    "certifications" jsonb DEFAULT '[]',
    "primary_contact_name" varchar(255),
    "primary_contact_title" varchar(100),
    "primary_contact_phone" varchar(20),
    "primary_contact_email" varchar(255),
    "parent_entity_id" text,
    "entity_group" varchar(100),
    "tags" jsonb DEFAULT '[]',
    "notes" text,
    "internal_notes" text,
    "metadata" jsonb,
    "created_by" text,
    "updated_by" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "deleted_at" timestamp
);

-- Create business entity related tables
CREATE TABLE IF NOT EXISTS "business_entity_addresses" (
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
    "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "business_entity_contacts" (
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
    "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "business_entity_activities" (
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
    "attachments" jsonb DEFAULT '[]',
    "metadata" jsonb,
    "performed_by" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS "orders" (
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
    "tags" jsonb DEFAULT '[]',
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
    "deleted_at" timestamp
);

-- Add foreign key constraints
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "business_entity_addresses" ADD CONSTRAINT "business_entity_addresses_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "business_entities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "business_entity_addresses" ADD CONSTRAINT "business_entity_addresses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_entity_addresses" ADD CONSTRAINT "business_entity_addresses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "business_entity_contacts" ADD CONSTRAINT "business_entity_contacts_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "business_entities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "business_entity_contacts" ADD CONSTRAINT "business_entity_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_entity_contacts" ADD CONSTRAINT "business_entity_contacts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "business_entity_activities" ADD CONSTRAINT "business_entity_activities_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "business_entities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "business_entity_activities" ADD CONSTRAINT "business_entity_activities_contact_id_business_entity_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "business_entity_contacts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_entity_activities" ADD CONSTRAINT "business_entity_activities_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "orders" ADD CONSTRAINT "orders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_business_entities_id_fk" FOREIGN KEY ("customer_id") REFERENCES "business_entities"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_business_entities_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "business_entities"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_talep_id_talep_id_fk" FOREIGN KEY ("talep_id") REFERENCES "talep"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Update talep table to use business entities
ALTER TABLE "talep" RENAME COLUMN "customer_id" TO "entity_id";
ALTER TABLE "talep" RENAME COLUMN "customer_contact_id" TO "entity_contact_id";
ALTER TABLE "talep" DROP CONSTRAINT IF EXISTS "talep_customer_id_customers_id_fk";
ALTER TABLE "talep" DROP CONSTRAINT IF EXISTS "talep_customer_contact_id_customer_contacts_id_fk";
ALTER TABLE "talep" ADD CONSTRAINT "talep_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "business_entities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "talep" ADD CONSTRAINT "talep_entity_contact_id_business_entity_contacts_id_fk" FOREIGN KEY ("entity_contact_id") REFERENCES "business_entity_contacts"("id") ON DELETE set null ON UPDATE no action;

-- Update talep_notes table
ALTER TABLE "talep_notes" RENAME COLUMN "is_visible_to_customer" TO "is_visible_to_entity";

-- Update talep_files table
ALTER TABLE "talep_files" RENAME COLUMN "is_visible_to_customer" TO "is_visible_to_entity";

-- Update products related tables
ALTER TABLE "supplier_products" RENAME TO "business_entity_products";
ALTER TABLE "business_entity_products" RENAME COLUMN "supplier_id" TO "entity_id";
ALTER TABLE "business_entity_products" RENAME COLUMN "supplier_sku" TO "entity_sku";
ALTER TABLE "business_entity_products" RENAME COLUMN "supplier_product_name" TO "entity_product_name";
ALTER TABLE "business_entity_products" RENAME COLUMN "purchase_price" TO "price";
ALTER TABLE "business_entity_products" RENAME COLUMN "supplier_packaging_unit" TO "packaging_unit";
ALTER TABLE "business_entity_products" RENAME COLUMN "units_per_supplier_package" TO "units_per_package";

ALTER TABLE "business_entity_products" DROP CONSTRAINT IF EXISTS "supplier_products_supplier_id_suppliers_id_fk";
ALTER TABLE "business_entity_products" ADD CONSTRAINT "business_entity_products_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "business_entities"("id") ON DELETE cascade ON UPDATE no action;

-- Update product_price_history table
ALTER TABLE "product_price_history" RENAME COLUMN "supplier_id" TO "entity_id";
ALTER TABLE "product_price_history" DROP CONSTRAINT IF EXISTS "product_price_history_supplier_id_suppliers_id_fk";
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "business_entities"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes
CREATE INDEX IF NOT EXISTS "business_entities_workspace_company_idx" ON "business_entities" ("workspace_id","company_id");
CREATE INDEX IF NOT EXISTS "business_entities_entity_type_idx" ON "business_entities" ("entity_type");
CREATE INDEX IF NOT EXISTS "business_entities_name_idx" ON "business_entities" ("name");
CREATE INDEX IF NOT EXISTS "business_entities_status_idx" ON "business_entities" ("status");
CREATE INDEX IF NOT EXISTS "business_entities_type_status_idx" ON "business_entities" ("entity_type","status");

CREATE INDEX IF NOT EXISTS "orders_workspace_company_idx" ON "orders" ("workspace_id","company_id");
CREATE INDEX IF NOT EXISTS "orders_order_number_idx" ON "orders" ("order_number");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders" ("customer_id");
CREATE INDEX IF NOT EXISTS "orders_supplier_idx" ON "orders" ("supplier_id");