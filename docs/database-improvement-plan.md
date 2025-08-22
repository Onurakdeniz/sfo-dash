# Database System Improvement Plan

## Current Issues

1. **Data Duplication**: 
   - Separate `customers` and `suppliers` tables with identical structures
   - `businessEntity` table exists but isn't fully utilized
   - This creates maintenance overhead and data inconsistency risks

2. **Inconsistent References**:
   - Some tables reference `customers`/`suppliers` directly
   - Others reference `businessEntity`
   - Mixed approach causes confusion and complexity

3. **Redundant Relationships**:
   - Multiple ways to represent the same relationships
   - Complex join patterns required for simple queries

## Proposed Improvements

### 1. Consolidate Customer/Supplier into BusinessEntity
- Remove separate `customers` and `suppliers` tables
- Use `businessEntity` as the single source of truth
- Use `entityType` field to distinguish between customer, supplier, or both

### 2. Simplify Relationships
- Update all foreign keys to reference `businessEntity`
- Remove redundant relationship tables
- Streamline the relations file

### 3. Improve Table Structure
- Add missing indexes for performance
- Consolidate address/contact information
- Standardize audit fields across all tables

### 4. Benefits
- **Simpler queries**: One table to query instead of three
- **Consistent data**: No duplication between customer/supplier records
- **Flexibility**: Entities can easily be both customer and supplier
- **Easier maintenance**: Single schema to maintain
- **Better performance**: Fewer joins required

## Migration Steps

1. **Phase 1: Schema Updates**
   - Update businessEntity table with any missing fields
   - Create migration scripts
   - Update all foreign key references

2. **Phase 2: Data Migration**
   - Migrate existing customer data to businessEntity
   - Migrate existing supplier data to businessEntity
   - Handle entities that are both customer and supplier

3. **Phase 3: Code Updates**
   - Update all backend APIs
   - Update database queries
   - Update UI components

4. **Phase 4: Cleanup**
   - Remove old tables
   - Remove obsolete code
   - Update documentation