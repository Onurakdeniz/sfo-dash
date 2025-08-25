# 🚀 Database Migration Guide: Customers & Suppliers to BusinessEntity

## ⚠️ IMPORTANT: Migration Already Exists!
I found that migration file `0015_migrate_customers_suppliers_to_entities.sql` already exists in your project. However, here's the complete guide for running the migration.

## 📋 Pre-Migration Checklist

### 1. **Backup Your Database** (CRITICAL!)
```bash
# PostgreSQL backup
pg_dump -h your_host -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using connection string
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. **Check Current Data**
```sql
-- Check how many records you have
SELECT 'Customers' as type, COUNT(*) as count FROM customers
UNION ALL
SELECT 'Suppliers' as type, COUNT(*) as count FROM suppliers
UNION ALL
SELECT 'Business Entities' as type, COUNT(*) as count FROM business_entities;

-- Check for duplicate IDs between customers and suppliers
SELECT 'Duplicate IDs' as issue, COUNT(*) as count
FROM customers c
INNER JOIN suppliers s ON c.id = s.id;
```

## 🔧 Migration Steps

### Step 1: Generate Migration (If Needed)
```bash
# If you need to regenerate the migration
npm run db:generate

# This will create new migration files in /drizzle folder
```

### Step 2: Review Migration File
The migration file `0015_migrate_customers_suppliers_to_entities.sql` should already handle:
- ✅ Creating business_entities table (if not exists)
- ✅ Migrating all customers to business_entities
- ✅ Migrating all suppliers to business_entities
- ✅ Migrating related tables (addresses, contacts, files, notes)
- ✅ Handling entities that are both customer and supplier

### Step 3: Run Migration

#### Option A: Using Drizzle Kit (Recommended)
```bash
# This will apply all pending migrations
npm run db:migrate

# Or if you use pnpm
pnpm db:migrate
```

#### Option B: Manual SQL Execution
```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration file
\i drizzle/0015_migrate_customers_suppliers_to_entities.sql
```

#### Option C: Using a Migration Script
Create a file `migrate.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log('🚀 Starting migration...');
  
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('✅ Migration completed!');
  await sql.end();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
```

Then run:
```bash
npx tsx migrate.ts
```

## 🔍 Post-Migration Verification

### Step 4: Verify Migration Success

Create `verify-migration.sql`:
```sql
-- 1. Check if all customers were migrated
SELECT 
    'Unmigrated Customers' as check_type,
    COUNT(*) as count
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM business_entities be 
    WHERE be.id = c.id
);

-- 2. Check if all suppliers were migrated
SELECT 
    'Unmigrated Suppliers' as check_type,
    COUNT(*) as count
FROM suppliers s
WHERE NOT EXISTS (
    SELECT 1 FROM business_entities be 
    WHERE be.id = s.id
);

-- 3. Count migrated entities by type
SELECT 
    entity_type,
    COUNT(*) as count
FROM business_entities
GROUP BY entity_type;

-- 4. Check related tables migration
SELECT 
    'Customer Addresses' as table_name,
    (SELECT COUNT(*) FROM customer_addresses) as old_count,
    (SELECT COUNT(*) FROM business_entity_addresses WHERE entity_id IN (
        SELECT id FROM business_entities WHERE entity_type IN ('customer', 'both')
    )) as new_count
UNION ALL
SELECT 
    'Supplier Addresses',
    (SELECT COUNT(*) FROM supplier_addresses),
    (SELECT COUNT(*) FROM business_entity_addresses WHERE entity_id IN (
        SELECT id FROM business_entities WHERE entity_type IN ('supplier', 'both')
    ));

-- 5. Verify dual entities (both customer and supplier)
SELECT 
    be.id,
    be.name,
    be.entity_type
FROM business_entities be
WHERE be.entity_type = 'both';
```

### Step 5: Test Application

```bash
# 1. Start your application
npm run dev

# 2. Test key functionality:
# - List all customers (should query businessEntity with entityType filter)
# - List all suppliers (should query businessEntity with entityType filter)
# - Create new customer (should create businessEntity with entityType='customer')
# - Create new supplier (should create businessEntity with entityType='supplier')
# - View entity details with addresses, contacts, etc.
```

## 🔄 Rollback Plan (If Needed)

If something goes wrong, here's how to rollback:

### Option 1: Restore from Backup
```bash
# Restore the backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### Option 2: Reverse Migration
Create `rollback-migration.sql`:
```sql
-- This is a destructive operation! Only use if absolutely necessary
BEGIN;

-- Remove migrated data from business_entities
DELETE FROM business_entities 
WHERE id IN (SELECT id FROM customers)
   OR id IN (SELECT id FROM suppliers);

-- Remove related data
DELETE FROM business_entity_addresses 
WHERE entity_id IN (SELECT id FROM customers)
   OR entity_id IN (SELECT id FROM suppliers);

DELETE FROM business_entity_contacts 
WHERE entity_id IN (SELECT id FROM customers)
   OR entity_id IN (SELECT id FROM suppliers);

-- Continue for other related tables...

COMMIT;
```

## 📝 Update Application Code

After migration, update your code:

### 1. Update Imports
```typescript
// Old
import { customer, supplier } from '@/db/schema/tables/customers';

// New
import { businessEntity } from '@/db/schema/tables/businessEntity';
```

### 2. Update Queries
```typescript
// Old: Get all customers
const customers = await db.select().from(customer);

// New: Get all customers
const customers = await db.select().from(businessEntity)
  .where(or(
    eq(businessEntity.entityType, 'customer'),
    eq(businessEntity.entityType, 'both')
  ));
```

### 3. Update API Routes
Use the example in `/src/app/api/workspaces/[workspaceId]/business-entities/route.example.ts`

## 🎯 Final Steps

### After Successful Migration:

1. **Monitor for 24-48 hours** - Ensure everything works correctly
2. **Update documentation** - Document the new structure for your team
3. **Plan old table removal** - After 1-2 weeks of stable operation:
   ```sql
   -- Only after thorough testing!
   DROP TABLE IF EXISTS customers CASCADE;
   DROP TABLE IF EXISTS suppliers CASCADE;
   DROP TABLE IF EXISTS customer_addresses CASCADE;
   DROP TABLE IF EXISTS supplier_addresses CASCADE;
   -- etc...
   ```

## 🆘 Troubleshooting

### Common Issues:

1. **Foreign Key Violations**
   ```sql
   -- Check for orphaned records
   SELECT * FROM orders 
   WHERE customer_id NOT IN (SELECT id FROM business_entities);
   ```

2. **Duplicate Key Errors**
   ```sql
   -- Find duplicates
   SELECT id, COUNT(*) 
   FROM business_entities 
   GROUP BY id 
   HAVING COUNT(*) > 1;
   ```

3. **Missing Data After Migration**
   - Check the migration logs
   - Verify source data exists
   - Check for NULL required fields

## 📊 Success Metrics

Your migration is successful when:
- ✅ All customers appear in business_entities with correct entityType
- ✅ All suppliers appear in business_entities with correct entityType
- ✅ All related data (addresses, contacts, etc.) is migrated
- ✅ Application functions normally with new structure
- ✅ No data loss reported
- ✅ Performance is same or better

## 🚨 Emergency Contacts

If you encounter issues:
1. Check migration logs in your database
2. Review the backup before proceeding
3. Test in staging environment first
4. Keep the old tables for at least 2 weeks as safety net

---

**Remember**: Always backup before migration and test in a non-production environment first!