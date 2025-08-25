-- Migration Script: Consolidate Customers and Suppliers into BusinessEntity
-- This script migrates existing customer and supplier data to the unified business_entities table

-- Start transaction
BEGIN;

-- ============================================
-- STEP 1: Migrate Customers to BusinessEntity
-- ============================================

-- Migrate customer records to business_entities
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
    c.id,
    c.workspace_id,
    c.company_id,
    'customer'::business_entity_type as entity_type,
    c.name,
    c.full_name,
    c.customer_logo_url as logo_url,
    CASE 
        WHEN c.customer_category = 'vip' THEN 'other'::business_entity_category
        WHEN c.customer_category = 'premium' THEN 'other'::business_entity_category
        WHEN c.customer_category = 'regular' THEN 'other'::business_entity_category
        WHEN c.customer_category = 'potential' THEN 'other'::business_entity_category
        ELSE 'other'::business_entity_category
    END as entity_category,
    CASE 
        WHEN c.customer_type = 'individual' THEN 'individual'
        WHEN c.customer_type = 'corporate' THEN 'company'
        ELSE 'company'
    END as business_type,
    c.status::business_entity_status,
    c.industry,
    c.priority,
    c.phone,
    c.email,
    c.website,
    c.fax,
    c.address,
    c.district,
    c.city,
    c.postal_code,
    c.country,
    c.tax_office,
    c.tax_number,
    c.mersis_number,
    c.trade_registry_number,
    c.default_currency,
    c.credit_limit,
    c.payment_terms,
    c.discount_rate,
    c.id as customer_code, -- Using ID as customer code for now
    c.primary_contact_name,
    c.primary_contact_title,
    c.primary_contact_phone,
    c.primary_contact_email,
    c.parent_customer_id as parent_entity_id,
    c.customer_group as entity_group,
    c.tags,
    c.notes,
    c.internal_notes,
    c.metadata,
    c.created_by,
    c.updated_by,
    c.created_at,
    c.updated_at,
    c.deleted_at
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM business_entities be WHERE be.id = c.id
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
    ca.id,
    ca.customer_id as entity_id,
    ca.address_type,
    ca.title,
    ca.address,
    ca.district,
    ca.city,
    ca.postal_code,
    ca.country,
    ca.phone,
    ca.email,
    ca.contact_name,
    ca.contact_title,
    ca.is_default,
    ca.is_active,
    ca.notes,
    ca.metadata,
    ca.created_by,
    ca.updated_by,
    ca.created_at,
    ca.updated_at,
    ca.deleted_at
FROM customer_addresses ca
WHERE EXISTS (SELECT 1 FROM business_entities be WHERE be.id = ca.customer_id)
AND NOT EXISTS (SELECT 1 FROM business_entity_addresses bea WHERE bea.id = ca.id);

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
    cc.id,
    cc.customer_id as entity_id,
    cc.first_name,
    cc.last_name,
    cc.title,
    cc.department,
    cc.phone,
    cc.mobile,
    cc.email,
    cc.fax,
    cc.role,
    cc.is_primary,
    cc.is_active,
    cc.notes,
    cc.metadata,
    cc.created_by,
    cc.updated_by,
    cc.created_at,
    cc.updated_at,
    cc.deleted_at
FROM customer_contacts cc
WHERE EXISTS (SELECT 1 FROM business_entities be WHERE be.id = cc.customer_id)
AND NOT EXISTS (SELECT 1 FROM business_entity_contacts bec WHERE bec.id = cc.id);

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
    cf.id,
    cf.customer_id as entity_id,
    cf.name,
    cf.category,
    cf.blob_url,
    cf.blob_path,
    cf.content_type,
    cf.size,
    cf.description,
    cf.metadata,
    cf.uploaded_by,
    cf.updated_by,
    cf.created_at,
    cf.updated_at,
    cf.deleted_at
FROM customer_files cf
WHERE EXISTS (SELECT 1 FROM business_entities be WHERE be.id = cf.customer_id)
AND NOT EXISTS (SELECT 1 FROM business_entity_files bef WHERE bef.id = cf.id);

