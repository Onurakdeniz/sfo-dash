-- Data migration: Convert existing customers and suppliers to business entities

-- Migrate customers to business entities
INSERT INTO business_entities (
    id,
    workspace_id,
    company_id,
    entity_type,
    name,
    full_name,
    logo_url,
    entity_category,
    business_type,
    status,
    industry,
    priority,
    phone,
    email,
    website,
    fax,
    address,
    district,
    city,
    postal_code,
    country,
    tax_office,
    tax_number,
    mersis_number,
    trade_registry_number,
    default_currency,
    credit_limit,
    payment_terms,
    discount_rate,
    customer_code,
    primary_contact_name,
    primary_contact_title,
    primary_contact_phone,
    primary_contact_email,
    parent_entity_id,
    entity_group,
    tags,
    notes,
    internal_notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    workspace_id,
    company_id,
    'customer'::business_entity_type,
    name,
    full_name,
    customer_logo_url,
    CASE 
        WHEN customer_category = 'manufacturer' THEN 'manufacturer'::business_entity_category
        WHEN customer_category = 'distributor' THEN 'distributor'::business_entity_category
        WHEN customer_category = 'reseller' THEN 'reseller'::business_entity_category
        WHEN customer_category = 'service_provider' THEN 'service_provider'::business_entity_category
        WHEN customer_category = 'government' THEN 'government'::business_entity_category
        ELSE 'other'::business_entity_category
    END,
    CASE
        WHEN customer_type = 'individual' THEN 'individual'
        WHEN customer_type = 'corporate' THEN 'company'
        ELSE 'company'
    END,
    CASE
        WHEN status = 'active' THEN 'active'::business_entity_status
        WHEN status = 'inactive' THEN 'inactive'::business_entity_status
        WHEN status = 'pending' THEN 'pending'::business_entity_status
        WHEN status = 'suspended' THEN 'suspended'::business_entity_status
        ELSE 'active'::business_entity_status
    END,
    industry,
    priority,
    phone,
    email,
    website,
    fax,
    address,
    district,
    city,
    postal_code,
    country,
    tax_office,
    tax_number,
    mersis_number,
    trade_registry_number,
    default_currency,
    credit_limit,
    payment_terms,
    discount_rate,
    id, -- Using existing ID as customer code
    primary_contact_name,
    primary_contact_title,
    primary_contact_phone,
    primary_contact_email,
    parent_customer_id,
    customer_group,
    tags,
    notes,
    internal_notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
FROM customers
WHERE NOT EXISTS (
    SELECT 1 FROM business_entities WHERE business_entities.id = customers.id
);

-- Migrate suppliers to business entities
INSERT INTO business_entities (
    id,
    workspace_id,
    company_id,
    entity_type,
    name,
    full_name,
    logo_url,
    entity_category,
    business_type,
    status,
    industry,
    priority,
    phone,
    email,
    website,
    fax,
    address,
    district,
    city,
    postal_code,
    country,
    tax_office,
    tax_number,
    mersis_number,
    trade_registry_number,
    default_currency,
    credit_limit,
    payment_terms,
    discount_rate,
    supplier_code,
    lead_time_days,
    minimum_order_quantity,
    order_increment,
    quality_rating,
    delivery_rating,
    primary_contact_name,
    primary_contact_title,
    primary_contact_phone,
    primary_contact_email,
    parent_entity_id,
    entity_group,
    tags,
    notes,
    internal_notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    workspace_id,
    company_id,
    'supplier'::business_entity_type,
    name,
    full_name,
    supplier_logo_url,
    CASE 
        WHEN supplier_category = 'manufacturer' THEN 'manufacturer'::business_entity_category
        WHEN supplier_category = 'distributor' THEN 'distributor'::business_entity_category
        WHEN supplier_category = 'reseller' THEN 'reseller'::business_entity_category
        WHEN supplier_category = 'service_provider' THEN 'service_provider'::business_entity_category
        WHEN supplier_category = 'government' THEN 'government'::business_entity_category
        ELSE 'other'::business_entity_category
    END,
    CASE
        WHEN supplier_type = 'individual' THEN 'individual'
        WHEN supplier_type = 'corporate' THEN 'company'
        ELSE 'company'
    END,
    CASE
        WHEN status = 'active' THEN 'active'::business_entity_status
        WHEN status = 'inactive' THEN 'inactive'::business_entity_status
        WHEN status = 'pending' THEN 'pending'::business_entity_status
        WHEN status = 'suspended' THEN 'suspended'::business_entity_status
        ELSE 'active'::business_entity_status
    END,
    industry,
    priority,
    phone,
    email,
    website,
    fax,
    address,
    district,
    city,
    postal_code,
    country,
    tax_office,
    tax_number,
    mersis_number,
    trade_registry_number,
    default_currency,
    credit_limit,
    payment_terms,
    discount_rate,
    supplier_code,
    lead_time_days,
    minimum_order_quantity,
    order_increment,
    quality_rating,
    delivery_rating,
    primary_contact_name,
    primary_contact_title,
    primary_contact_phone,
    primary_contact_email,
    parent_supplier_id,
    supplier_group,
    tags,
    notes,
    internal_notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
FROM suppliers
WHERE NOT EXISTS (
    SELECT 1 FROM business_entities WHERE business_entities.id = suppliers.id
);

-- Migrate customer addresses
INSERT INTO business_entity_addresses (
    id,
    entity_id,
    address_type,
    title,
    address,
    district,
    city,
    postal_code,
    country,
    phone,
    email,
    contact_name,
    contact_title,
    is_default,
    is_active,
    notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    customer_id,
    address_type,
    title,
    address,
    district,
    city,
    postal_code,
    country,
    phone,
    email,
    contact_name,
    contact_title,
    is_default,
    is_active,
    notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
FROM customer_addresses
WHERE NOT EXISTS (
    SELECT 1 FROM business_entity_addresses WHERE business_entity_addresses.id = customer_addresses.id
);

-- Migrate supplier addresses
INSERT INTO business_entity_addresses (
    id,
    entity_id,
    address_type,
    title,
    address,
    district,
    city,
    postal_code,
    country,
    phone,
    email,
    contact_name,
    contact_title,
    is_default,
    is_active,
    notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    supplier_id,
    address_type,
    title,
    address,
    district,
    city,
    postal_code,
    country,
    phone,
    email,
    contact_name,
    contact_title,
    is_default,
    is_active,
    notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
FROM supplier_addresses
WHERE NOT EXISTS (
    SELECT 1 FROM business_entity_addresses WHERE business_entity_addresses.id = supplier_addresses.id
);

-- Migrate customer contacts
INSERT INTO business_entity_contacts (
    id,
    entity_id,
    first_name,
    last_name,
    title,
    department,
    phone,
    mobile,
    email,
    fax,
    role,
    is_primary,
    is_active,
    notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    customer_id,
    first_name,
    last_name,
    title,
    department,
    phone,
    mobile,
    email,
    fax,
    role,
    is_primary,
    is_active,
    notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
FROM customer_contacts
WHERE NOT EXISTS (
    SELECT 1 FROM business_entity_contacts WHERE business_entity_contacts.id = customer_contacts.id
);

-- Migrate supplier contacts
INSERT INTO business_entity_contacts (
    id,
    entity_id,
    first_name,
    last_name,
    title,
    department,
    phone,
    mobile,
    email,
    fax,
    role,
    is_primary,
    is_active,
    notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    supplier_id,
    first_name,
    last_name,
    title,
    department,
    phone,
    mobile,
    email,
    fax,
    role,
    is_primary,
    is_active,
    notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
FROM supplier_contacts
WHERE NOT EXISTS (
    SELECT 1 FROM business_entity_contacts WHERE business_entity_contacts.id = supplier_contacts.id
);

-- Migrate customer files
INSERT INTO business_entity_files (
    id,
    entity_id,
    name,
    category,
    blob_url,
    blob_path,
    content_type,
    size,
    description,
    metadata,
    uploaded_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    customer_id,
    name,
    category,
    blob_url,
    blob_path,
    content_type,
    size,
    description,
    metadata,
    uploaded_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
FROM customer_files
WHERE NOT EXISTS (
    SELECT 1 FROM business_entity_files WHERE business_entity_files.id = customer_files.id
);

-- Migrate supplier files
INSERT INTO business_entity_files (
    id,
    entity_id,
    name,
    category,
    blob_url,
    blob_path,
    content_type,
    size,
    description,
    metadata,
    uploaded_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    supplier_id,
    name,
    category,
    blob_url,
    blob_path,
    content_type,
    size,
    description,
    metadata,
    uploaded_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
FROM supplier_files
WHERE NOT EXISTS (
    SELECT 1 FROM business_entity_files WHERE business_entity_files.id = supplier_files.id
);

-- Create remaining order-related tables
CREATE TABLE IF NOT EXISTS "order_items" (
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
    CONSTRAINT "order_items_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "order_items_customer_price_check" CHECK ("customer_unit_price" >= 0)
);

CREATE TABLE IF NOT EXISTS "order_status_history" (
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

CREATE TABLE IF NOT EXISTS "order_documents" (
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

CREATE TABLE IF NOT EXISTS "order_payments" (
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
    CONSTRAINT "order_payments_amount_check" CHECK ("amount" > 0)
);

-- Add missing tables for business entities
CREATE TABLE IF NOT EXISTS "business_entity_files" (
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

CREATE TABLE IF NOT EXISTS "business_entity_notes" (
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

CREATE TABLE IF NOT EXISTS "business_entity_performance" (
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
    "deleted_at" timestamp
);

-- Add foreign key constraints for the new tables
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "order_documents" ADD CONSTRAINT "order_documents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_documents" ADD CONSTRAINT "order_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "business_entity_files" ADD CONSTRAINT "business_entity_files_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "business_entities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "business_entity_files" ADD CONSTRAINT "business_entity_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_entity_files" ADD CONSTRAINT "business_entity_files_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "business_entity_notes" ADD CONSTRAINT "business_entity_notes_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "business_entities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "business_entity_notes" ADD CONSTRAINT "business_entity_notes_related_contact_id_business_entity_contacts_id_fk" FOREIGN KEY ("related_contact_id") REFERENCES "business_entity_contacts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_entity_notes" ADD CONSTRAINT "business_entity_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_entity_notes" ADD CONSTRAINT "business_entity_notes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "business_entity_performance" ADD CONSTRAINT "business_entity_performance_entity_id_business_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "business_entities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "business_entity_performance" ADD CONSTRAINT "business_entity_performance_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_entity_performance" ADD CONSTRAINT "business_entity_performance_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes for remaining tables
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "order_status_history_order_idx" ON "order_status_history" ("order_id");
CREATE INDEX IF NOT EXISTS "order_documents_order_idx" ON "order_documents" ("order_id");
CREATE INDEX IF NOT EXISTS "order_payments_order_idx" ON "order_payments" ("order_id");
CREATE INDEX IF NOT EXISTS "business_entity_files_entity_idx" ON "business_entity_files" ("entity_id");
CREATE INDEX IF NOT EXISTS "business_entity_notes_entity_idx" ON "business_entity_notes" ("entity_id");
CREATE INDEX IF NOT EXISTS "business_entity_performance_entity_idx" ON "business_entity_performance" ("entity_id");

-- Create unique constraints
ALTER TABLE "business_entity_performance" ADD CONSTRAINT "business_entity_performance_unique_period" UNIQUE("entity_id", "period_start", "period_end", "period_type");
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_entity_code_unique" UNIQUE("workspace_id", "company_id", "entity_code");
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_supplier_code_unique" UNIQUE("workspace_id", "company_id", "supplier_code");
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_customer_code_unique" UNIQUE("workspace_id", "company_id", "customer_code");
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_number_unique" UNIQUE("workspace_id", "company_id", "order_number");