# Migration Guide: Customers & Suppliers to BusinessEntity

## Overview
This guide documents the migration from separate `customers` and `suppliers` tables to the unified `businessEntity` table structure.

## Current State Analysis

### Issues with Current Implementation
1. **Duplicate Structures**: We have both a unified `businessEntity` table AND separate `customer`/`supplier` tables
2. **Inconsistent Usage**: Some tables (orders, talep) use `businessEntity`, while others still reference the old tables
3. **Redundant Code**: Maintaining three separate table structures for essentially the same entity type

### Tables Being Deprecated
- `customers` → Use `businessEntity` with `entityType='customer'`
- `suppliers` → Use `businessEntity` with `entityType='supplier'`
- `customer_addresses` → Use `business_entity_addresses`
- `supplier_addresses` → Use `business_entity_addresses`
- `customer_contacts` → Use `business_entity_contacts`
- `supplier_contacts` → Use `business_entity_contacts`
- `customer_files` → Use `business_entity_files`
- `supplier_files` → Use `business_entity_files`
- `customer_notes` → Use `business_entity_notes`
- `supplier_notes` → Use `business_entity_notes`
- `supplier_performance` → Use `business_entity_performance`

## BusinessEntity Structure

### Entity Types
```typescript
entityType: 'supplier' | 'customer' | 'both'
```

### Key Advantages
1. **Unified Structure**: Single source of truth for all business entities
2. **Flexibility**: An entity can be both a customer AND supplier
3. **Consistency**: Same fields and relationships for all entity types
4. **Better Reporting**: Easier to generate unified reports across all entities

## Migration Steps

### Step 1: Database Migration
```sql
-- Migrate existing customers to business_entities
INSERT INTO business_entities (
    id, workspace_id, company_id, entity_type, name, full_name,
    phone, email, website, address, city, country,
    tax_office, tax_number, status, created_at, updated_at
)
SELECT 
    id, workspace_id, company_id, 'customer' as entity_type,
    name, full_name, phone, email, website, address, city, country,
    tax_office, tax_number, status, created_at, updated_at
FROM customers
WHERE NOT EXISTS (
    SELECT 1 FROM business_entities WHERE business_entities.id = customers.id
);

-- Migrate existing suppliers to business_entities
INSERT INTO business_entities (
    id, workspace_id, company_id, entity_type, name, full_name,
    phone, email, website, address, city, country,
    tax_office, tax_number, status, created_at, updated_at,
    supplier_code, lead_time_days, minimum_order_quantity
)
SELECT 
    id, workspace_id, company_id, 'supplier' as entity_type,
    name, full_name, phone, email, website, address, city, country,
    tax_office, tax_number, status, created_at, updated_at,
    supplier_code, lead_time_days, minimum_order_quantity
FROM suppliers
WHERE NOT EXISTS (
    SELECT 1 FROM business_entities WHERE business_entities.id = suppliers.id
);
```

### Step 2: Code Updates

#### Update Imports
Replace:
```typescript
import { customer, customerAddress } from './tables/customers';
import { supplier, supplierAddress } from './tables/suppliers';
```

With:
```typescript
import { businessEntity, businessEntityAddress } from './tables/businessEntity';
```

#### Update Queries
Replace customer queries:
```typescript
// Old
const customers = await db.select().from(customer)
  .where(eq(customer.workspaceId, workspaceId));

// New
const customers = await db.select().from(businessEntity)
  .where(and(
    eq(businessEntity.workspaceId, workspaceId),
    eq(businessEntity.entityType, 'customer')
  ));
```

Replace supplier queries:
```typescript
// Old
const suppliers = await db.select().from(supplier)
  .where(eq(supplier.workspaceId, workspaceId));

// New
const suppliers = await db.select().from(businessEntity)
  .where(and(
    eq(businessEntity.workspaceId, workspaceId),
    or(
      eq(businessEntity.entityType, 'supplier'),
      eq(businessEntity.entityType, 'both')
    )
  ));
```

### Step 3: API Route Updates

Update API endpoints to use businessEntity:
- `/api/customers` → Query businessEntity with entityType filter
- `/api/suppliers` → Query businessEntity with entityType filter

### Step 4: Field Mapping

| Old Customer Field | BusinessEntity Field | Notes |
|-------------------|---------------------|-------|
| customerLogoUrl | logoUrl | Renamed |
| customerType | businessType | Maps to 'individual' or 'company' |
| customerCategory | entityCategory | Direct mapping |
| customerGroup | entityGroup | Direct mapping |
| parentCustomerId | parentEntityId | Direct mapping |

| Old Supplier Field | BusinessEntity Field | Notes |
|-------------------|---------------------|-------|
| supplierLogoUrl | logoUrl | Renamed |
| supplierType | businessType | Maps to 'individual' or 'company' |
| supplierCategory | entityCategory | Direct mapping |
| supplierGroup | entityGroup | Direct mapping |
| parentSupplierId | parentEntityId | Direct mapping |
| supplierCode | supplierCode | Same field exists |

## Benefits After Migration

1. **Single Entity Management**: One interface to manage all business relationships
2. **Dual Relationships**: Entities can be both customers and suppliers
3. **Unified Reporting**: Single query for all entity activities
4. **Reduced Complexity**: Fewer tables and relationships to maintain
5. **Better Performance**: Single indexed table instead of multiple tables
6. **Consistent Features**: All entities get the same features (activities, performance tracking, etc.)

## Rollback Plan

If issues arise:
1. Keep old tables intact during migration (don't drop immediately)
2. Use feature flags to switch between old and new implementation
3. Run both systems in parallel during transition period
4. Only drop old tables after successful production validation

## Timeline

1. **Phase 1**: Add deprecation notices (COMPLETED)
2. **Phase 2**: Update internal code to use businessEntity
3. **Phase 3**: Migrate existing data
4. **Phase 4**: Update API routes
5. **Phase 5**: Monitor and validate
6. **Phase 6**: Remove deprecated tables

## Notes

- The `businessEntity` table already has all necessary fields from both customer and supplier tables
- The orders and talep tables already reference businessEntity
- Defense industry specific fields are included in businessEntity
- Performance tracking is unified in businessEntityPerformance table