-- Migrate customer notes
INSERT INTO business_entity_notes (
    id,
    entity_id,
    title,
    content,
    note_type,
    is_internal,
    priority,
    related_contact_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    cn.id,
    cn.customer_id as entity_id,
    cn.title,
    cn.content,
    cn.note_type,
    cn.is_internal,
    cn.priority,
    cn.related_contact_id,
    cn.created_by,
    cn.updated_by,
    cn.created_at,
    cn.updated_at,
    cn.deleted_at
FROM customer_notes cn
WHERE EXISTS (SELECT 1 FROM business_entities be WHERE be.id = cn.customer_id)
AND NOT EXISTS (SELECT 1 FROM business_entity_notes ben WHERE ben.id = cn.id);

-- ============================================
-- STEP 2: Migrate Suppliers to BusinessEntity
-- ============================================

-- Migrate supplier records to business_entities
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
    s.id,
    s.workspace_id,
    s.company_id,
    'supplier'::business_entity_type as entity_type,
    s.name,
    s.full_name,
    s.supplier_logo_url as logo_url,
    CASE 
        WHEN s.supplier_category = 'strategic' THEN 'manufacturer'::business_entity_category
        WHEN s.supplier_category = 'preferred' THEN 'distributor'::business_entity_category
        WHEN s.supplier_category = 'approved' THEN 'reseller'::business_entity_category
        WHEN s.supplier_category = 'probationary' THEN 'other'::business_entity_category
        WHEN s.supplier_category = 'blacklisted' THEN 'other'::business_entity_category
        ELSE 'other'::business_entity_category
    END as entity_category,
    CASE 
        WHEN s.supplier_type = 'individual' THEN 'individual'
        WHEN s.supplier_type = 'corporate' THEN 'company'
        ELSE 'company'
    END as business_type,
    s.status::business_entity_status,
    s.industry,
    s.priority,
    s.phone,
    s.email,
    s.website,
    s.fax,
    s.address,
    s.district,
    s.city,
    s.postal_code,
    s.country,
    s.tax_office,
    s.tax_number,
    s.mersis_number,
    s.trade_registry_number,
    s.default_currency,
    s.credit_limit,
    s.payment_terms,
    s.discount_rate,
    s.supplier_code,
    s.lead_time_days,
    s.minimum_order_quantity,
    s.order_increment,
    s.quality_rating,
    s.delivery_rating,
    s.primary_contact_name,
    s.primary_contact_title,
    s.primary_contact_phone,
    s.primary_contact_email,
    s.parent_supplier_id as parent_entity_id,
    s.supplier_group as entity_group,
    s.tags,
    s.notes,
    s.internal_notes,
    s.metadata,
    s.created_by,
    s.updated_by,
    s.created_at,
    s.updated_at,
    s.deleted_at
FROM suppliers s
WHERE NOT EXISTS (
    SELECT 1 FROM business_entities be WHERE be.id = s.id
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
    sa.id,
    sa.supplier_id as entity_id,
    sa.address_type,
    sa.title,
    sa.address,
    sa.district,
    sa.city,
    sa.postal_code,
    sa.country,
    sa.phone,
    sa.email,
    sa.contact_name,
    sa.contact_title,
    sa.is_default,
    sa.is_active,
    sa.notes,
    sa.metadata,
    sa.created_by,
    sa.updated_by,
    sa.created_at,
    sa.updated_at,
    sa.deleted_at
FROM supplier_addresses sa
WHERE EXISTS (SELECT 1 FROM business_entities be WHERE be.id = sa.supplier_id)
AND NOT EXISTS (SELECT 1 FROM business_entity_addresses bea WHERE bea.id = sa.id);

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
    sc.id,
    sc.supplier_id as entity_id,
    sc.first_name,
    sc.last_name,
    sc.title,
    sc.department,
    sc.phone,
    sc.mobile,
    sc.email,
    sc.fax,
    sc.role,
    sc.is_primary,
    sc.is_active,
    sc.notes,
    sc.metadata,
    sc.created_by,
    sc.updated_by,
    sc.created_at,
    sc.updated_at,
    sc.deleted_at
FROM supplier_contacts sc
WHERE EXISTS (SELECT 1 FROM business_entities be WHERE be.id = sc.supplier_id)
AND NOT EXISTS (SELECT 1 FROM business_entity_contacts bec WHERE bec.id = sc.id);

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
    sf.id,
    sf.supplier_id as entity_id,
    sf.name,
    sf.category,
    sf.blob_url,
    sf.blob_path,
    sf.content_type,
    sf.size,
    sf.description,
    sf.metadata,
    sf.uploaded_by,
    sf.updated_by,
    sf.created_at,
    sf.updated_at,
    sf.deleted_at
FROM supplier_files sf
WHERE EXISTS (SELECT 1 FROM business_entities be WHERE be.id = sf.supplier_id)
AND NOT EXISTS (SELECT 1 FROM business_entity_files bef WHERE bef.id = sf.id);

-- Migrate supplier notes
INSERT INTO business_entity_notes (
    id,
    entity_id,
    title,
    content,
    note_type,
    is_internal,
    priority,
    related_contact_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    sn.id,
    sn.supplier_id as entity_id,
    sn.title,
    sn.content,
    sn.note_type,
    sn.is_internal,
    sn.priority,
    sn.related_contact_id,
    sn.created_by,
    sn.updated_by,
    sn.created_at,
    sn.updated_at,
    sn.deleted_at
FROM supplier_notes sn
WHERE EXISTS (SELECT 1 FROM business_entities be WHERE be.id = sn.supplier_id)
AND NOT EXISTS (SELECT 1 FROM business_entity_notes ben WHERE ben.id = sn.id);

-- Migrate supplier performance
INSERT INTO business_entity_performance (
    id,
    entity_id,
    period_start,
    period_end,
    period_type,
    on_time_delivery_rate,
    quality_rating,
    response_time_hours,
    order_fulfillment_rate,
    total_orders,
    total_order_value,
    average_order_value,
    quality_issues,
    delivery_issues,
    communication_issues,
    overall_score,
    notes,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    sp.id,
    sp.supplier_id as entity_id,
    sp.period_start,
    sp.period_end,
    sp.period_type,
    sp.on_time_delivery_rate,
    sp.quality_rating,
    sp.response_time_hours,
    sp.order_fulfillment_rate,
    sp.total_orders,
    sp.total_order_value,
    sp.average_order_value,
    sp.quality_issues,
    sp.delivery_issues,
    sp.communication_issues,
    sp.overall_score,
    sp.notes,
    sp.metadata,
    sp.created_by,
    sp.updated_by,
    sp.created_at,
    sp.updated_at,
    sp.deleted_at
FROM supplier_performance sp
WHERE EXISTS (SELECT 1 FROM business_entities be WHERE be.id = sp.supplier_id)
AND NOT EXISTS (SELECT 1 FROM business_entity_performance bep WHERE bep.id = sp.id);

-- ============================================
-- STEP 3: Check for entities that are both customer and supplier
-- ============================================

-- Update entities that appear in both tables to have entity_type = 'both'
UPDATE business_entities 
SET entity_type = 'both'
WHERE id IN (
    SELECT c.id 
    FROM customers c
    INNER JOIN suppliers s ON c.id = s.id
);

-- ============================================
-- STEP 4: Create views for backward compatibility (optional)
-- ============================================

-- Create view for customers
CREATE OR REPLACE VIEW v_customers AS
SELECT 
    be.*,
    be.logo_url as customer_logo_url,
    CASE 
        WHEN be.business_type = 'individual' THEN 'individual'::customer_type
        ELSE 'corporate'::customer_type
    END as customer_type,
    be.entity_group as customer_group,
    be.parent_entity_id as parent_customer_id
FROM business_entities be
WHERE be.entity_type IN ('customer', 'both');

-- Create view for suppliers
CREATE OR REPLACE VIEW v_suppliers AS
SELECT 
    be.*,
    be.logo_url as supplier_logo_url,
    CASE 
        WHEN be.business_type = 'individual' THEN 'individual'::supplier_type
        ELSE 'corporate'::supplier_type
    END as supplier_type,
    be.entity_group as supplier_group,
    be.parent_entity_id as parent_supplier_id
FROM business_entities be
WHERE be.entity_type IN ('supplier', 'both');

-- ============================================
-- STEP 5: Add comments for documentation
-- ============================================

COMMENT ON TABLE business_entities IS 'Unified table for all business entities (customers, suppliers, or both)';
COMMENT ON COLUMN business_entities.entity_type IS 'Determines if entity is a customer, supplier, or both';
COMMENT ON VIEW v_customers IS 'Compatibility view for customer queries - references business_entities';
COMMENT ON VIEW v_suppliers IS 'Compatibility view for supplier queries - references business_entities';

-- Commit transaction
COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run these after migration)
-- ============================================

-- Check migration success
-- SELECT 'Customers migrated:' as info, COUNT(*) as count FROM business_entities WHERE entity_type IN ('customer', 'both');
-- SELECT 'Suppliers migrated:' as info, COUNT(*) as count FROM business_entities WHERE entity_type IN ('supplier', 'both');
-- SELECT 'Dual entities (both):' as info, COUNT(*) as count FROM business_entities WHERE entity_type = 'both';

-- Check for any unmigrated records
-- SELECT 'Unmigrated customers:' as info, COUNT(*) as count FROM customers c WHERE NOT EXISTS (SELECT 1 FROM business_entities be WHERE be.id = c.id);
-- SELECT 'Unmigrated suppliers:' as info, COUNT(*) as count FROM suppliers s WHERE NOT EXISTS (SELECT 1 FROM business_entities be WHERE be.id = s.id);